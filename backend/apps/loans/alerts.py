from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from django.utils import timezone

from apps.loans.models import Loan, LoanStatus


PAYMENT_STATUS_PAID = "paid"
PAYMENT_STATUS_PARTIAL = "partial"
PAYMENT_STATUS_UNPAID = "unpaid"
ALERT_WINDOW_DAYS = 5


@dataclass(frozen=True)
class LoanAlertStatus:
    due_date: Optional[date]
    days_to_due: Optional[int]
    is_overdue: bool
    alert_active: bool


def calculate_due_date(start_date: date, tenure_days: Optional[int]) -> Optional[date]:
    if not start_date or not tenure_days:
        return None
    # Tenure is inclusive of start date.
    return start_date + timedelta(days=max(tenure_days - 1, 0))


def derive_payment_status(*, total_amount: Decimal, paid_amount: Decimal) -> str:
    total = total_amount or Decimal("0")
    paid = paid_amount or Decimal("0")
    if total <= Decimal("0"):
        return PAYMENT_STATUS_PAID
    if paid <= Decimal("0"):
        return PAYMENT_STATUS_UNPAID
    if paid >= total:
        return PAYMENT_STATUS_PAID
    return PAYMENT_STATUS_PARTIAL


def getLoanAlertStatus(loan: Loan, *, today: Optional[date] = None, window_days: int = ALERT_WINDOW_DAYS) -> LoanAlertStatus:
    current_date = today or timezone.localdate()
    due_date = loan.due_date or calculate_due_date(loan.start_date, loan.tenure_days)

    if due_date is None:
        return LoanAlertStatus(due_date=None, days_to_due=None, is_overdue=False, alert_active=False)

    days_to_due = (due_date - current_date).days
    has_outstanding = (loan.outstanding_balance or Decimal("0")) > Decimal("0")
    is_closed = loan.status == LoanStatus.CLOSED or not has_outstanding

    is_overdue = (not is_closed) and days_to_due < 0
    alert_active = (not is_closed) and (0 <= days_to_due <= window_days)
    return LoanAlertStatus(
        due_date=due_date,
        days_to_due=days_to_due,
        is_overdue=is_overdue,
        alert_active=alert_active,
    )


def sync_loan_due_fields(loan: Loan, *, today: Optional[date] = None, persist: bool = True) -> LoanAlertStatus:
    current_date = today or timezone.localdate()
    alert_state = getLoanAlertStatus(loan, today=current_date)

    has_outstanding = (loan.outstanding_balance or Decimal("0")) > Decimal("0")
    if not has_outstanding:
        next_status = LoanStatus.CLOSED
    elif alert_state.is_overdue:
        next_status = LoanStatus.OVERDUE
    else:
        next_status = LoanStatus.ACTIVE

    dirty_fields = []
    if loan.due_date != alert_state.due_date:
        loan.due_date = alert_state.due_date
        dirty_fields.append("due_date")
    if loan.alert_active != alert_state.alert_active:
        loan.alert_active = alert_state.alert_active
        dirty_fields.append("alert_active")
    if loan.status != next_status:
        loan.status = next_status
        dirty_fields.append("status")

    if persist and dirty_fields:
        loan.save(update_fields=[*dirty_fields, "updated_at"])

    return alert_state


def overdue_loans_queryset(queryset, *, today: Optional[date] = None):
    current_date = today or timezone.localdate()
    return queryset.filter(
        due_date__isnull=False,
        due_date__lt=current_date,
        outstanding_balance__gt=Decimal("0"),
    ).exclude(status=LoanStatus.CLOSED)


def upcoming_due_loans_queryset(queryset, *, days: int = ALERT_WINDOW_DAYS, today: Optional[date] = None):
    current_date = today or timezone.localdate()
    return queryset.filter(
        due_date__isnull=False,
        due_date__gte=current_date,
        due_date__lte=current_date + timedelta(days=days),
        outstanding_balance__gt=Decimal("0"),
    ).exclude(status=LoanStatus.CLOSED)
