from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.borrowers.models import Borrower
from apps.common.models import TimeStampedModel


class AccountStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    CLOSED = "closed", "Closed"
    OVERDUE = "overdue", "Overdue"


class Account(TimeStampedModel):
    borrower = models.ForeignKey(Borrower, on_delete=models.PROTECT, related_name="accounts")
    amount_given = models.DecimalField(max_digits=12, decimal_places=2)
    daily_interest_rate = models.DecimalField(max_digits=6, decimal_places=4)
    duration_days = models.PositiveIntegerField(null=True, blank=True)
    start_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=AccountStatus.choices, default=AccountStatus.ACTIVE, db_index=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    outstanding_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="accounts_created")

    class Meta:
        indexes = [
            models.Index(fields=["status", "start_date"]),
            models.Index(fields=["borrower", "updated_at"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.pk:
            self.outstanding_amount = self.amount_given
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Account {self.id} - {self.borrower.name}"
