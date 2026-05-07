"""Jewellery pledge loan serializers (Phase B-2.5)."""

from rest_framework import serializers

from apps.jewellery.models.pledge import (
    GoldPledgeLoan,
    LoanRepayment,
    LoanScheme,
    PledgeItem,
)


class LoanSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanScheme
        fields = [
            "id", "name", "ltv_pct", "interest_method", "interest_rate_pct",
            "min_tenure", "max_tenure", "late_fee_pct", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PledgeItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PledgeItem
        fields = [
            "id", "loan", "line_no", "description", "metal", "purity",
            "gross_wt", "net_wt", "stone_wt", "valuation_rate",
            "valuation_amount", "is_released",
        ]
        read_only_fields = fields


class PledgeItemWriteSerializer(serializers.Serializer):
    description = serializers.CharField(required=False, default="", allow_blank=True)
    metal = serializers.UUIDField()
    purity = serializers.UUIDField()
    gross_wt = serializers.DecimalField(max_digits=12, decimal_places=4)
    net_wt = serializers.DecimalField(max_digits=12, decimal_places=4)
    stone_wt = serializers.DecimalField(max_digits=12, decimal_places=4, required=False, default=0)
    valuation_rate = serializers.DecimalField(max_digits=18, decimal_places=4)


class LoanRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRepayment
        fields = [
            "id", "loan", "date", "principal_paid", "interest_paid",
            "mode", "reference", "items_released", "balance_after",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "balance_after", "created_at", "updated_at"]


class GoldPledgeLoanSerializer(serializers.ModelSerializer):
    pledge_items = PledgeItemSerializer(many=True, read_only=True)
    repayments_count = serializers.SerializerMethodField()

    class Meta:
        model = GoldPledgeLoan
        fields = [
            "id", "loan_no", "loan_date", "customer", "scheme",
            "principal", "interest_rate_pct", "interest_method",
            "tenure_months", "ltv_pct", "status", "maturity_date",
            "pledge_items", "repayments_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "loan_no", "created_at", "updated_at"]

    def get_repayments_count(self, obj):
        return obj.repayments.count()


class CreateLoanSerializer(serializers.Serializer):
    customer = serializers.UUIDField()
    scheme = serializers.UUIDField()
    principal = serializers.DecimalField(max_digits=18, decimal_places=2)
    tenure_months = serializers.IntegerField(min_value=1)
    loan_date = serializers.DateField(required=False, allow_null=True)
    pledge_items = PledgeItemWriteSerializer(many=True, min_length=1)


class CreateRepaymentSerializer(serializers.Serializer):
    principal_paid = serializers.DecimalField(max_digits=18, decimal_places=2)
    interest_paid = serializers.DecimalField(max_digits=18, decimal_places=2)
    mode = serializers.ChoiceField(choices=LoanRepayment.MODES)
    reference = serializers.CharField(required=False, default="", allow_blank=True)
    items_released = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    months_elapsed = serializers.DecimalField(
        max_digits=6, decimal_places=3, required=False, default=1
    )
    days_elapsed = serializers.IntegerField(required=False, default=30)
    date = serializers.DateField(required=False, allow_null=True)
