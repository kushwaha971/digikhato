from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class BusinessProfile(TimeStampedModel):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_profile")
    business_name = models.CharField(max_length=150)
    area_name = models.CharField(max_length=120, blank=True, default="")
    currency = models.CharField(max_length=10, default="INR")
    is_onboarded = models.BooleanField(default=False)
    # Keys are ModuleCode values; value is True when the tenant has activated that module.
    # Example: {"jewellery": true, "gym": false}
    feature_flags = models.JSONField(default=dict)

    def __str__(self) -> str:
        return self.business_name
