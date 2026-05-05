from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.borrowers.models import Borrower
from apps.common.models import TimeStampedModel
from apps.common.constants import RoleChoices
from apps.loans.models import Loan


class NotificationType(models.TextChoices):
    COLLECTION_TASK = "collection_task", "Collection Task"
    OVERDUE_LOAN = "overdue_loan", "Overdue Loan"
    FOLLOW_UP = "follow_up", "Follow Up"
    REPAYMENT_REMINDER = "repayment_reminder", "Repayment Reminder"
    DUE_ALERT = "due_alert", "Due Alert"
    OVERDUE_ALERT = "overdue_alert", "Overdue Alert"
    SYSTEM_ACTIVITY = "system_activity", "System Activity"
    ESCALATION = "escalation", "Escalation"
    SYSTEM_UPDATE = "system_update", "System Update"
    LOAN_DUE_ALERT = "loan_due_alert", "Loan Due Alert"
    MODULE_ACCESS_REQUEST = "module_access_request", "Module Access Request"
    MODULE_ACCESS_APPROVED = "module_access_approved", "Module Access Approved"
    MODULE_ACCESS_REJECTED = "module_access_rejected", "Module Access Rejected"


class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    role = models.CharField(max_length=20, choices=RoleChoices.choices, db_index=True)
    loan = models.ForeignKey(Loan, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")
    borrower = models.ForeignKey(Borrower, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")
    type = models.CharField(max_length=50, choices=NotificationType.choices, db_index=True)
    message = models.CharField(max_length=255)
    redirect_target = models.CharField(max_length=255, blank=True, default="")
    external_key = models.CharField(max_length=120, null=True, blank=True, db_index=True)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active", "is_read"]),
            models.Index(fields=["type", "due_date", "role"]),
            models.Index(fields=["user", "created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "external_key"],
                condition=Q(is_active=True) & Q(external_key__isnull=False),
                name="uniq_active_notification_user_external_key",
            )
        ]

    def __str__(self):
        return f"{self.type} - user={self.user_id} loan={self.loan_id}"
