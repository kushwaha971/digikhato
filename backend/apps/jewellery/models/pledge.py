"""Jewellery gold pledge loan models (Phase B-2.5)."""
from django.db import models
from .base import JewelleryBaseModel
from .billing import Customer
from .master import Metal, Purity

class LoanScheme(JewelleryBaseModel):
    name = models.CharField(max_length=100)
    ltv_pct = models.DecimalField(max_digits=5, decimal_places=2)
    interest_method = models.CharField(
        max_length=10,
        choices=[("SIMPLE", "Simple"), ("COMPOUND", "Compound"), ("FLAT", "Flat"), ("DAILY", "Daily")],
    )
    interest_rate_pct = models.DecimalField(max_digits=6, decimal_places=3)  # per month
    min_tenure = models.PositiveIntegerField()  # months
    max_tenure = models.PositiveIntegerField()
    late_fee_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.interest_method} {self.interest_rate_pct}%)"


class GoldPledgeLoan(JewelleryBaseModel):
    STATUSES = [
        ("ACTIVE", "Active"),
        ("RENEWED", "Renewed"),
        ("CLOSED", "Closed"),
        ("AUCTIONED", "Auctioned"),
        ("LOSS", "Loss"),
    ]
    loan_no = models.CharField(max_length=50, db_index=True)
    loan_date = models.DateField()
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="pledge_loans")
    scheme = models.ForeignKey(LoanScheme, on_delete=models.PROTECT)
    principal = models.DecimalField(max_digits=18, decimal_places=2)
    interest_rate_pct = models.DecimalField(max_digits=6, decimal_places=3)
    interest_method = models.CharField(max_length=10)
    tenure_months = models.PositiveIntegerField()
    ltv_pct = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUSES, default="ACTIVE", db_index=True)
    maturity_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-loan_date"]

    def __str__(self):
        return f"Loan {self.loan_no} — {self.customer}"


class PledgeItem(models.Model):
    """Pledge item — not soft-deleted; belongs to loan lifecycle."""
    loan = models.ForeignKey(GoldPledgeLoan, on_delete=models.CASCADE, related_name="pledge_items")
    line_no = models.PositiveIntegerField()
    description = models.CharField(max_length=300, blank=True, default="")
    metal = models.ForeignKey(Metal, on_delete=models.PROTECT)
    purity = models.ForeignKey(Purity, on_delete=models.PROTECT)
    gross_wt = models.DecimalField(max_digits=12, decimal_places=4)
    net_wt = models.DecimalField(max_digits=12, decimal_places=4)
    stone_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    valuation_rate = models.DecimalField(max_digits=18, decimal_places=4)
    valuation_amount = models.DecimalField(max_digits=18, decimal_places=2)
    is_released = models.BooleanField(default=False)

    class Meta:
        ordering = ["line_no"]


class LoanRepayment(JewelleryBaseModel):
    MODES = [
        ("CASH", "Cash"), ("UPI", "UPI"), ("CARD", "Card"),
        ("BANK", "Bank Transfer"), ("CHEQUE", "Cheque"),
    ]
    loan = models.ForeignKey(GoldPledgeLoan, on_delete=models.CASCADE, related_name="repayments")
    date = models.DateField()
    principal_paid = models.DecimalField(max_digits=18, decimal_places=2)
    interest_paid = models.DecimalField(max_digits=18, decimal_places=2)
    mode = models.CharField(max_length=10, choices=MODES)
    reference = models.CharField(max_length=200, blank=True, default="")
    items_released = models.JSONField(default=list)  # list of pledge_item_ids
    balance_after = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        ordering = ["-date"]
