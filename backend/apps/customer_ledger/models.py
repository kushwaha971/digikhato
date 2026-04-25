from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class LedgerCustomer(TimeStampedModel):
    name = models.CharField(max_length=120)
    mobile = models.CharField(max_length=15, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ledger_customers",
    )
    credit_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    payment_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["tenant", "updated_at"]),
        ]

    def __str__(self):
        return self.name

    def recalculate(self):
        agg = self.transactions.aggregate(
            credit=models.Sum("amount", filter=models.Q(tx_type="credit")),
            payment=models.Sum("amount", filter=models.Q(tx_type="payment")),
        )
        self.credit_total = agg["credit"] or Decimal("0.00")
        self.payment_total = agg["payment"] or Decimal("0.00")
        self.balance = self.credit_total - self.payment_total
        self.save(update_fields=["credit_total", "payment_total", "balance", "updated_at"])


class LedgerTransaction(TimeStampedModel):
    TX_CREDIT = "credit"
    TX_PAYMENT = "payment"
    TX_TYPES = [
        (TX_CREDIT, "Credit Given"),
        (TX_PAYMENT, "Payment Received"),
    ]

    customer = models.ForeignKey(LedgerCustomer, on_delete=models.CASCADE, related_name="transactions")
    tx_type = models.CharField(max_length=10, choices=TX_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    notes = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.tx_type} ₹{self.amount} for {self.customer_id}"
