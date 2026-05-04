from django.db import models

from apps.jewellery.models.base import JewelleryBaseModel


class Metal(JewelleryBaseModel):
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=50)
    default_unit = models.CharField(max_length=10, default="gram")

    class Meta:
        indexes = [models.Index(fields=["tenant", "code"])]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "code"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_metal_tenant_code_active",
            ),
        ]
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} ({self.tenant_id})"


class Purity(JewelleryBaseModel):
    metal = models.ForeignKey(Metal, on_delete=models.PROTECT, related_name="purities")
    code = models.CharField(max_length=10)
    pct = models.DecimalField(max_digits=6, decimal_places=3)

    class Meta:
        indexes = [models.Index(fields=["tenant", "metal", "code"])]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "metal", "code"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_purity_tenant_metal_code_active",
            ),
        ]
        ordering = ["metal__code", "-pct"]

    def __str__(self) -> str:
        return f"{self.metal.code}-{self.code} ({self.tenant_id})"


class Category(JewelleryBaseModel):
    MAKING_CHARGE_FORMULAS = [
        ("PER_GRAM", "Per Gram"),
        ("PCT_METAL", "% of Metal"),
        ("PER_PIECE", "Per Piece"),
    ]

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    name = models.CharField(max_length=100)
    hsn_code = models.CharField(max_length=10, blank=True, default="")
    default_making_charge_formula = models.CharField(
        max_length=20,
        choices=MAKING_CHARGE_FORMULAS,
        default="PER_GRAM",
    )
    default_wastage_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=["tenant", "parent", "name"])]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "parent", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_category_tenant_parent_name_active",
            ),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Design(JewelleryBaseModel):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="designs")
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=200)
    image_urls = models.JSONField(default=list, blank=True)
    default_weight = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    default_stones = models.JSONField(default=dict, blank=True)
    default_labour = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    bom = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [models.Index(fields=["tenant", "category", "code"])]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "code"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_design_tenant_code_active",
            ),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class TaxSlab(JewelleryBaseModel):
    APPLIES_TO_CHOICES = [
        ("JEWELLERY", "Jewellery"),
        ("SERVICE", "Service"),
        ("OTHER", "Other"),
    ]

    name = models.CharField(max_length=100)
    rate_pct = models.DecimalField(max_digits=5, decimal_places=2)
    applies_to = models.CharField(max_length=20, choices=APPLIES_TO_CHOICES, default="JEWELLERY")
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["tenant", "applies_to", "effective_from"])]
        ordering = ["-effective_from", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.rate_pct}%)"


class NumberSeries(JewelleryBaseModel):
    voucher_type = models.CharField(max_length=50)
    prefix = models.CharField(max_length=20)
    next_number = models.PositiveIntegerField(default=1)
    padding = models.PositiveIntegerField(default=5)

    class Meta:
        indexes = [models.Index(fields=["tenant", "voucher_type"])]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "voucher_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_jwl_series_tenant_voucher_type_active",
            ),
        ]
        ordering = ["voucher_type"]

    def __str__(self) -> str:
        return f"{self.voucher_type}: {self.prefix}"
