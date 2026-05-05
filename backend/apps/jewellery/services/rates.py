"""MCX rate derivation and tenant rate management (Phase B-1.4).

All formulas from DK-JWL-00-COMPLETE §7.1.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from django.utils import timezone

from apps.jewellery.models.master import Metal, Purity
from apps.jewellery.models.rates import RateHistory, TenantRate

_STALE_THRESHOLD_MINUTES = 5


def calculate_gold_rate(
    mcx_rate_per_10g: Decimal,
    purity_pct: Decimal,
    markup_pct: Decimal = Decimal("0"),
) -> Decimal:
    """
    Derive sell rate per gram for a given purity from the MCX 24K/999 rate.

    Formula (§7.1):
        sell_rate = (mcx_per_10g / 10) × (purity_pct / 99.9) × (1 + markup_pct / 100)

    Example:
        mcx_rate_per_10g=68500, purity_pct=91.6, markup_pct=1.5 → ₹6,373.00/g
    """
    pure_per_gram = Decimal(mcx_rate_per_10g) / Decimal("10")
    purity_factor = Decimal(purity_pct) / Decimal("99.9")
    markup_factor = Decimal("1") + Decimal(markup_pct) / Decimal("100")
    result = pure_per_gram * purity_factor * markup_factor
    return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_live_rates(tenant) -> list[dict]:
    """
    Return latest rate per (metal, purity) for the tenant.
    Checks tenant override first, then falls back to latest RateHistory entry.
    Includes an `is_stale` flag if no update within the last 5 minutes.
    """
    now = timezone.now()
    stale_cutoff = now - timezone.timedelta(minutes=_STALE_THRESHOLD_MINUTES)

    overrides = {
        (r.metal_id, r.purity_id): r
        for r in TenantRate.objects.filter(tenant=tenant, deleted_at__isnull=True).select_related(
            "metal", "purity"
        )
    }

    purities = Purity.objects.filter(tenant=tenant, deleted_at__isnull=True).select_related("metal")
    results = []

    for purity in purities:
        key = (purity.metal_id, purity.id)
        if key in overrides:
            override = overrides[key]
            results.append({
                "metal": purity.metal.code,
                "purity": purity.code,
                "purity_pct": float(purity.pct),
                "buy_rate": float(override.buy_rate),
                "sell_rate": float(override.sell_rate),
                "source": "OVERRIDE",
                "updated_at": override.override_at.isoformat(),
                "is_stale": override.override_at < stale_cutoff,
            })
        else:
            latest = (
                RateHistory.objects.filter(metal=purity.metal, purity=purity)
                .order_by("-ts")
                .first()
            )
            if latest:
                results.append({
                    "metal": purity.metal.code,
                    "purity": purity.code,
                    "purity_pct": float(purity.pct),
                    "buy_rate": None,
                    "sell_rate": float(latest.rate_per_gram),
                    "source": latest.source,
                    "updated_at": latest.ts.isoformat(),
                    "is_stale": latest.ts < stale_cutoff,
                })

    return results


def record_rate_override(
    tenant,
    metal: Metal,
    purity: Purity,
    buy_rate: Decimal,
    sell_rate: Decimal,
    reason: str,
    overridden_by,
) -> TenantRate:
    """Upsert a tenant rate override and write a RateHistory entry."""
    from django.db import transaction

    with transaction.atomic():
        tenant_rate, _ = TenantRate.objects.update_or_create(
            tenant=tenant,
            metal=metal,
            purity=purity,
            deleted_at__isnull=True,
            defaults={
                "buy_rate": buy_rate,
                "sell_rate": sell_rate,
                "override_by": overridden_by,
                "override_reason": reason,
                "branch_name": "",
                "created_by": overridden_by,
                "updated_by": overridden_by,
            },
        )
        RateHistory.objects.create(
            metal=metal,
            purity=purity,
            source="MANUAL",
            rate_per_gram=sell_rate,
            ts=timezone.now(),
        )
    return tenant_rate
