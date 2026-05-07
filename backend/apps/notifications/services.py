from __future__ import annotations

from datetime import date
from typing import Optional

from django.utils import timezone

from apps.common.constants import RoleChoices
from apps.loans.alerts import getLoanAlertStatus
from apps.loans.models import Loan, LoanStatus
from apps.notifications.models import Notification, NotificationType
from apps.users.models import User


def _recipient_user_ids_for_loan(loan: Loan) -> list[int]:
    recipient_ids: set[int] = set()

    tenant = loan.borrower.tenant
    if tenant and tenant.is_active:
        recipient_ids.add(tenant.id)

    assigned_agent_id = loan.borrower.assigned_agent_id
    if assigned_agent_id:
        recipient_ids.add(assigned_agent_id)

    borrower_user_id = loan.borrower.user_id
    if borrower_user_id:
        recipient_ids.add(borrower_user_id)

    # Keep recipients tenant-scoped and operational only.
    if not recipient_ids:
        return []

    active_users = User.objects.filter(id__in=recipient_ids, is_active=True)
    return list(active_users.values_list("id", flat=True))


def _effective_tenant_for_user(user):
    if user.role == RoleChoices.ADMIN:
        return user
    if user.role in (RoleChoices.COLLECTOR, RoleChoices.BORROWER) and user.tenant_id:
        return user.tenant
    return None


def sync_due_alert_notifications_for_user(*, user) -> int:
    tenant = _effective_tenant_for_user(user)

    # Super admins are platform-level users and are not direct recipients
    # of borrower-level due alert notifications.
    if user.role == RoleChoices.SUPER_ADMIN:
        return 0

    loans = Loan.objects.select_related("borrower", "borrower__tenant")

    if tenant:
        loans = loans.filter(borrower__tenant=tenant)

    if user.role == RoleChoices.COLLECTOR:
        loans = loans.filter(borrower__assigned_agent_id=user.id)
    elif user.role == RoleChoices.BORROWER:
        borrower_profile = getattr(user, "borrower_profile", None)
        if not borrower_profile:
            return 0
        loans = loans.filter(borrower=borrower_profile)

    synced_loans = 0
    for loan in loans.iterator():
        sync_due_alert_notifications_for_loan(loan)
        synced_loans += 1
    return synced_loans


def _build_due_alert_message(
    loan: Loan, *, days_to_due: Optional[int], due_date: Optional[date], role: str, is_overdue: bool
) -> str:
    borrower_name = loan.borrower.name
    if role == RoleChoices.BORROWER:
        if is_overdue:
            return f"Your repayment is overdue since {due_date}."
        if due_date is None or days_to_due is None:
            return "Your repayment due date is approaching."
        if days_to_due == 0:
            return f"Your repayment is due today ({due_date})."
        return f"Your repayment is due in {days_to_due} day(s) on {due_date}."

    if role == RoleChoices.COLLECTOR:
        if is_overdue:
            return f"Overdue loan for {borrower_name}. Immediate follow-up needed."
        if due_date is None or days_to_due is None:
            return f"Follow up with {borrower_name} for upcoming repayment."
        if days_to_due == 0:
            return f"Collection task: {borrower_name} has repayment due today."
        return f"Follow up: {borrower_name} due in {days_to_due} day(s) on {due_date}."

    # Admin / super_admin
    if is_overdue:
        return f"Escalation: {borrower_name} loan is overdue since {due_date}."
    if due_date is None or days_to_due is None:
        return f"System update: {borrower_name} loan due window opened."
    if days_to_due == 0:
        return f"System activity: {borrower_name} repayment due today."
    return f"Overall update: {borrower_name} due in {days_to_due} day(s) on {due_date}."


def _notification_type_for_role(*, role: str, is_overdue: bool, days_to_due: Optional[int]) -> str:
    if role == RoleChoices.BORROWER:
        if is_overdue:
            return NotificationType.OVERDUE_ALERT
        if days_to_due == 0:
            return NotificationType.DUE_ALERT
        return NotificationType.REPAYMENT_REMINDER

    if role == RoleChoices.COLLECTOR:
        if is_overdue:
            return NotificationType.OVERDUE_LOAN
        if days_to_due == 0:
            return NotificationType.COLLECTION_TASK
        return NotificationType.FOLLOW_UP

    if is_overdue:
        return NotificationType.ESCALATION
    if days_to_due == 0:
        return NotificationType.SYSTEM_ACTIVITY
    return NotificationType.SYSTEM_UPDATE


def _redirect_target_for_role(*, role: str, loan: Loan) -> str:
    if role == RoleChoices.BORROWER:
        return "/portal"
    borrower_uuid = getattr(loan.borrower, "uuid", None)
    if borrower_uuid:
        return f"/borrowers/{borrower_uuid}"
    return "/borrowers"


def sync_due_alert_notifications_for_loan(loan: Loan, *, today: Optional[date] = None) -> None:
    current_date = today or timezone.localdate()
    alert_state = getLoanAlertStatus(loan, today=current_date)

    active_qs = Notification.objects.filter(
        loan=loan,
        is_active=True,
    )

    is_eligible = (
        loan.status != LoanStatus.CLOSED
        and (loan.outstanding_balance or 0) > 0
        and (alert_state.alert_active or alert_state.is_overdue)
        and alert_state.due_date is not None
    )

    if not is_eligible:
        active_qs.update(is_active=False, resolved_at=timezone.now())
        return

    recipients = _recipient_user_ids_for_loan(loan)
    if not recipients:
        active_qs.update(is_active=False, resolved_at=timezone.now())
        return

    # Resolve stale active notifications for the same loan if due date changed.
    active_qs.exclude(due_date=alert_state.due_date).update(is_active=False, resolved_at=timezone.now())

    for user_id in recipients:
        user = User.objects.filter(id=user_id).only("id", "role").first()
        if not user:
            continue

        notification_type = _notification_type_for_role(
            role=user.role,
            is_overdue=alert_state.is_overdue,
            days_to_due=alert_state.days_to_due,
        )
        message = _build_due_alert_message(
            loan,
            days_to_due=alert_state.days_to_due,
            due_date=alert_state.due_date,
            role=user.role,
            is_overdue=alert_state.is_overdue,
        )
        redirect_target = _redirect_target_for_role(role=user.role, loan=loan)
        external_key = f"loan:{loan.id}:{notification_type}:{alert_state.due_date}"

        Notification.objects.update_or_create(
            user_id=user_id,
            external_key=external_key,
            is_active=True,
            defaults={
                "role": user.role,
                "loan": loan,
                "borrower_id": loan.borrower_id,
                "type": notification_type,
                "message": message,
                "redirect_target": redirect_target,
                "due_date": alert_state.due_date,
                "is_read": False,
                "resolved_at": None,
            },
        )


def mark_notification_read(*, notification: Notification) -> Notification:
    if not notification.is_read:
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])
    return notification


def mark_all_notifications_read(*, user) -> int:
    return Notification.objects.filter(user=user, is_active=True, is_read=False).update(is_read=True, updated_at=timezone.now())
