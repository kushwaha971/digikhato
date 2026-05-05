"""Inventory business logic for Jewellery ERP (Phase B-1.3)."""

from django.db import transaction
from django.utils import timezone

from apps.jewellery.models.inventory import Item, StockMovement


def write_off_item(item: Item, reason: str, performed_by) -> StockMovement:
    """
    Write off a jewellery item: set status → WRITTEN_OFF and record a WRITE_OFF StockMovement.
    Must be called inside a transaction.
    """
    if item.status != "IN_STOCK":
        raise ValueError(f"Only IN_STOCK items can be written off. Current status: {item.status}")

    with transaction.atomic():
        movement = StockMovement.objects.create(
            tenant=item.tenant,
            branch_name=item.branch_name,
            created_by=performed_by,
            updated_by=performed_by,
            item=item,
            movement_type="WRITE_OFF",
            reference_type="write_off",
            qty=1,
            weight=item.net_wt,
            ts=timezone.now(),
            notes=reason,
        )
        item.status = "WRITTEN_OFF"
        item.updated_by = performed_by
        item.save(update_fields=["status", "updated_by", "updated_at"])

    return movement


def scan_item(tenant, code: str) -> Item:
    """
    Resolve a scan code (barcode / SKU / HUID) to a live Item for the tenant.
    Raises Item.DoesNotExist if not found.
    """
    qs = Item.objects.filter(tenant=tenant, deleted_at__isnull=True).select_related(
        "design", "metal", "purity"
    )
    # Try each identifier in priority order
    for lookup in [{"barcode": code}, {"huid": code}, {"sku": code}]:
        try:
            return qs.get(**lookup)
        except Item.DoesNotExist:
            continue
    raise Item.DoesNotExist(f"No item found for scan code: {code!r}")


def complete_stock_take(stock_take) -> None:
    """
    Finalise a StockTake: compute variance on each line, mark status → COMPLETED.
    """
    from apps.jewellery.models.inventory import StockTakeLine

    with transaction.atomic():
        lines = StockTakeLine.objects.filter(stock_take=stock_take).select_for_update()
        for line in lines:
            if line.counted_wt is not None:
                line.variance = (line.counted_wt or 0) - line.system_wt
                line.save(update_fields=["variance"])
        stock_take.status = "COMPLETED"
        stock_take.completed_at = timezone.now()
        stock_take.save(update_fields=["status", "completed_at", "updated_at"])


def dispatch_transfer(transfer, dispatched_by) -> None:
    """Advance a Transfer from APPROVED → IN_TRANSIT and update item statuses."""
    if transfer.status != "APPROVED":
        raise ValueError(f"Transfer must be APPROVED before dispatch. Current: {transfer.status}")

    with transaction.atomic():
        for line in transfer.lines.select_related("item"):
            item = line.item
            item.status = "TRANSIT"
            item.updated_by = dispatched_by
            item.save(update_fields=["status", "updated_by", "updated_at"])

            StockMovement.objects.create(
                tenant=transfer.tenant,
                branch_name=transfer.from_branch,
                created_by=dispatched_by,
                updated_by=dispatched_by,
                item=item,
                movement_type="TRANSFER_OUT",
                reference_type="transfer",
                reference_id=transfer.id,
                qty=line.qty,
                weight=line.weight,
                ts=timezone.now(),
            )

        transfer.status = "IN_TRANSIT"
        transfer.dispatched_at = timezone.now()
        transfer.updated_by = dispatched_by
        transfer.save(update_fields=["status", "dispatched_at", "updated_by", "updated_at"])


def receive_transfer(transfer, received_by) -> None:
    """Advance a Transfer from IN_TRANSIT → RECEIVED and update item statuses + branch."""
    if transfer.status != "IN_TRANSIT":
        raise ValueError(f"Transfer must be IN_TRANSIT to receive. Current: {transfer.status}")

    with transaction.atomic():
        for line in transfer.lines.select_related("item"):
            item = line.item
            item.status = "IN_STOCK"
            item.branch_name = transfer.to_branch
            item.updated_by = received_by
            item.save(update_fields=["status", "branch_name", "updated_by", "updated_at"])

            StockMovement.objects.create(
                tenant=transfer.tenant,
                branch_name=transfer.to_branch,
                created_by=received_by,
                updated_by=received_by,
                item=item,
                movement_type="TRANSFER_IN",
                reference_type="transfer",
                reference_id=transfer.id,
                qty=line.qty,
                weight=line.weight,
                ts=timezone.now(),
            )

        transfer.status = "RECEIVED"
        transfer.received_at = timezone.now()
        transfer.updated_by = received_by
        transfer.save(update_fields=["status", "received_at", "updated_by", "updated_at"])
