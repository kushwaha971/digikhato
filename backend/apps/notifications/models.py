from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.borrowers.models import Borrower
from apps.common.models import TimeStampedModel
from apps.loans.models import Loan


class NotificationType(models.TextChoices):
    LOAN_DUE_ALERT = "loan_due_alert", "Loan Due Alert"


class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    loan = models.ForeignKey(Loan, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")
    borrower = models.ForeignKey(Borrower, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")
    type = models.CharField(max_length=50, choices=NotificationType.choices, db_index=True)
    message = models.CharField(max_length=255)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active", "is_read"]),
            models.Index(fields=["type", "due_date"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "loan", "type", "due_date"],
                condition=Q(is_active=True),
                name="uniq_active_notification_user_loan_type_due",
            )
        ]

    def __str__(self):
        return f"{self.type} - user={self.user_id} loan={self.loan_id}"
