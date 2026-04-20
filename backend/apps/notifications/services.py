from __future__ import annotations

from datetime import date

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

    # Keep recipients tenant-scoped and operational only.
    if not recipient_ids:
        return []

    active_users = User.objects.filter(id__in=recipient_ids, is_active=True).exclude(role=RoleChoices.BORROWER)
    return list(active_users.values_list("id", flat=True))


def _build_due_alert_message(loan: Loan, *, days_to_due: int | None, due_date: date | None) -> str:
    borrower_name = loan.borrower.name
    if due_date is None or days_to_due is None:
        return f"Loan for {borrower_name} is nearing due date."
    if days_to_due == 0:
        return f"Loan for {borrower_name} is due today ({due_date})."
    return f"Loan for {borrower_name} is due in {days_to_due} day(s) on {due_date}."


def sync_due_alert_notifications_for_loan(loan: Loan, *, today: date | None = None) -> None:
    current_date = today or timezone.localdate()
    alert_state = getLoanAlertStatus(loan, today=current_date)

    active_qs = Notification.objects.filter(
        loan=loan,
        type=NotificationType.LOAN_DUE_ALERT,
        is_active=True,
    )

    is_eligible = (
        loan.status != LoanStatus.CLOSED
        and (loan.outstanding_balance or 0) > 0
        and alert_state.alert_active
        and alert_state.due_date is not None
    )

    if not is_eligible:
        active_qs.update(is_active=False, resolved_at=timezone.now())
        return

    recipients = _recipient_user_ids_for_loan(loan)
    if not recipients:
        active_qs.update(is_active=False, resolved_at=timezone.now())
        return

    message = _build_due_alert_message(loan, days_to_due=alert_state.days_to_due, due_date=alert_state.due_date)

    # Resolve stale active notifications for the same loan if due date changed.
    active_qs.exclude(due_date=alert_state.due_date).update(is_active=False, resolved_at=timezone.now())

    for user_id in recipients:
        Notification.objects.update_or_create(
            user_id=user_id,
            loan=loan,
            type=NotificationType.LOAN_DUE_ALERT,
            due_date=alert_state.due_date,
            is_active=True,
            defaults={
                "borrower_id": loan.borrower_id,
                "message": message,
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
