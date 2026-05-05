"""Jewellery inventory models (Phase B-1.3)."""

from django.conf import settings
from django.db import models

from apps.jewellery.models.base import JewelleryBaseModel
from apps.jewellery.models.master import Design, Metal, Purity


class Item(JewelleryBaseModel):
    STATUS = [
        ("IN_STOCK", "In Stock"),
        ("SOLD", "Sold"),
        ("ISSUED", "Issued to Karigar"),
        ("TRANSIT", "Inter-branch Transit"),
        ("WRITTEN_OFF", "Written Off"),
    ]

    design = models.ForeignKey(Design, on_delete=models.PROTECT, related_name="items")
    sku = models.CharField(max_length=100, blank=True, default="")
    barcode = models.CharField(max_length=200, blank=True, default="", db_index=True)
    huid = models.CharField(max_length=20, blank=True, default="", db_index=True)
    metal = models.ForeignKey(Metal, on_delete=models.PROTECT, related_name="items")
    purity = models.ForeignKey(Purity, on_delete=models.PROTECT, related_name="items")
    gross_wt = models.DecimalField(max_digits=12, decimal_places=4)
    net_wt = models.DecimalField(max_digits=12, decimal_places=4)
    stone_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    less_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    charge_wt = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    status = models.CharField(max_length=20, choices=STATUS, default="IN_STOCK", db_index=True)
    location_bin = models.CharField(max_length=100, blank=True, default="")
    image_urls = models.JSONField(default=list, blank=True)
    cost_price = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    mrp = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "branch_name", "status", "design"]),
            models.Index(fields=["barcode"]),
            models.Index(fields=["huid"]),
            models.Index(fields=["sku"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.sku or self.barcode or str(self.id)[:8]} [{self.status}]"


class Diamond(JewelleryBaseModel):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="diamonds")
    cut = models.CharField(max_length=50, blank=True, default="")
    color = models.CharField(max_length=10, blank=True, default="")
    clarity = models.CharField(max_length=10, blank=True, default="")
    carat = models.DecimalField(max_digits=8, decimal_places=3)
    certificate_no = models.CharField(max_length=100, blank=True, default="")
    certificate_lab = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Diamond {self.carat}ct [{self.color}/{self.clarity}] on {self.item_id}"


class Stone(JewelleryBaseModel):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="stones")
    stone_type = models.CharField(max_length=50)
    count = models.PositiveIntegerField(default=1)
    weight_carat = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["stone_type"]

    def __str__(self) -> str:
        return f"{self.stone_type} x{self.count} on {self.item_id}"


class StockMovement(JewelleryBaseModel):
    MOVEMENT_TYPES = [
        ("PURCHASE_IN", "Purchase In"),
        ("SALE_OUT", "Sale Out"),
        ("KARIGAR_ISSUE", "Karigar Issue"),
        ("KARIGAR_RECEIVE", "Karigar Receive"),
        ("TRANSFER_OUT", "Transfer Out"),
        ("TRANSFER_IN", "Transfer In"),
        ("ADJUSTMENT", "Adjustment"),
        ("WRITE_OFF", "Write Off"),
        ("RETURN_IN", "Return In"),
        ("RETURN_OUT", "Return Out"),
    ]

    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="movements")
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES, db_index=True)
    reference_type = models.CharField(max_length=50, blank=True, default="")
    reference_id = models.UUIDField(null=True, blank=True)
    qty = models.IntegerField(default=1)
    weight = models.DecimalField(max_digits=12, decimal_places=4)
    rate = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    ts = models.DateTimeField(db_index=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["item", "ts"]),
            models.Index(fields=["tenant", "movement_type", "ts"]),
        ]
        ordering = ["-ts"]

    def __str__(self) -> str:
        return f"{self.movement_type} — {self.item_id} @ {self.ts}"


class Transfer(JewelleryBaseModel):
    STATUS = [
        ("REQUESTED", "Requested"),
        ("APPROVED", "Approved"),
        ("IN_TRANSIT", "In Transit"),
        ("RECEIVED", "Received"),
        ("REJECTED", "Rejected"),
    ]

    from_branch = models.CharField(max_length=120)
    to_branch = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=STATUS, default="REQUESTED", db_index=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        indexes = [models.Index(fields=["tenant", "status", "created_at"])]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Transfer {self.from_branch}→{self.to_branch} [{self.status}]"


class TransferLine(models.Model):
    transfer = models.ForeignKey(Transfer, on_delete=models.CASCADE, related_name="lines")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="transfer_lines")
    qty = models.IntegerField(default=1)
    weight = models.DecimalField(max_digits=12, decimal_places=4)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"TransferLine {self.transfer_id} — {self.item_id}"


class StockTake(JewelleryBaseModel):
    STATUS = [
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="IN_PROGRESS", db_index=True)
    conducted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        indexes = [models.Index(fields=["tenant", "status", "started_at"])]
        ordering = ["-started_at"]

    def __str__(self) -> str:
        return f"StockTake {self.started_at.date()} [{self.status}]"


class StockTakeLine(models.Model):
    stock_take = models.ForeignKey(StockTake, on_delete=models.CASCADE, related_name="lines")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="stock_take_lines")
    system_qty = models.IntegerField()
    system_wt = models.DecimalField(max_digits=12, decimal_places=4)
    counted_qty = models.IntegerField(null=True, blank=True)
    counted_wt = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    variance = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["stock_take", "item"],
                name="uniq_jwl_stocktakeline_take_item",
            )
        ]

    def __str__(self) -> str:
        return f"StockTakeLine {self.stock_take_id} — {self.item_id}"
