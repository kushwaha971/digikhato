import uuid as _uuid

from django.conf import settings
from django.db import models

from apps.borrowers.models import Borrower
from apps.common.models import TimeStampedModel
from apps.loans.models import Loan


class CollectionStatus(models.TextChoices):
    PAID = "paid", "Paid"
    PARTIAL = "partial", "Partial"
    MISSED = "missed", "Missed"


class PaymentMode(models.TextChoices):
    CASH = "cash", "Cash"
    GPAY = "gpay", "GPay"
    PHONEPE = "phonepe", "PhonePe"
    PAYTM = "paytm", "Paytm"
    OTHER_UPI = "other_upi", "Other UPI"


class SyncStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    SYNCED = "synced", "Synced"


class Collection(TimeStampedModel):
    uuid = models.UUIDField(default=_uuid.uuid4, unique=True, editable=False, db_index=True)
    collection_code = models.CharField(max_length=32, unique=True, null=True, blank=True, db_index=True)
    loan = models.ForeignKey(Loan, on_delete=models.PROTECT, related_name="collections")
    borrower = models.ForeignKey(Borrower, on_delete=models.PROTECT, related_name="collections")
    date = models.DateField(db_index=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=CollectionStatus.choices, default=CollectionStatus.PARTIAL)
    payment_mode = models.CharField(max_length=20, choices=PaymentMode.choices, default=PaymentMode.CASH)
    reference_id = models.CharField(max_length=120, blank=True, default="")
    notes = models.CharField(max_length=250, blank=True)
    collected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="collections_made")
    gps_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    sync_status = models.CharField(max_length=20, choices=SyncStatus.choices, default=SyncStatus.PENDING)

    class Meta:
        indexes = [
            models.Index(fields=["date", "status"]),
            models.Index(fields=["date", "payment_mode"]),
            models.Index(fields=["loan", "date"]),
            models.Index(fields=["borrower", "date"]),
        ]

    def __str__(self) -> str:
        return f"Collection {self.id} - Loan {self.loan_id}"


class DailyCollection(TimeStampedModel):
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.PROTECT,
        related_name='daily_collections'
    )
    payment = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(db_index=True)
    collected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='daily_collections_made'
    )

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['account', 'date']),
        ]

    def __str__(self):
        return f"DailyCollection {self.id} - Account {self.account_id} - {self.date}"

    def save(self, *args, **kwargs):
        is_new = not self.pk
        super().save(*args, **kwargs)
        if is_new:
            account = self.account
            from decimal import Decimal
            account.amount_paid = (account.amount_paid or Decimal('0')) + self.payment
            outstanding = account.amount_given - account.amount_paid
            account.outstanding_amount = max(outstanding, Decimal('0'))
            if account.outstanding_amount == 0:
                account.status = 'closed'
            account.save(update_fields=['amount_paid', 'outstanding_amount', 'status'])
