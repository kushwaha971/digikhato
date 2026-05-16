from decimal import Decimal
from typing import Optional

from django.db import models, transaction

from apps.collections.models import Collection, CollectionStatus, PaymentMode
from apps.common.id_generator import generate_collection_code
from apps.loans.alerts import sync_loan_due_fields
from apps.loans.models import Loan, LoanStatus
from apps.loans.services import quantize_amount


def _next_unique_collection_code(*, tenant, date) -> Optional[str]:
    if not tenant:
        return None
    for _ in range(20):
        candidate = generate_collection_code(tenant=tenant, date=date)
        if not Collection.objects.filter(collection_code=candidate).exists():
            return candidate
    return None


@transaction.atomic
def create_collection(
    *,
    loan_id: int,
    borrower_id: int,
    amount_paid: Decimal,
    status: Optional[str],
    payment_mode: str,
    reference_id: str,
    notes: str,
    collected_by_id: int,
    date,
    gps_lat=None,
    gps_lng=None,
    sync_status="pending",
):
    loan = Loan.objects.select_for_update().get(id=loan_id, borrower_id=borrower_id)
    tenant = loan.borrower.tenant
    collection_code = _next_unique_collection_code(tenant=tenant, date=date)

    collection = Collection.objects.create(
        collection_code=collection_code,
        loan_id=loan_id,
        borrower_id=borrower_id,
        amount_paid=amount_paid,
        status=_resolve_collection_status(status=status, loan=loan, amount_paid=amount_paid),
        payment_mode=payment_mode or PaymentMode.CASH,
        reference_id=(reference_id or "").strip(),
        notes=notes,
        collected_by_id=collected_by_id,
        date=date,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        sync_status=sync_status,
    )
    _recalculate_loan_balances(loan)
    _sync_due_alert_notifications(loan)
    return collection


@transaction.atomic
def update_collection(
    *,
    collection: Collection,
    amount_paid: Decimal,
    status: Optional[str],
    payment_mode: str,
    reference_id: str,
    notes: str,
    date,
    gps_lat=None,
    gps_lng=None,
):
    loan = Loan.objects.select_for_update().get(id=collection.loan_id)
    collection.amount_paid = amount_paid
    collection.status = _resolve_collection_status(status=status, loan=loan, amount_paid=amount_paid)
    collection.payment_mode = payment_mode or collection.payment_mode or PaymentMode.CASH
    collection.reference_id = (reference_id or "").strip()
    collection.notes = notes
    collection.date = date
    collection.gps_lat = gps_lat
    collection.gps_lng = gps_lng
    collection.save(
        update_fields=[
            "amount_paid",
            "status",
            "payment_mode",
            "reference_id",
            "notes",
            "date",
            "gps_lat",
            "gps_lng",
            "updated_at",
        ]
    )
    _recalculate_loan_balances(loan)
    _sync_due_alert_notifications(loan)
    return collection


@transaction.atomic
def delete_collection(*, collection: Collection):
    loan = Loan.objects.select_for_update().get(id=collection.loan_id)
    collection.delete()
    _recalculate_loan_balances(loan)
    _sync_due_alert_notifications(loan)


def _resolve_collection_status(*, status: Optional[str], loan: Loan, amount_paid: Decimal) -> str:
    if status in CollectionStatus.values:
        return status

    if amount_paid <= Decimal("0"):
        return CollectionStatus.MISSED
    if amount_paid >= (loan.outstanding_balance or Decimal("0")):
        return CollectionStatus.PAID
    return CollectionStatus.PARTIAL


def _recalculate_loan_balances(loan: Loan) -> None:
    total_paid = loan.collections.aggregate(total=models.Sum("amount_paid"))["total"] or Decimal("0")
    loan.paid_amount = quantize_amount(total_paid)
    loan.outstanding_balance = quantize_amount(max(loan.total_amount - loan.paid_amount, Decimal("0")))
    loan.status = LoanStatus.CLOSED if loan.outstanding_balance == Decimal("0") else LoanStatus.ACTIVE
    sync_loan_due_fields(loan, persist=False)
    loan.save(update_fields=["paid_amount", "outstanding_balance", "status", "due_date", "alert_active", "updated_at"])


def _sync_due_alert_notifications(loan: Loan) -> None:
    try:
        from apps.notifications.services import sync_due_alert_notifications_for_loan
    except Exception:
        return
    sync_due_alert_notifications_for_loan(loan)
