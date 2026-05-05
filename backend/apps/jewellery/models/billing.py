"""Jewellery billing models (Phase B-1.5)."""

from django.conf import settings
from django.db import models

from .base import JewelleryBaseModel


class Customer(JewelleryBaseModel):
    """Jewellery customer — separate from Loans borrower model."""

    name = models.CharField(max_length=200, db_index=True)
    mobile = models.CharField(max_length=15, blank=True, default="", db_index=True)
    email = models.EmailField(blank=True, default="")
    gstin = models.CharField(max_length=15, blank=True, default="", db_index=True)
    pan = models.CharField(max_length=10, blank=True, default="")
    # state_code is the 2-digit GST state code (e.g., "27" for Maharashtra)
    state_code = models.CharField(max_length=2, blank=True, default="")
    address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    dob = models.DateField(null=True, blank=True)
    anniversary = models.DateField(null=True, blank=True)
    loyalty_points = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.mobile})"


class SalesInvoice(JewelleryBaseModel):
    """Sales invoice header — includes sale and return documents."""

    TYPES = [
        ("TAX_INVOICE", "Tax Invoice"),
        ("ESTIMATE", "Estimate"),
        ("CASH_MEMO", "Cash Memo"),
        ("NON_GST", "Non-GST Bill"),
        ("CREDIT_NOTE", "Credit Note"),
    ]
    StatusChoices = [
        ("DRAFT", "Draft"),
        ("ISSUED", "Issued"),
        ("CANCELLED", "Cancelled"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="invoices",
    )
    reference_invoice = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="credit_notes",
    )
    invoice_type = models.CharField(max_length=20, choices=TYPES, default="TAX_INVOICE", db_index=True)
    status = models.CharField(max_length=20, choices=StatusChoices, default="DRAFT", db_index=True)

    voucher_no = models.CharField(max_length=50, blank=True, default="", db_index=True)
    voucher_date = models.DateField(null=True, blank=True)

    # GST fields
    place_of_supply_state_code = models.CharField(max_length=2, blank=True, default="")
    seller_state_code = models.CharField(max_length=2, blank=True, default="")
    is_inter_state = models.BooleanField(default=False)

    # Computed totals (persisted so historical bills don't change)
    gross_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    stone_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    cgst = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    sgst = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    igst = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    hallmark_gst = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    round_off = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Payment
    advance_used = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Audit
    issued_at = models.DateTimeField(null=True, blank=True)
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    cancel_reason = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.voucher_no or str(self.id)


class SalesInvoiceLine(models.Model):
    """One line on a sales invoice — one item or one service."""

    MAKING_MODES = [
        ("PER_GRAM", "Per Gram"),
        ("PCT_METAL", "% of Metal Value"),
        ("PER_PIECE", "Per Piece"),
    ]

    invoice = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE, related_name="lines")
    line_no = models.PositiveSmallIntegerField(default=1)

    # Linked item (nullable for manual/service lines)
    item = models.ForeignKey(
        "jewellery.Item",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="invoice_lines",
    )
    description = models.CharField(max_length=300, blank=True, default="")
    hsn_code = models.CharField(max_length=10, blank=True, default="")

    # Metal & weight (persisted at bill time)
    metal_code = models.CharField(max_length=10, blank=True, default="")
    purity_code = models.CharField(max_length=10, blank=True, default="")
    gross_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    net_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    stone_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)

    # Rate (persisted at bill time — won't change when master rate changes)
    rate_per_gram = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    metal_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Making charge
    making_mode = models.CharField(max_length=20, choices=MAKING_MODES, default="PER_GRAM")
    making_rate = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    making_charge = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Wastage
    wastage_pct = models.DecimalField(max_digits=6, decimal_places=3, default=0)
    wastage_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Hallmarking
    hallmarking_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Stone value (passed through — 0% GST on stones)
    stone_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # GST (computed on metal_part = metal_value + wastage + making)
    gst_rate_pct = models.DecimalField(max_digits=5, decimal_places=2, default=3)
    line_metal_part = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    hallmark_gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Discount allocation
    discount_allocated = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Final line total
    line_subtotal = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        ordering = ["line_no"]


class SalesInvoicePayment(models.Model):
    """Payment row against a sales invoice."""

    MODES = [
        ("CASH", "Cash"),
        ("UPI", "UPI"),
        ("CARD", "Card"),
        ("BANK", "Bank Transfer"),
        ("ADVANCE", "Advance Adjustment"),
        ("CHEQUE", "Cheque"),
        ("OTHER", "Other"),
    ]

    invoice = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE, related_name="payments")
    mode = models.CharField(max_length=20, choices=MODES, default="CASH")
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True, default="")
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["paid_at"]


class OldGoldPurchase(models.Model):
    """Old gold / silver buy-back linked to a sales invoice."""

    invoice = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE, related_name="old_gold_purchases")
    metal_code = models.CharField(max_length=10, default="GOLD")
    description = models.CharField(max_length=200, blank=True, default="")

    gross_wt = models.DecimalField(max_digits=12, decimal_places=4)
    tested_purity = models.DecimalField(max_digits=6, decimal_places=3)

    # Computed at buy-back time
    pure_grams = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    buy_rate_per_gram = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    deduction_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]
