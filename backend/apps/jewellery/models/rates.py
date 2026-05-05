"""Jewellery MCX rate models (Phase B-1.4)."""

from django.conf import settings
from django.db import models

from apps.jewellery.models.base import JewelleryBaseModel
from apps.jewellery.models.master import Metal, Purity


class RateHistory(models.Model):
    """Immutable log of every rate observation (MCX or manual entry)."""

    metal = models.ForeignKey(Metal, on_delete=models.PROTECT, related_name="rate_history")
    purity = models.ForeignKey(Purity, on_delete=models.PROTECT, related_name="rate_history")
    source = models.CharField(max_length=50, default="MANUAL")
    rate_per_gram = models.DecimalField(max_digits=18, decimal_places=4)
    ts = models.DateTimeField(db_index=True)

    class Meta:
        indexes = [models.Index(fields=["metal", "purity", "ts"], name="jwl_rate_history_idx")]
        ordering = ["-ts"]

    def __str__(self) -> str:
        return f"{self.metal.code}/{self.purity.code} ₹{self.rate_per_gram}/g @ {self.ts}"


class TenantRate(JewelleryBaseModel):
    """Tenant-level manual rate override (buy / sell) per metal+purity."""

    metal = models.ForeignKey(Metal, on_delete=models.PROTECT, related_name="tenant_rates")
    purity = models.ForeignKey(Purity, on_delete=models.PROTECT, related_name="tenant_rates")
    buy_rate = models.DecimalField(max_digits=18, decimal_places=4)
    sell_rate = models.DecimalField(max_digits=18, decimal_places=4)
    override_at = models.DateTimeField(auto_now=True)
    override_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    override_reason = models.TextField(blank=True, default="")

    class Meta:
        indexes = [models.Index(fields=["tenant", "metal", "purity"], name="jwl_tenant_rate_idx")]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "metal", "purity"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_tenant_rate_active",
            )
        ]
        ordering = ["-override_at"]

    def __str__(self) -> str:
        return f"{self.tenant_id} — {self.metal.code}/{self.purity.code} buy:{self.buy_rate} sell:{self.sell_rate}"
