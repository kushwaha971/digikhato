import uuid as _uuid

from django.conf import settings
from django.db import models

from apps.common.constants import RecordStatus
from apps.common.models import TimeStampedModel


class Borrower(TimeStampedModel):
    uuid = models.UUIDField(default=_uuid.uuid4, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=120)
    mobile_number = models.CharField(max_length=15, db_index=True)
    address = models.TextField(blank=True, default="")
    photo = models.URLField(blank=True, null=True)
    id_type = models.CharField(max_length=50, blank=True, null=True)
    id_number = models.CharField(max_length=60, blank=True, null=True)
    guarantor_name = models.CharField(max_length=120, blank=True, null=True)
    guarantor_mobile = models.CharField(max_length=15, blank=True, null=True)
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_borrowers",
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="borrower_profile",
    )
    status = models.CharField(max_length=20, choices=RecordStatus.choices, default=RecordStatus.ACTIVE, db_index=True)
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tenant_borrowers",
    )

    class Meta:
        indexes = [
            models.Index(fields=["mobile_number"]),
            models.Index(fields=["status", "updated_at"]),
        ]

    def __str__(self) -> str:
        return self.name
