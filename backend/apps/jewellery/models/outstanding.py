"""Jewellery Party Outstanding models (Phase B-2.4)."""

from django.db import models

from .base import JewelleryBaseModel


class PartyOutstandingBalance(JewelleryBaseModel):
    """Single balance record per customer — updated atomically on every transaction."""

    customer = models.OneToOneField(
        "jewellery.Customer",
        on_delete=models.CASCADE,
        related_name="outstanding",
    )
    amount_balance = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        help_text="Cash balance (positive = customer owes us)",
    )
    metal_balance_grams = models.DecimalField(
        max_digits=12, decimal_places=4, default=0,
        help_text="Gold balance in grams",
    )
    last_txn_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-last_txn_date"]

    def __str__(self):
        return f"Outstanding({self.customer_id}): ₹{self.amount_balance} / {self.metal_balance_grams}g"


class PartyOutstandingMovement(JewelleryBaseModel):
    """Audit trail — one row per debit/credit event."""

    MOVEMENT_TYPES = [
        ("INVOICE_DEBIT", "Invoice Debit"),
        ("INVOICE_CREDIT", "Invoice Credit"),
        ("PAYMENT_RECEIVED", "Payment Received"),
        ("ADVANCE_GIVEN", "Advance Given"),
        ("METAL_ISSUED", "Metal Issued"),
        ("METAL_RECEIVED", "Metal Received"),
        ("MANUAL_ADJUSTMENT", "Manual Adjustment"),
    ]

    balance = models.ForeignKey(
        PartyOutstandingBalance,
        on_delete=models.CASCADE,
        related_name="movements",
    )
    movement_type = models.CharField(max_length=30, choices=MOVEMENT_TYPES, db_index=True)
    amount_delta = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        help_text="Positive = increase balance (customer owes more)",
    )
    metal_delta_grams = models.DecimalField(
        max_digits=12, decimal_places=4, default=0,
    )
    reference_type = models.CharField(max_length=50, blank=True, default="")
    reference_id = models.CharField(max_length=50, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    txn_date = models.DateField(db_index=True)

    class Meta:
        ordering = ["-txn_date", "-created_at"]

    def __str__(self):
        return f"{self.movement_type} {self.amount_delta} on {self.txn_date}"
