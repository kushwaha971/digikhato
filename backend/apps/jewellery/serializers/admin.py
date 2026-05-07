from rest_framework import serializers


class FeatureFlagsPatchSerializer(serializers.Serializer):
    feature_flags = serializers.DictField(
        child=serializers.BooleanField(),
        allow_empty=False,
    )


class LockPeriodSerializer(serializers.Serializer):
    lock_period_end = serializers.DateField(required=False, allow_null=True, default=None)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500, default="")
