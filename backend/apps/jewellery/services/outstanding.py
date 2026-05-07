"""Party Outstanding service (Phase B-2.4)."""

from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Q

from apps.jewellery.models.outstanding import PartyOutstandingBalance, PartyOutstandingMovement


def get_or_create_balance(tenant, customer) -> PartyOutstandingBalance:
    """Get or atomically create the balance record for a customer."""
    with transaction.atomic():
        balance, _ = PartyOutstandingBalance.objects.get_or_create(
            customer=customer,
            defaults={
                "tenant": tenant,
                "branch_name": customer.branch_name,
                "created_by": None,
                "updated_by": None,
                "amount_balance": Decimal("0"),
                "metal_balance_grams": Decimal("0"),
                "last_txn_date": None,
            },
        )
    return balance


def post_movement(
    tenant,
    customer,
    movement_type: str,
    amount_delta: Decimal = Decimal("0"),
    metal_delta_grams: Decimal = Decimal("0"),
    reference_type: str = "",
    reference_id: str = "",
    notes: str = "",
    txn_date=None,
    created_by=None,
) -> PartyOutstandingMovement:
    """
    Create a movement record AND update PartyOutstandingBalance atomically.
    Uses select_for_update() to prevent race conditions.
    txn_date defaults to today.
    """
    if txn_date is None:
        txn_date = date.today()

    with transaction.atomic():
        # Ensure balance exists first (outside the select_for_update to avoid deadlock on creation)
        get_or_create_balance(tenant, customer)

        # Now lock the row for update
        balance = PartyOutstandingBalance.objects.select_for_update().get(
            customer=customer,
        )

        movement = PartyOutstandingMovement.objects.create(
            tenant=tenant,
            branch_name=customer.branch_name,
            created_by=created_by,
            updated_by=created_by,
            balance=balance,
            movement_type=movement_type,
            amount_delta=amount_delta,
            metal_delta_grams=metal_delta_grams,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes,
            txn_date=txn_date,
        )

        balance.amount_balance += amount_delta
        balance.metal_balance_grams += metal_delta_grams
        if balance.last_txn_date is None or txn_date > balance.last_txn_date:
            balance.last_txn_date = txn_date
        balance.updated_by = created_by
        balance.save(update_fields=[
            "amount_balance", "metal_balance_grams", "last_txn_date",
            "updated_by", "updated_at",
        ])

    return movement


def get_ageing_report(
    tenant,
    branch_name: str = "",
    customer_id: str = "",
    ageing: str = "",
    include_zero: bool = True,
) -> list[dict]:
    """
    Returns list of:
    {
        customer_id, customer_name, mobile,
        amount_balance, metal_balance_grams,
        last_txn_date,
        overdue_90_plus: bool  # True if last_txn_date > 90 days ago
    }
    Ordered by amount_balance descending.
    """
    from datetime import timedelta

    cutoff = date.today() - timedelta(days=90)

    qs = PartyOutstandingBalance.objects.filter(
        tenant=tenant,
        deleted_at__isnull=True,
    ).select_related("customer")

    if branch_name:
        qs = qs.filter(branch_name=branch_name)
    if customer_id:
        qs = qs.filter(customer_id=customer_id)
    if not include_zero:
        qs = qs.exclude(Q(amount_balance=Decimal("0")) & Q(metal_balance_grams=Decimal("0")))

    qs = qs.order_by("-amount_balance")

    result = []
    for balance in qs:
        customer = balance.customer
        last_txn = balance.last_txn_date
        overdue_90_plus = bool(last_txn and last_txn <= cutoff)
        age_days = (date.today() - last_txn).days if last_txn else 0
        if age_days <= 30:
            ageing_bucket = "0_30"
        elif age_days <= 60:
            ageing_bucket = "31_60"
        elif age_days <= 90:
            ageing_bucket = "61_90"
        else:
            ageing_bucket = "90_plus"

        if ageing:
            age_filter = ageing.strip().lower()
            matched = (
                (age_filter == "30" and ageing_bucket == "0_30")
                or (age_filter == "60" and ageing_bucket == "31_60")
                or (age_filter == "90" and ageing_bucket == "61_90")
                or (age_filter in ("90+", "90_plus", "overdue") and ageing_bucket == "90_plus")
            )
            if not matched:
                continue
        result.append({
            "id": str(balance.id),
            "customer_id": str(customer.id),
            "customer_name": customer.name,
            "mobile": customer.mobile,
            "amount_balance": balance.amount_balance,
            "metal_balance_grams": balance.metal_balance_grams,
            "last_txn_date": last_txn,
            "overdue_90_plus": overdue_90_plus,
            "age_days": age_days,
            "ageing_bucket": ageing_bucket,
        })

    return result
