from datetime import date
from decimal import Decimal
from typing import Optional

from apps.collections.models import Collection
from apps.common.constants import RoleChoices
from apps.loans.alerts import derive_payment_status, overdue_loans_queryset
from apps.loans.models import Loan
from apps.users.views import get_effective_tenant


def get_scoped_querysets(user):
    tenant = get_effective_tenant(user)
    loans_qs = Loan.objects.select_related("borrower", "borrower__assigned_agent")
    collections_qs = Collection.objects.select_related("borrower", "loan", "collected_by", "borrower__assigned_agent")

    if tenant:
        loans_qs = loans_qs.filter(borrower__tenant=tenant)
        collections_qs = collections_qs.filter(borrower__tenant=tenant)

    if user.role == RoleChoices.COLLECTOR:
        loans_qs = loans_qs.filter(borrower__assigned_agent_id=user.id)
        collections_qs = collections_qs.filter(borrower__assigned_agent_id=user.id)
    elif user.role == RoleChoices.BORROWER:
        borrower_profile = getattr(user, "borrower_profile", None)
        if borrower_profile:
            loans_qs = loans_qs.filter(borrower=borrower_profile)
            collections_qs = collections_qs.filter(borrower=borrower_profile)
        else:
            loans_qs = loans_qs.none()
            collections_qs = collections_qs.none()

    return loans_qs, collections_qs


def apply_collection_filters(qs, *, params: dict):
    if params.get("date"):
        qs = qs.filter(date=params["date"])
    if params.get("from_date"):
        qs = qs.filter(date__gte=params["from_date"])
    if params.get("to_date"):
        qs = qs.filter(date__lte=params["to_date"])
    if params.get("borrower"):
        qs = qs.filter(borrower_id=params["borrower"])
    if params.get("agent"):
        qs = qs.filter(borrower__assigned_agent_id=params["agent"])
    if params.get("status"):
        qs = qs.filter(status=params["status"])
    if params.get("payment_mode"):
        qs = qs.filter(payment_mode=params["payment_mode"])
    return qs


def apply_loan_filters(qs, *, params: dict):
    if params.get("from_date"):
        qs = qs.filter(start_date__gte=params["from_date"])
    if params.get("to_date"):
        qs = qs.filter(start_date__lte=params["to_date"])
    if params.get("borrower"):
        qs = qs.filter(borrower_id=params["borrower"])
    if params.get("agent"):
        qs = qs.filter(borrower__assigned_agent_id=params["agent"])
    if params.get("status"):
        qs = qs.filter(status=params["status"])
    return qs


def get_overdue_loans(qs, *, today: Optional[date] = None):
    return overdue_loans_queryset(qs, today=today)


def serialize_collection_row(collection):
    return {
        "id": collection.id,
        "collection_code": collection.collection_code,
        "borrower_name": collection.borrower.name,
        "loan_id": collection.loan_id,
        "payment": str(collection.amount_paid),
        "status": collection.status,
        "payment_mode": collection.payment_mode,
        "reference_id": collection.reference_id,
        "payment_status": derive_payment_status(
            total_amount=collection.loan.total_amount,
            paid_amount=collection.loan.paid_amount,
        ),
        "date": str(collection.date),
    }


def serialize_loan_row(loan):
    return {
        "id": loan.id,
        "loan_code": loan.loan_code,
        "borrower_name": loan.borrower.name,
        "amount_given": str(loan.principal),
        "amount_paid": str(loan.paid_amount),
        "outstanding_amount": str(loan.outstanding_balance),
        "status": loan.status,
        "payment_status": derive_payment_status(total_amount=loan.total_amount, paid_amount=loan.paid_amount),
        "start_date": str(loan.start_date),
        "due_date": str(loan.due_date) if loan.due_date else None,
        "alert_active": loan.alert_active,
    }


def decimal_or_zero(value):
    return value or Decimal("0.00")
