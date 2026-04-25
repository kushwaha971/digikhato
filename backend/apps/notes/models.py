from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel


class Note(TimeStampedModel):
    title = models.CharField(max_length=200, blank=True, default="")
    body = models.TextField(blank=True, default="")
    pinned = models.BooleanField(default=False, db_index=True)
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes")

    class Meta:
        ordering = ["-pinned", "-updated_at"]
        indexes = [models.Index(fields=["tenant", "pinned", "updated_at"])]

    def __str__(self):
        return self.title or f"Note {self.id}"
