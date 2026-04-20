import uuid as _uuid
from decimal import Decimal

from django.db import models

from apps.borrowers.models import Borrower
from apps.common.models import TimeStampedModel


class LoanStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    CLOSED = "closed", "Closed"
    OVERDUE = "overdue", "Overdue"


class InterestType(models.TextChoices):
    FLAT = "flat", "Flat"


class Loan(TimeStampedModel):
    uuid = models.UUIDField(default=_uuid.uuid4, unique=True, editable=False, db_index=True)
    loan_code = models.CharField(max_length=32, unique=True, null=True, blank=True, db_index=True)
    borrower = models.ForeignKey(Borrower, on_delete=models.PROTECT, related_name="loans")
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    interest_type = models.CharField(max_length=20, choices=InterestType.choices, default=InterestType.FLAT)
    tenure_days = models.PositiveIntegerField(null=True, blank=True)
    start_date = models.DateField()
    due_date = models.DateField(null=True, blank=True, db_index=True)
    alert_active = models.BooleanField(default=False, db_index=True)
    notes = models.TextField(blank=True, default="")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    daily_emi = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=20, choices=LoanStatus.choices, default=LoanStatus.ACTIVE, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "start_date"]),
            models.Index(fields=["status", "due_date"]),
            models.Index(fields=["borrower", "updated_at"]),
        ]

    def __str__(self) -> str:
        return f"Loan {self.id} - {self.borrower.name}"
