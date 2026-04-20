from rest_framework import serializers

from apps.onboarding.models import BusinessProfile


class BusinessProfileSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = BusinessProfile
        fields = ["id", "business_name", "area_name", "currency", "is_onboarded", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]
