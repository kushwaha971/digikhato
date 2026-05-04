from decimal import Decimal

from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.jewellery.models.master import Category, Metal, NumberSeries, Purity, TaxSlab
from apps.onboarding.models import BusinessProfile
from apps.users.models import User


class JewelleryMasterTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            mobile_number="9555500001",
            password="Admin@1234",
            full_name="JWL Admin",
            role="admin",
        )
        BusinessProfile.objects.create(
            owner=self.admin,
            business_name="JWL Tenant",
            feature_flags={"jewellery": True},
        )
        self.client.force_authenticate(user=self.admin)

    def test_category_tree_returns_parent_and_child(self):
        parent = Category.objects.create(
            tenant=self.admin,
            branch_name="",
            created_by=self.admin,
            updated_by=self.admin,
            name="Rings",
            hsn_code="7113",
            default_making_charge_formula="PER_GRAM",
            default_wastage_pct=Decimal("2.00"),
        )
        Category.objects.create(
            tenant=self.admin,
            branch_name="",
            created_by=self.admin,
            updated_by=self.admin,
            parent=parent,
            name="Wedding Rings",
            hsn_code="7113",
            default_making_charge_formula="PER_GRAM",
            default_wastage_pct=Decimal("3.00"),
        )

        resp = self.client.get(reverse("jewellery:category-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        rows = resp.data.get("results", [])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "Rings")
        self.assertEqual(len(rows[0]["children"]), 1)
        self.assertEqual(rows[0]["children"][0]["name"], "Wedding Rings")

    def test_seed_command_is_idempotent(self):
        call_command("seed_jewellery_defaults", tenant_id=self.admin.id)
        counts_after_first = {
            "metals": Metal.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
            "purities": Purity.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
            "tax_slabs": TaxSlab.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
            "number_series": NumberSeries.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
        }

        call_command("seed_jewellery_defaults", tenant_id=self.admin.id)
        counts_after_second = {
            "metals": Metal.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
            "purities": Purity.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
            "tax_slabs": TaxSlab.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
            "number_series": NumberSeries.objects.filter(tenant=self.admin, deleted_at__isnull=True).count(),
        }

        self.assertEqual(counts_after_first, counts_after_second)
        self.assertEqual(counts_after_second["metals"], 3)
        self.assertGreaterEqual(counts_after_second["purities"], 9)
