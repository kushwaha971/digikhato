from rest_framework import serializers

from apps.jewellery.models.admin import AdminControl


ADMIN_LOCK_PERIOD_REASON_DEFAULT = AdminControl._meta.get_field("lock_period_reason").default


class FeatureFlagsPatchSerializer(serializers.Serializer):
    feature_flags = serializers.DictField(
        child=serializers.BooleanField(),
        allow_empty=True,
        required=False,
    )
    einvoice_applicable = serializers.BooleanField(required=False)


class LockPeriodSerializer(serializers.Serializer):
    lock_period_end = serializers.DateField(required=False, allow_null=True, default=None)
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        default=ADMIN_LOCK_PERIOD_REASON_DEFAULT,
    )
