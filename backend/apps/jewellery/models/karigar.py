"""Jewellery karigar/order models (Phase B-2.1)."""
from django.db import models
from .base import JewelleryBaseModel
from .billing import Customer
from .master import Design, Metal, Purity


class Karigar(JewelleryBaseModel):
    code = models.CharField(max_length=50, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    mobile = models.CharField(max_length=15, blank=True, default="")
    kyc_pan = models.CharField(max_length=10, blank=True, default="")
    kyc_aadhaar_masked = models.CharField(max_length=4, blank=True, default="")
    default_labour_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    default_wastage_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    specialization = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "code"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_karigar_tenant_code_active",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


ORDER_STATUS = [
    ("BOOKED", "Booked"),
    ("METAL_ISSUED", "Metal Issued"),
    ("WIP", "Work In Progress"),
    ("KARIGAR_RECEIVED", "Received from Karigar"),
    ("QC", "Quality Control"),
    ("HALLMARKED", "Hallmarked"),
    ("READY", "Ready for Delivery"),
    ("DELIVERED", "Delivered"),
    ("CLOSED", "Closed"),
    ("CANCELLED", "Cancelled"),
]

VALID_TRANSITIONS = {
    "BOOKED": {"METAL_ISSUED", "CANCELLED"},
    "METAL_ISSUED": {"WIP", "CANCELLED"},
    "WIP": {"KARIGAR_RECEIVED"},
    "KARIGAR_RECEIVED": {"QC"},
    "QC": {"HALLMARKED", "WIP"},
    "HALLMARKED": {"READY"},
    "READY": {"DELIVERED"},
    "DELIVERED": {"CLOSED"},
    "CLOSED": set(),
    "CANCELLED": set(),
}


class CustomerOrder(JewelleryBaseModel):
    order_no = models.CharField(max_length=50, blank=True, default="", db_index=True)
    order_date = models.DateField()
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="orders")
    design = models.ForeignKey(Design, on_delete=models.SET_NULL, null=True, blank=True)
    expected_delivery = models.DateField(null=True, blank=True)
    advance_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default="BOOKED", db_index=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-order_date"]

    def __str__(self):
        return f"Order {self.order_no} — {self.customer}"


class KarigarIssue(JewelleryBaseModel):
    voucher_no = models.CharField(max_length=50, blank=True, default="", db_index=True)
    date = models.DateField()
    karigar = models.ForeignKey(Karigar, on_delete=models.PROTECT, related_name="issues")
    order = models.ForeignKey(CustomerOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name="issues")
    metal = models.ForeignKey(Metal, on_delete=models.PROTECT)
    gross_wt_issued = models.DecimalField(max_digits=12, decimal_places=4)
    tunch_pct = models.DecimalField(max_digits=6, decimal_places=3)
    pure_gold_wt_issued = models.DecimalField(max_digits=12, decimal_places=4)
    items_json = models.JSONField(default=list)  # list of {item_id, weight}
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Issue {self.voucher_no} → {self.karigar}"


class KarigarReceipt(JewelleryBaseModel):
    voucher_no = models.CharField(max_length=50, blank=True, default="", db_index=True)
    date = models.DateField()
    karigar = models.ForeignKey(Karigar, on_delete=models.PROTECT, related_name="receipts")
    issue = models.ForeignKey(KarigarIssue, on_delete=models.PROTECT, related_name="receipts")
    gross_wt_received = models.DecimalField(max_digits=12, decimal_places=4)
    net_wt = models.DecimalField(max_digits=12, decimal_places=4)
    stone_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    final_purity_pct = models.DecimalField(max_digits=6, decimal_places=3, default=0)
    pure_gold_wt_received = models.DecimalField(max_digits=12, decimal_places=4)
    wastage_actual_pct = models.DecimalField(max_digits=5, decimal_places=2)
    labour_amount = models.DecimalField(max_digits=18, decimal_places=2)
    # Reconciliation results (computed on receipt)
    pure_diff = models.DecimalField(max_digits=12, decimal_places=4, default=0)  # +/- karigar owes/gets
    status = models.CharField(max_length=20, default="DRAFT")

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Receipt {self.voucher_no} ← {self.karigar}"
