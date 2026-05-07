from django.conf import settings
from django.db import models

from .base import JewelleryBaseModel


class AdminControl(JewelleryBaseModel):
    """Tenant/branch scoped admin controls for Jewellery ERP."""

    feature_flags = models.JSONField(default=dict, blank=True)
    lock_period_end = models.DateField(null=True, blank=True)
    lock_period_reason = models.CharField(max_length=500, blank=True, default="")
    lock_set_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        indexes = [models.Index(fields=["tenant", "branch_name", "lock_period_end"])]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "branch_name"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_admincontrol_tenant_branch_active",
            )
        ]
        ordering = ["branch_name"]
