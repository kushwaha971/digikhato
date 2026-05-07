"""Jewellery karigar serializers (Phase B-2.1)."""

import re

from rest_framework import serializers

from apps.jewellery.models.karigar import (
    CustomerOrder,
    Karigar,
    KarigarIssue,
    KarigarReceipt,
)


class KarigarSerializer(serializers.ModelSerializer):
    def validate_mobile(self, value):
        cleaned = (value or "").strip()
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        cleaned = cleaned.replace(" ", "").replace("-", "")
        if cleaned and not re.fullmatch(r"\d{10}", cleaned):
            raise serializers.ValidationError("Mobile must be a 10-digit number.")
        return cleaned

    def validate_kyc_pan(self, value):
        pan = (value or "").strip().upper()
        if pan and not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", pan):
            raise serializers.ValidationError("PAN format must be AAAAA9999A.")
        return pan

    class Meta:
        model = Karigar
        fields = [
            "id", "code", "name", "mobile", "kyc_pan", "kyc_aadhaar_masked",
            "default_labour_rate", "default_wastage_pct", "specialization", "is_active",
            "branch_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "branch_name", "created_at", "updated_at"]


class CustomerOrderSerializer(serializers.ModelSerializer):
    """Read serializer with nested names."""
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    design_name = serializers.CharField(source="design.name", read_only=True, default="")

    class Meta:
        model = CustomerOrder
        fields = [
            "id", "order_no", "order_date", "customer", "customer_name",
            "design", "design_name", "expected_delivery", "advance_amount",
            "status", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "order_no", "status", "created_at", "updated_at"]


class CreateOrderSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    design_id = serializers.UUIDField(required=False, allow_null=True)
    order_date = serializers.DateField()
    expected_delivery = serializers.DateField(required=False, allow_null=True)
    advance_amount = serializers.DecimalField(max_digits=18, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class KarigarIssueSerializer(serializers.ModelSerializer):
    """Read serializer with nested karigar/order names."""
    karigar_name = serializers.CharField(source="karigar.name", read_only=True)
    order_no = serializers.CharField(source="order.order_no", read_only=True, default="")
    metal_code = serializers.CharField(source="metal.code", read_only=True)

    class Meta:
        model = KarigarIssue
        fields = [
            "id", "voucher_no", "date", "karigar", "karigar_name",
            "order", "order_no", "metal", "metal_code",
            "gross_wt_issued", "tunch_pct", "pure_gold_wt_issued",
            "items_json", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "voucher_no", "pure_gold_wt_issued", "created_at", "updated_at"]


class CreateKarigarIssueSerializer(serializers.Serializer):
    karigar_id = serializers.UUIDField()
    order_id = serializers.UUIDField(required=False, allow_null=True)
    metal_id = serializers.UUIDField()
    gross_wt_issued = serializers.DecimalField(max_digits=12, decimal_places=4)
    tunch_pct = serializers.DecimalField(max_digits=6, decimal_places=3)
    date = serializers.DateField(required=False, allow_null=True)
    items_json = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class KarigarReceiptSerializer(serializers.ModelSerializer):
    """Read serializer including reconciliation fields."""
    karigar_name = serializers.CharField(source="karigar.name", read_only=True)
    issue_voucher_no = serializers.CharField(source="issue.voucher_no", read_only=True)

    class Meta:
        model = KarigarReceipt
        fields = [
            "id", "voucher_no", "date", "karigar", "karigar_name",
            "issue", "issue_voucher_no",
            "gross_wt_received", "net_wt", "stone_wt", "final_purity_pct",
            "pure_gold_wt_received", "wastage_actual_pct", "labour_amount",
            "pure_diff", "status", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "voucher_no", "karigar", "pure_gold_wt_received",
            "pure_diff", "created_at", "updated_at",
        ]


class CreateKarigarReceiptSerializer(serializers.Serializer):
    issue_id = serializers.UUIDField()
    gross_wt_received = serializers.DecimalField(max_digits=12, decimal_places=4)
    net_wt = serializers.DecimalField(max_digits=12, decimal_places=4, required=False, allow_null=True)
    stone_wt = serializers.DecimalField(max_digits=12, decimal_places=4, required=False, default=0)
    final_purity_pct = serializers.DecimalField(max_digits=6, decimal_places=3, required=False, allow_null=True)
    wastage_actual_pct = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0)
    labour_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default=0)
    date = serializers.DateField(required=False, allow_null=True)
