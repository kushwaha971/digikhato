from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.jewellery.models.master import Category, Metal, NumberSeries, Purity, TaxSlab
from apps.users.models import User


DEFAULT_METALS = [
    {"code": "GOLD", "name": "Gold", "default_unit": "gram"},
    {"code": "SILVER", "name": "Silver", "default_unit": "gram"},
    {"code": "PLAT", "name": "Platinum", "default_unit": "gram"},
]

DEFAULT_PURITIES = {
    "GOLD": [("24K", Decimal("99.900")), ("22K", Decimal("91.600")), ("18K", Decimal("75.000")), ("14K", Decimal("58.500")), ("9K", Decimal("37.500"))],
    "SILVER": [("S999", Decimal("99.900")), ("S925", Decimal("92.500"))],
    "PLAT": [("PT999", Decimal("99.900")), ("PT950", Decimal("95.000"))],
}

DEFAULT_TAX_SLABS = [
    {"name": "Jewellery GST 3%", "rate_pct": Decimal("3.00"), "applies_to": "JEWELLERY"},
    {"name": "Repair Labour GST 5%", "rate_pct": Decimal("5.00"), "applies_to": "SERVICE"},
    {"name": "Hallmark / Service GST 18%", "rate_pct": Decimal("18.00"), "applies_to": "OTHER"},
]

DEFAULT_NUMBER_SERIES = [
    {"voucher_type": "SALES_INVOICE", "prefix": "INV", "next_number": 1, "padding": 5},
    {"voucher_type": "ESTIMATE", "prefix": "EST", "next_number": 1, "padding": 5},
    {"voucher_type": "OLD_GOLD_PURCHASE", "prefix": "OGP", "next_number": 1, "padding": 5},
    {"voucher_type": "CUSTOMER_ORDER", "prefix": "ORD", "next_number": 1, "padding": 5},
    {"voucher_type": "KARIGAR_ISSUE", "prefix": "KIS", "next_number": 1, "padding": 5},
    {"voucher_type": "KARIGAR_RECEIPT", "prefix": "KRC", "next_number": 1, "padding": 5},
    {"voucher_type": "STOCK_TAKE", "prefix": "STK", "next_number": 1, "padding": 5},
    {"voucher_type": "TRANSFER", "prefix": "TRF", "next_number": 1, "padding": 5},
]


class Command(BaseCommand):
    help = "Seed default jewellery masters per tenant (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--tenant-id", type=int, help="Seed for one tenant only")

    @transaction.atomic
    def handle(self, *args, **options):
        tenant_id = options.get("tenant_id")

        tenants = User.objects.filter(role="admin")
        if tenant_id:
            tenants = tenants.filter(id=tenant_id)

        seeded_tenants = 0
        for tenant in tenants.iterator():
            self._seed_for_tenant(tenant)
            seeded_tenants += 1

        self.stdout.write(self.style.SUCCESS(f"Jewellery defaults seeded for {seeded_tenants} tenant(s)."))

    def _seed_for_tenant(self, tenant):
        created_by = tenant

        metal_by_code = {}
        for m in DEFAULT_METALS:
            metal, _ = Metal.objects.update_or_create(
                tenant=tenant,
                code=m["code"],
                deleted_at__isnull=True,
                defaults={
                    "name": m["name"],
                    "default_unit": m["default_unit"],
                    "branch_name": "",
                    "created_by": created_by,
                    "updated_by": created_by,
                },
            )
            metal_by_code[m["code"]] = metal

        for metal_code, purity_list in DEFAULT_PURITIES.items():
            metal = metal_by_code[metal_code]
            for purity_code, pct in purity_list:
                Purity.objects.update_or_create(
                    tenant=tenant,
                    metal=metal,
                    code=purity_code,
                    deleted_at__isnull=True,
                    defaults={
                        "pct": pct,
                        "branch_name": "",
                        "created_by": created_by,
                        "updated_by": created_by,
                    },
                )

        for slab in DEFAULT_TAX_SLABS:
            TaxSlab.objects.update_or_create(
                tenant=tenant,
                name=slab["name"],
                deleted_at__isnull=True,
                defaults={
                    "rate_pct": slab["rate_pct"],
                    "applies_to": slab["applies_to"],
                    "effective_from": date(2020, 1, 1),
                    "effective_to": None,
                    "branch_name": "",
                    "created_by": created_by,
                    "updated_by": created_by,
                },
            )

        for series in DEFAULT_NUMBER_SERIES:
            NumberSeries.objects.update_or_create(
                tenant=tenant,
                voucher_type=series["voucher_type"],
                deleted_at__isnull=True,
                defaults={
                    "prefix": series["prefix"],
                    "next_number": series["next_number"],
                    "padding": series["padding"],
                    "branch_name": "",
                    "created_by": created_by,
                    "updated_by": created_by,
                },
            )

        Category.objects.get_or_create(
            tenant=tenant,
            parent=None,
            name="General",
            deleted_at__isnull=True,
            defaults={
                "hsn_code": "7113",
                "default_making_charge_formula": "PER_GRAM",
                "default_wastage_pct": Decimal("0.00"),
                "branch_name": "",
                "created_by": created_by,
                "updated_by": created_by,
            },
        )
