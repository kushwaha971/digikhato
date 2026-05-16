"""Jewellery accounting models — Module 5: Accounts & Ledger."""

from django.db import models

from .base import JewelleryBaseModel


class Account(JewelleryBaseModel):
    ACCOUNT_TYPES = [
        ("ASSET", "Asset"),
        ("LIABILITY", "Liability"),
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
        ("EQUITY", "Equity"),
    ]

    code = models.CharField(max_length=20)
    name = models.CharField(max_length=150)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    is_system = models.BooleanField(default=False)

    class Meta:
        unique_together = [("tenant", "code")]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Voucher(JewelleryBaseModel):
    VOUCHER_TYPES = [
        ("RECEIPT", "Receipt"),
        ("PAYMENT", "Payment"),
        ("JOURNAL", "Journal"),
        ("CONTRA", "Contra"),
    ]
    STATUS = [
        ("DRAFT", "Draft"),
        ("POSTED", "Posted"),
    ]

    voucher_no = models.CharField(max_length=50)
    voucher_date = models.DateField()
    voucher_type = models.CharField(max_length=20, choices=VOUCHER_TYPES)
    narration = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=STATUS, default="DRAFT")

    def __str__(self):
        return f"{self.voucher_no} ({self.voucher_type})"


class VoucherEntry(JewelleryBaseModel):
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE, related_name="entries")
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="entries")
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    narration = models.TextField(blank=True)

    def __str__(self):
        return f"{self.voucher.voucher_no} | {self.account.code} | Dr:{self.debit} Cr:{self.credit}"
