"""Inventory business logic for Jewellery ERP (Phase B-1.3)."""

from django.db import transaction
from django.utils import timezone

from apps.jewellery.models.inventory import Item, StockMovement, StockTake, Transfer


def _choice_value(choices, raw_value: str) -> str:
    """Return a validated enum value from a model choices iterable."""
    allowed = {value for value, _ in choices}
    if raw_value not in allowed:
        raise ValueError(f"Invalid choice {raw_value!r}; expected one of {sorted(allowed)!r}")
    return raw_value


ITEM_STATUS_IN_STOCK = Item._meta.get_field("status").default
ITEM_STATUS_WRITTEN_OFF = _choice_value(Item.STATUS, "WRITTEN_OFF")
ITEM_STATUS_TRANSIT = _choice_value(Item.STATUS, "TRANSIT")

TRANSFER_STATUS_REQUESTED = Transfer._meta.get_field("status").default
TRANSFER_STATUS_APPROVED = _choice_value(Transfer.STATUS, "APPROVED")
TRANSFER_STATUS_IN_TRANSIT = _choice_value(Transfer.STATUS, "IN_TRANSIT")
TRANSFER_STATUS_RECEIVED = _choice_value(Transfer.STATUS, "RECEIVED")
TRANSFER_STATUS_REJECTED = _choice_value(Transfer.STATUS, "REJECTED")
TRANSFER_REJECTABLE_STATUSES = (TRANSFER_STATUS_REQUESTED, TRANSFER_STATUS_APPROVED)

STOCK_TAKE_STATUS_IN_PROGRESS = StockTake._meta.get_field("status").default
STOCK_TAKE_STATUS_COMPLETED = _choice_value(StockTake.STATUS, "COMPLETED")

STOCK_MOVEMENT_TYPE_WRITE_OFF = _choice_value(StockMovement.MOVEMENT_TYPES, "WRITE_OFF")
STOCK_MOVEMENT_TYPE_TRANSFER_OUT = _choice_value(StockMovement.MOVEMENT_TYPES, "TRANSFER_OUT")
STOCK_MOVEMENT_TYPE_TRANSFER_IN = _choice_value(StockMovement.MOVEMENT_TYPES, "TRANSFER_IN")


def write_off_item(item: Item, reason: str, performed_by) -> StockMovement:
    """
    Write off a jewellery item: set status → WRITTEN_OFF and record a WRITE_OFF StockMovement.
    Must be called inside a transaction.
    """
    if item.status != ITEM_STATUS_IN_STOCK:
        raise ValueError(f"Only IN_STOCK items can be written off. Current status: {item.status}")

    with transaction.atomic():
        movement = StockMovement.objects.create(
            tenant=item.tenant,
            branch_name=item.branch_name,
            created_by=performed_by,
            updated_by=performed_by,
            item=item,
            movement_type=STOCK_MOVEMENT_TYPE_WRITE_OFF,
            reference_type="write_off",
            qty=1,
            weight=item.net_wt,
            ts=timezone.now(),
            notes=reason,
        )
        item.status = ITEM_STATUS_WRITTEN_OFF
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
        stock_take.status = STOCK_TAKE_STATUS_COMPLETED
        stock_take.completed_at = timezone.now()
        stock_take.save(update_fields=["status", "completed_at", "updated_at"])


def dispatch_transfer(transfer, dispatched_by) -> None:
    """Advance a Transfer from APPROVED → IN_TRANSIT and update item statuses."""
    if transfer.status != TRANSFER_STATUS_APPROVED:
        raise ValueError(f"Transfer must be APPROVED before dispatch. Current: {transfer.status}")

    with transaction.atomic():
        for line in transfer.lines.select_related("item"):
            item = line.item
            if item.status != ITEM_STATUS_IN_STOCK:
                raise ValueError(
                    f"Item {item.sku or item.id} is not IN_STOCK and cannot be dispatched."
                )
            if item.branch_name != transfer.from_branch:
                raise ValueError(
                    f"Item {item.sku or item.id} is in branch '{item.branch_name}', expected '{transfer.from_branch}'."
                )
            if item.tenant_id != transfer.tenant_id:
                raise ValueError(f"Item {item.sku or item.id} does not belong to transfer tenant.")
            item.status = ITEM_STATUS_TRANSIT
            item.updated_by = dispatched_by
            item.save(update_fields=["status", "updated_by", "updated_at"])

            StockMovement.objects.create(
                tenant=transfer.tenant,
                branch_name=transfer.from_branch,
                created_by=dispatched_by,
                updated_by=dispatched_by,
                item=item,
                movement_type=STOCK_MOVEMENT_TYPE_TRANSFER_OUT,
                reference_type="transfer",
                reference_id=transfer.id,
                qty=line.qty,
                weight=line.weight,
                ts=timezone.now(),
            )

        transfer.status = TRANSFER_STATUS_IN_TRANSIT
        transfer.dispatched_at = timezone.now()
        transfer.updated_by = dispatched_by
        transfer.save(update_fields=["status", "dispatched_at", "updated_by", "updated_at"])


def receive_transfer(transfer, received_by) -> None:
    """Advance a Transfer from IN_TRANSIT → RECEIVED and update item statuses + branch."""
    if transfer.status != TRANSFER_STATUS_IN_TRANSIT:
        raise ValueError(f"Transfer must be IN_TRANSIT to receive. Current: {transfer.status}")

    with transaction.atomic():
        for line in transfer.lines.select_related("item"):
            item = line.item
            item.status = ITEM_STATUS_IN_STOCK
            item.branch_name = transfer.to_branch
            item.updated_by = received_by
            item.save(update_fields=["status", "branch_name", "updated_by", "updated_at"])

            StockMovement.objects.create(
                tenant=transfer.tenant,
                branch_name=transfer.to_branch,
                created_by=received_by,
                updated_by=received_by,
                item=item,
                movement_type=STOCK_MOVEMENT_TYPE_TRANSFER_IN,
                reference_type="transfer",
                reference_id=transfer.id,
                qty=line.qty,
                weight=line.weight,
                ts=timezone.now(),
            )

        transfer.status = TRANSFER_STATUS_RECEIVED
        transfer.received_at = timezone.now()
        transfer.updated_by = received_by
        transfer.save(update_fields=["status", "received_at", "updated_by", "updated_at"])
