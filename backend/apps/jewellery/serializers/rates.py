"""Jewellery rate serializers (Phase B-1.4)."""

from decimal import Decimal

from rest_framework import serializers

from apps.jewellery.models.rates import RateHistory, TenantRate

TENANT_RATE_OVERRIDE_REASON_DEFAULT = TenantRate._meta.get_field("override_reason").default


class RateHistorySerializer(serializers.ModelSerializer):
    metal_code = serializers.CharField(source="metal.code", read_only=True)
    purity_code = serializers.CharField(source="purity.code", read_only=True)

    class Meta:
        model = RateHistory
        fields = ["id", "metal", "metal_code", "purity", "purity_code", "source", "rate_per_gram", "ts"]
        read_only_fields = ["id"]


class LiveRateSerializer(serializers.Serializer):
    metal = serializers.CharField()
    purity = serializers.CharField()
    purity_pct = serializers.FloatField()
    buy_rate = serializers.FloatField(allow_null=True)
    sell_rate = serializers.FloatField()
    source = serializers.CharField()
    updated_at = serializers.CharField()
    is_stale = serializers.BooleanField()


class RateOverrideSerializer(serializers.Serializer):
    metal = serializers.PrimaryKeyRelatedField(read_only=False, queryset=__import__("apps.jewellery.models.master", fromlist=["Metal"]).Metal.objects.all())
    purity = serializers.PrimaryKeyRelatedField(read_only=False, queryset=__import__("apps.jewellery.models.master", fromlist=["Purity"]).Purity.objects.all())
    buy_rate = serializers.DecimalField(max_digits=18, decimal_places=4, min_value=Decimal("0"))
    sell_rate = serializers.DecimalField(max_digits=18, decimal_places=4, min_value=Decimal("0"))
    reason = serializers.CharField(max_length=500, allow_blank=True, default=TENANT_RATE_OVERRIDE_REASON_DEFAULT)


class TenantRateSerializer(serializers.ModelSerializer):
    metal_code = serializers.CharField(source="metal.code", read_only=True)
    purity_code = serializers.CharField(source="purity.code", read_only=True)

    class Meta:
        model = TenantRate
        fields = [
            "id", "metal", "metal_code", "purity", "purity_code",
            "buy_rate", "sell_rate", "override_at", "override_reason",
        ]
        read_only_fields = ["id", "override_at"]
