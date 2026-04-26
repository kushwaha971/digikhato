import uuid as _uuid

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Location(TimeStampedModel):
    uuid = models.UUIDField(default=_uuid.uuid4, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=120, db_index=True)
    description = models.TextField(blank=True, default="")
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tenant_locations",
    )

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["tenant", "name"]),
        ]

    def __str__(self) -> str:
        return self.name
