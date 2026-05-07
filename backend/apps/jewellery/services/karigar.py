"""Karigar workflow services — formula 7.18."""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone


def reconcile_tunch(
    gross_issued: Decimal,
    issued_tunch_pct: Decimal,
    gross_received: Decimal,
    stone_wt: Decimal,
    final_purity_pct: Decimal,
    allowed_wastage_pct: Decimal,
) -> dict:
    """
    Returns reconciliation result per formula 7.18.
    diff_pure < 0 means karigar owes metal.
    diff_pure > 0 means karigar has excess (rare).
    """
    pure_issued = gross_issued * (issued_tunch_pct / Decimal("99.9"))
    pure_received = (gross_received - stone_wt) * (final_purity_pct / Decimal("99.9"))
    allowed_wastage = pure_issued * (allowed_wastage_pct / Decimal("100"))
    expected_received = pure_issued - allowed_wastage
    diff_pure = pure_received - expected_received
    return {
        "pure_issued": pure_issued,
        "pure_received": pure_received,
        "allowed_wastage_pure": allowed_wastage,
        "expected_pure_received": expected_received,
        "diff_pure": diff_pure,
    }


@transaction.atomic
def create_karigar_issue(tenant, branch_name, karigar, order, data, created_by):
    """Create KarigarIssue and compute pure_gold_wt_issued."""
    from apps.jewellery.models.karigar import KarigarIssue
    from apps.jewellery.services.number_series import get_next_number

    pure_wt = Decimal(str(data["gross_wt_issued"])) * (Decimal(str(data["tunch_pct"])) / Decimal("99.9"))
    voucher_no = get_next_number(tenant=tenant, branch_name=branch_name, voucher_type="KARIGAR_ISSUE")
    issue = KarigarIssue.objects.create(
        tenant=tenant,
        branch_name=branch_name,
        voucher_no=voucher_no,
        date=data.get("date") or timezone.localdate(),
        karigar=karigar,
        order=order,
        metal=data["metal"],
        gross_wt_issued=data["gross_wt_issued"],
        tunch_pct=data["tunch_pct"],
        pure_gold_wt_issued=pure_wt.quantize(Decimal("0.0001")),
        items_json=data.get("items_json", []),
        notes=data.get("notes", ""),
        created_by=created_by,
        updated_by=created_by,
    )
    return issue


@transaction.atomic
def create_karigar_receipt(tenant, branch_name, issue, data, created_by):
    """Create KarigarReceipt and run tunch reconciliation."""
    from apps.jewellery.models.karigar import KarigarReceipt
    from apps.jewellery.services.number_series import get_next_number

    reconcile = reconcile_tunch(
        gross_issued=issue.gross_wt_issued,
        issued_tunch_pct=issue.tunch_pct,
        gross_received=Decimal(str(data["gross_wt_received"])),
        stone_wt=Decimal(str(data.get("stone_wt", 0))),
        final_purity_pct=Decimal(str(data.get("final_purity_pct", issue.tunch_pct))),
        allowed_wastage_pct=issue.karigar.default_wastage_pct,
    )
    pure_received = reconcile["pure_received"].quantize(Decimal("0.0001"))
    voucher_no = get_next_number(tenant=tenant, branch_name=branch_name, voucher_type="KARIGAR_RECEIPT")
    receipt = KarigarReceipt.objects.create(
        tenant=tenant,
        branch_name=branch_name,
        voucher_no=voucher_no,
        date=data.get("date") or timezone.localdate(),
        karigar=issue.karigar,
        issue=issue,
        gross_wt_received=data["gross_wt_received"],
        net_wt=data.get("net_wt", data["gross_wt_received"]),
        stone_wt=data.get("stone_wt", 0),
        final_purity_pct=data.get("final_purity_pct", issue.tunch_pct),
        pure_gold_wt_received=pure_received,
        wastage_actual_pct=data.get("wastage_actual_pct", 0),
        labour_amount=data.get("labour_amount", 0),
        pure_diff=reconcile["diff_pure"].quantize(Decimal("0.0001")),
        created_by=created_by,
        updated_by=created_by,
    )
    return receipt, reconcile


def advance_order_status(order, new_status):
    """Validate and advance order status per VALID_TRANSITIONS."""
    from apps.jewellery.models.karigar import VALID_TRANSITIONS
    allowed = VALID_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise ValueError(f"Cannot transition order from {order.status} to {new_status}.")
    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    return order
