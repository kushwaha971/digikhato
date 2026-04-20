from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(models.Model):
    """Immutable record of every significant write action in the system."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_actions",
    )
    # Denormalised tenant snapshot so logs survive tenant deletion
    tenant_id_snapshot = models.IntegerField(null=True, blank=True, db_index=True)
    tenant_name_snapshot = models.CharField(max_length=120, blank=True)

    action = models.CharField(max_length=50, db_index=True)   # e.g. "login", "create_loan"
    model_name = models.CharField(max_length=100, blank=True)  # e.g. "Loan"
    object_id = models.CharField(max_length=50, blank=True)    # PK of affected object
    detail = models.CharField(max_length=500, blank=True)      # human-readable summary
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant_id_snapshot", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action} by {self.actor_id} at {self.created_at}"


class DocumentSequence(models.Model):
    """Tenant-aware daily sequence counter for human-readable document IDs."""

    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="document_sequences",
    )
    doc_type = models.CharField(max_length=4)  # e.g. LN, CL
    date_part = models.CharField(max_length=4)  # ddmm
    last_seq = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "doc_type", "date_part"],
                name="uniq_doc_sequence_tenant_type_date",
            ),
        ]
        indexes = [
            models.Index(fields=["tenant", "doc_type", "date_part"]),
        ]

    def __str__(self):
        return f"{self.doc_type}-{self.tenant_id}-{self.date_part}-{self.last_seq}"
