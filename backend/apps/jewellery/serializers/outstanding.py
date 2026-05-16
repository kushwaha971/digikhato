"""Party Outstanding serializers (Phase B-2.4)."""

from decimal import Decimal

from rest_framework import serializers

from apps.jewellery.models.outstanding import PartyOutstandingBalance, PartyOutstandingMovement


class PartyOutstandingMovementsFilterSerializer(serializers.Serializer):
    movement_type = serializers.ChoiceField(
        choices=PartyOutstandingMovement.MOVEMENT_TYPES,
        required=False,
        allow_null=True,
    )
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)

    def validate(self, attrs):
        date_from = attrs.get("date_from")
        date_to = attrs.get("date_to")
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError(
                {"date_to": "date_to must be greater than or equal to date_from."}
            )
        return attrs


class PartyOutstandingMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartyOutstandingMovement
        fields = [
            "id", "balance", "movement_type", "amount_delta",
            "metal_delta_grams", "reference_type", "reference_id",
            "notes", "txn_date", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "balance", "created_at", "updated_at"]


class PartyOutstandingBalanceSerializer(serializers.ModelSerializer):
    movements = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer_mobile = serializers.CharField(source="customer.mobile", read_only=True)

    class Meta:
        model = PartyOutstandingBalance
        fields = [
            "id", "customer", "customer_name", "customer_mobile",
            "amount_balance", "metal_balance_grams", "last_txn_date",
            "movements", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_movements(self, obj):
        last_50 = obj.movements.filter(deleted_at__isnull=True).order_by("-txn_date", "-created_at")[:50]
        return PartyOutstandingMovementSerializer(last_50, many=True).data


class PartyOutstandingBalanceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for ageing report list view."""

    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer_mobile = serializers.CharField(source="customer.mobile", read_only=True)
    overdue_90_plus = serializers.SerializerMethodField()

    class Meta:
        model = PartyOutstandingBalance
        fields = [
            "id", "customer", "customer_name", "customer_mobile",
            "amount_balance", "metal_balance_grams", "last_txn_date",
            "overdue_90_plus",
        ]
        read_only_fields = fields

    def get_overdue_90_plus(self, obj) -> bool:
        from datetime import date, timedelta
        cutoff = date.today() - timedelta(days=90)
        return bool(obj.last_txn_date and obj.last_txn_date <= cutoff)


class ManualAdjustmentSerializer(serializers.Serializer):
    movement_type = serializers.ChoiceField(
        choices=[("MANUAL_ADJUSTMENT", "Manual Adjustment")],
        default="MANUAL_ADJUSTMENT",
    )
    amount_delta = serializers.DecimalField(
        max_digits=18, decimal_places=2, default=Decimal("0"),
    )
    metal_delta_grams = serializers.DecimalField(
        max_digits=12, decimal_places=4, default=Decimal("0"),
    )
    reference_type = serializers.CharField(required=False, default="", allow_blank=True)
    reference_id = serializers.CharField(required=False, default="", allow_blank=True)
    notes = serializers.CharField(required=True, min_length=5, max_length=500, allow_blank=False)
    txn_date = serializers.DateField(required=False, allow_null=True, default=None)
