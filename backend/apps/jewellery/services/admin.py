from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any
from uuid import UUID

from django.db import IntegrityError, transaction
from django.db.models import QuerySet

from apps.jewellery.models.admin import AdminControl
from apps.jewellery.models.billing import Customer, SalesInvoice
from apps.jewellery.models.inventory import Item
from apps.jewellery.models.master import Category, Design, NumberSeries, TaxSlab
from apps.jewellery.models.rates import TenantRate


@dataclass(frozen=True)
class TrashEntityConfig:
    model: type
    label_fields: tuple[str, ...]


TRASH_ENTITY_MAP: dict[str, TrashEntityConfig] = {
    "customers": TrashEntityConfig(Customer, ("name", "mobile")),
    "invoices": TrashEntityConfig(SalesInvoice, ("voucher_no", "invoice_type")),
    "items": TrashEntityConfig(Item, ("sku", "huid", "barcode")),
    "categories": TrashEntityConfig(Category, ("name",)),
    "designs": TrashEntityConfig(Design, ("code", "name")),
    "tax-slabs": TrashEntityConfig(TaxSlab, ("name",)),
    "number-series": TrashEntityConfig(NumberSeries, ("voucher_type", "prefix")),
    "rate-overrides": TrashEntityConfig(TenantRate, ("reason",)),
}


def _branch_scoped_controls(tenant, branch_name: str) -> QuerySet[AdminControl]:
    qs = AdminControl.objects.filter(tenant=tenant, deleted_at__isnull=True)
    if branch_name:
        return qs.filter(branch_name__in=[branch_name, ""]).order_by("-branch_name")
    return qs.filter(branch_name="").order_by("-branch_name")


def get_admin_control(tenant, branch_name: str) -> AdminControl | None:
    return _branch_scoped_controls(tenant, branch_name).first()


def get_or_create_admin_control(*, tenant, branch_name: str, actor) -> AdminControl:
    control = AdminControl.objects.filter(
        tenant=tenant,
        branch_name=branch_name,
        deleted_at__isnull=True,
    ).first()
    if control:
        return control
    return AdminControl.objects.create(
        tenant=tenant,
        branch_name=branch_name,
        created_by=actor,
        updated_by=actor,
    )


@transaction.atomic
def patch_feature_flags(*, tenant, branch_name: str, patch: dict[str, bool], actor) -> AdminControl:
    control = get_or_create_admin_control(tenant=tenant, branch_name=branch_name, actor=actor)
    merged = dict(control.feature_flags or {})
    merged.update(patch)
    control.feature_flags = merged
    control.updated_by = actor
    control.save(update_fields=["feature_flags", "updated_by", "updated_at"])
    return control


@transaction.atomic
def set_lock_period(*, tenant, branch_name: str, lock_period_end: date | None, reason: str, actor) -> AdminControl:
    control = get_or_create_admin_control(tenant=tenant, branch_name=branch_name, actor=actor)
    control.lock_period_end = lock_period_end
    control.lock_period_reason = reason if lock_period_end else ""
    control.lock_set_by = actor if lock_period_end else None
    control.updated_by = actor
    control.save(
        update_fields=[
            "lock_period_end",
            "lock_period_reason",
            "lock_set_by",
            "updated_by",
            "updated_at",
        ]
    )
    return control


def ensure_billing_period_open(*, tenant, branch_name: str, voucher_date: date) -> None:
    controls_qs = AdminControl.objects.filter(
        tenant=tenant,
        deleted_at__isnull=True,
    )
    if branch_name:
        controls_qs = controls_qs.filter(branch_name__in=[branch_name, ""])
    else:
        controls_qs = controls_qs.filter(branch_name="")

    # Enforce the strictest applicable lock across global and branch controls.
    control = controls_qs.exclude(lock_period_end__isnull=True).order_by("-lock_period_end").first()
    if not control:
        return
    if voucher_date <= control.lock_period_end:
        raise ValueError(
            f"Billing is locked up to {control.lock_period_end}. "
            "Use a later voucher date or clear the lock period."
        )


def _build_trash_label(instance: Any, fields: tuple[str, ...]) -> str:
    for field_name in fields:
        value = getattr(instance, field_name, None)
        if value:
            return str(value)
    return str(instance.id)


def _list_deleted_for_entity(*, entity: str, tenant, limit: int) -> list[dict[str, Any]]:
    cfg = TRASH_ENTITY_MAP[entity]
    items = (
        cfg.model.objects.filter(tenant=tenant, deleted_at__isnull=False)
        .order_by("-deleted_at")[:limit]
    )
    records: list[dict[str, Any]] = []
    for row in items:
        records.append(
            {
                "entity": entity,
                "id": str(row.id),
                "branch_name": row.branch_name,
                "label": _build_trash_label(row, cfg.label_fields),
                "deleted_at": row.deleted_at,
                "updated_at": row.updated_at,
            }
        )
    return records


def list_trash(*, tenant, entity: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
    scoped_limit = max(1, min(limit, 200))
    entities = [entity] if entity else list(TRASH_ENTITY_MAP.keys())
    rows: list[dict[str, Any]] = []
    for name in entities:
        if name not in TRASH_ENTITY_MAP:
            raise ValueError(f"Unsupported trash entity '{name}'.")
        rows.extend(_list_deleted_for_entity(entity=name, tenant=tenant, limit=scoped_limit))
    rows.sort(key=lambda row: row["deleted_at"] or row["updated_at"], reverse=True)
    return rows[:scoped_limit]


@transaction.atomic
def restore_from_trash(*, tenant, entity: str, object_id: UUID, restored_by) -> Any:
    cfg = TRASH_ENTITY_MAP.get(entity)
    if not cfg:
        raise ValueError(f"Unsupported trash entity '{entity}'.")

    obj = cfg.model.objects.filter(
        tenant=tenant,
        id=object_id,
        deleted_at__isnull=False,
    ).first()
    if obj is None:
        raise LookupError("Record not found in trash.")

    obj.deleted_at = None
    obj.updated_by = restored_by
    try:
        obj.save(update_fields=["deleted_at", "updated_by", "updated_at"])
    except IntegrityError as exc:
        raise ValueError("Cannot restore due to active record conflict.") from exc
    return obj
