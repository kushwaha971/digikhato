"""Jewellery billing serializers (Phase B-1.5)."""

from rest_framework import serializers

from apps.jewellery.models.billing import (
    Customer,
    OldGoldPurchase,
    SalesInvoice,
    SalesInvoiceLine,
    SalesInvoicePayment,
)
from apps.jewellery.services.billing import INVOICE_TYPE_CREDIT_NOTE, SHARE_CHANNEL_CHOICES


INVOICE_TYPE_CHOICES = [code for code, _ in SalesInvoice._meta.get_field("invoice_type").choices]
INVOICE_TYPE_DEFAULT = SalesInvoice._meta.get_field("invoice_type").default
MAKING_MODE_CHOICES = [code for code, _ in SalesInvoiceLine._meta.get_field("making_mode").choices]
MAKING_MODE_DEFAULT = SalesInvoiceLine._meta.get_field("making_mode").default
LINE_GST_RATE_DEFAULT = SalesInvoiceLine._meta.get_field("gst_rate_pct").default
PAYMENT_MODE_CHOICES = [code for code, _ in SalesInvoicePayment._meta.get_field("mode").choices]
OLD_GOLD_METAL_DEFAULT = OldGoldPurchase._meta.get_field("metal_code").default


class CustomerSerializer(serializers.ModelSerializer):
    outstanding_amount_balance = serializers.SerializerMethodField()
    outstanding_metal_balance_grams = serializers.SerializerMethodField()
    outstanding_last_txn_date = serializers.SerializerMethodField()

    def _get_outstanding(self, obj):
        try:
            return obj.outstanding
        except Customer.outstanding.RelatedObjectDoesNotExist:
            return None

    def get_outstanding_amount_balance(self, obj):
        outstanding = self._get_outstanding(obj)
        return f"{outstanding.amount_balance:.2f}" if outstanding else "0.00"

    def get_outstanding_metal_balance_grams(self, obj):
        outstanding = self._get_outstanding(obj)
        return f"{outstanding.metal_balance_grams:.4f}" if outstanding else "0.0000"

    def get_outstanding_last_txn_date(self, obj):
        outstanding = self._get_outstanding(obj)
        return str(outstanding.last_txn_date) if (outstanding and outstanding.last_txn_date) else None

    class Meta:
        model = Customer
        fields = [
            "id", "name", "mobile", "email", "gstin", "pan",
            "state_code", "address", "city", "dob", "anniversary",
            "loyalty_points",
            "outstanding_amount_balance", "outstanding_metal_balance_grams", "outstanding_last_txn_date",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "loyalty_points", "created_at", "updated_at"]


class OldGoldPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = OldGoldPurchase
        fields = [
            "id", "metal_code", "description", "gross_wt", "tested_purity",
            "pure_grams", "buy_rate_per_gram", "deduction_value",
        ]
        read_only_fields = ["id", "pure_grams", "deduction_value"]


class SalesInvoicePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesInvoicePayment
        fields = ["id", "mode", "amount", "reference", "paid_at"]
        read_only_fields = ["id", "paid_at"]


class SalesInvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesInvoiceLine
        fields = [
            "id", "line_no", "item", "description", "huid", "hsn_code",
            "metal_code", "purity_code", "gross_wt", "net_wt", "stone_wt",
            "rate_per_gram", "metal_value",
            "making_mode", "making_rate", "making_charge",
            "wastage_pct", "wastage_amount",
            "hallmarking_fee", "stone_value",
            "gst_rate_pct", "line_metal_part", "gst_amount", "hallmark_gst_amount",
            "discount_allocated", "line_subtotal", "line_total",
        ]
        read_only_fields = [
            "id", "metal_value", "making_charge", "wastage_amount",
            "line_metal_part", "gst_amount", "hallmark_gst_amount",
            "discount_allocated", "line_subtotal", "line_total",
        ]


class SalesInvoiceSerializer(serializers.ModelSerializer):
    """List + detail serializer — includes nested lines, payments, old gold."""

    lines = SalesInvoiceLineSerializer(many=True, read_only=True)
    payments = SalesInvoicePaymentSerializer(many=True, read_only=True)
    old_gold_purchases = OldGoldPurchaseSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True, default="")
    customer_gstin = serializers.CharField(source="customer.gstin", read_only=True, default="")
    reference_invoice_no = serializers.CharField(source="reference_invoice.voucher_no", read_only=True, default="")

    class Meta:
        model = SalesInvoice
        fields = [
            "id", "voucher_no", "voucher_date", "invoice_type", "status",
            "customer", "customer_name", "customer_gstin",
            "reference_invoice", "reference_invoice_no",
            "place_of_supply_state_code", "seller_state_code", "is_inter_state",
            "gross_amount", "discount_amount", "taxable_amount", "stone_value",
            "cgst", "sgst", "igst", "hallmark_gst", "round_off", "total_amount",
            "advance_used", "paid_amount", "balance_amount",
            "e_invoice_irn", "e_invoice_qr", "e_invoice_is_simulated",
            "notes", "issued_at", "cancelled_at", "cancel_reason",
            "branch_name", "created_at", "updated_at",
            "lines", "payments", "old_gold_purchases",
        ]
        read_only_fields = [
            "id", "status", "voucher_no", "is_inter_state",
            "gross_amount", "taxable_amount", "stone_value",
            "cgst", "sgst", "igst", "hallmark_gst", "round_off", "total_amount",
            "advance_used", "paid_amount", "balance_amount",
            "e_invoice_irn", "e_invoice_qr", "e_invoice_is_simulated",
            "issued_at", "cancelled_at", "created_at", "updated_at",
        ]


# ─── Write Serializers ────────────────────────────────────────────────────────

class InvoiceLineWriteSerializer(serializers.Serializer):
    item = serializers.UUIDField(required=False, allow_null=True)
    description = serializers.CharField(required=False, default="")
    huid = serializers.CharField(required=False, default="", allow_blank=True, max_length=6)
    hsn_code = serializers.CharField(required=False, default="")
    metal_code = serializers.CharField(required=False, default="")
    purity_code = serializers.CharField(required=False, default="")
    gross_wt = serializers.DecimalField(max_digits=12, decimal_places=4, default=0)
    net_wt = serializers.DecimalField(max_digits=12, decimal_places=4, default=0)
    stone_wt = serializers.DecimalField(max_digits=12, decimal_places=4, default=0)
    rate_per_gram = serializers.DecimalField(max_digits=18, decimal_places=4)
    making_mode = serializers.ChoiceField(choices=MAKING_MODE_CHOICES, default=MAKING_MODE_DEFAULT)
    making_rate = serializers.DecimalField(max_digits=18, decimal_places=4, default=0)
    wastage_pct = serializers.DecimalField(max_digits=6, decimal_places=3, default=0)
    hallmarking_fee = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    stone_value = serializers.DecimalField(max_digits=18, decimal_places=2, default=0)
    gst_rate_pct = serializers.DecimalField(max_digits=5, decimal_places=2, default=LINE_GST_RATE_DEFAULT)


class OldGoldWriteSerializer(serializers.Serializer):
    metal_code = serializers.CharField(default=OLD_GOLD_METAL_DEFAULT)
    description = serializers.CharField(required=False, default="")
    gross_wt = serializers.DecimalField(max_digits=12, decimal_places=4)
    tested_purity = serializers.DecimalField(max_digits=6, decimal_places=3)
    buy_rate_per_gram = serializers.DecimalField(max_digits=18, decimal_places=4)


class PaymentWriteSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=PAYMENT_MODE_CHOICES)
    amount = serializers.DecimalField(max_digits=18, decimal_places=2)
    reference = serializers.CharField(required=False, default="")


class CreateInvoiceSerializer(serializers.Serializer):
    customer = serializers.UUIDField(required=False, allow_null=True)
    reference_invoice = serializers.UUIDField(required=False, allow_null=True)
    invoice_type = serializers.ChoiceField(choices=INVOICE_TYPE_CHOICES, default=INVOICE_TYPE_DEFAULT)
    voucher_date = serializers.DateField(required=False, allow_null=True)
    place_of_supply_state_code = serializers.CharField(required=False, default="")
    seller_state_code = serializers.CharField(required=False, default="")
    discount_amount = serializers.DecimalField(max_digits=18, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    lines = InvoiceLineWriteSerializer(many=True, min_length=1)
    old_gold = OldGoldWriteSerializer(many=True, required=False, default=list)
    payments = PaymentWriteSerializer(many=True, required=False, default=list)

    def validate(self, attrs):
        if attrs.get("invoice_type") == INVOICE_TYPE_CREDIT_NOTE and not attrs.get("reference_invoice"):
            raise serializers.ValidationError({"reference_invoice": "Reference invoice is required for credit note."})
        return attrs


class CalculateInvoiceSerializer(serializers.Serializer):
    """Stateless preview — no DB write."""

    lines = InvoiceLineWriteSerializer(many=True, min_length=1)
    discount_amount = serializers.DecimalField(max_digits=18, decimal_places=2, default=0)
    place_of_supply_state_code = serializers.CharField(required=False, default="")
    seller_state_code = serializers.CharField(required=False, default="")


class CancelInvoiceSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=3, max_length=500)


class SendInvoiceSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=SHARE_CHANNEL_CHOICES)
    to = serializers.CharField(min_length=3, max_length=120)
