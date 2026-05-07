"""B-2.1 karigar service tests: formula §7.18 + API."""

from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.billing import Customer
from apps.jewellery.models.karigar import CustomerOrder, Karigar, KarigarIssue, KarigarReceipt
from apps.jewellery.models.master import Category, Design, Metal, NumberSeries, Purity
from apps.jewellery.services.karigar import (
    advance_order_status,
    create_karigar_issue,
    create_karigar_receipt,
    reconcile_tunch,
)
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole


def _make_tenant(mobile, name):
    user = User.objects.create_user(
        mobile_number=mobile,
        password="Test@1234",
        full_name=name,
        role="admin",
    )
    BusinessProfile.objects.create(
        owner=user,
        business_name=name,
        feature_flags={"jewellery": True},
    )
    UserModuleRole.objects.create(
        user=user,
        module=ModuleCode.JEWELLERY,
        role_code=JwlRoleCode.ADMIN,
        branch_name="",
        granted_by=user,
        is_active=True,
    )
    return user


def _make_master(tenant):
    metal = Metal.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        code="GOLD", name="Gold",
    )
    purity = Purity.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        metal=metal, code="22K", pct=Decimal("91.600"),
    )
    category = Category.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        name="Rings", default_making_charge_formula="PER_GRAM",
    )
    design = Design.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        category=category, code="RG001", name="Plain Ring",
    )
    return metal, purity, design


def _make_karigar(tenant, code="KRG001", wastage_pct="2.00"):
    return Karigar.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        code=code, name=f"Karigar {code}",
        default_wastage_pct=Decimal(wastage_pct),
    )


def _make_customer(tenant, mobile="9000001001"):
    return Customer.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        name="Test Customer", mobile=mobile,
    )


# ─── §7.18 Tunch Reconciliation ──────────────────────────────────────────────

class ReconcileTunchTests(TestCase):

    def test_reconcile_tunch_zero_diff(self):
        """When karigar returns exactly the expected pure weight, diff is 0."""
        gross_issued = Decimal("100")
        tunch = Decimal("91.6")
        wastage_pct = Decimal("2")
        pure_issued = gross_issued * (tunch / Decimal("99.9"))
        allowed_wastage = pure_issued * (wastage_pct / Decimal("100"))
        expected_received = pure_issued - allowed_wastage

        result = reconcile_tunch(
            gross_issued=gross_issued,
            issued_tunch_pct=tunch,
            gross_received=expected_received * (Decimal("99.9") / tunch),
            stone_wt=Decimal("0"),
            final_purity_pct=tunch,
            allowed_wastage_pct=wastage_pct,
        )
        self.assertAlmostEqual(float(result["diff_pure"]), 0.0, places=4)

    def test_reconcile_tunch_deficit(self):
        """Karigar returns less than expected → diff_pure is negative."""
        result = reconcile_tunch(
            gross_issued=Decimal("100"),
            issued_tunch_pct=Decimal("91.6"),
            gross_received=Decimal("85"),
            stone_wt=Decimal("0"),
            final_purity_pct=Decimal("91.6"),
            allowed_wastage_pct=Decimal("2"),
        )
        self.assertLess(result["diff_pure"], Decimal("0"))

    def test_reconcile_tunch_spec_example(self):
        """
        Formula 7.18 worked example:
        Issued: 100g gross @ 91.6 tunch → pure_issued = 100 × 91.6/99.9 = 91.6917g
        Allowed wastage 2% → 1.8338g
        Expected received = 91.6917 - 1.8338 = 89.8579g
        Karigar returns 96g gross, stone 2g, purity 91.6
        pure_received = (96-2) × 91.6/99.9 = 94 × 0.9169... = 86.1936g
        diff = 86.1936 - 89.8579 = -3.66... (deficit)
        """
        result = reconcile_tunch(
            gross_issued=Decimal("100"),
            issued_tunch_pct=Decimal("91.6"),
            gross_received=Decimal("96"),
            stone_wt=Decimal("2"),
            final_purity_pct=Decimal("91.6"),
            allowed_wastage_pct=Decimal("2"),
        )
        self.assertIn("pure_issued", result)
        self.assertIn("pure_received", result)
        self.assertIn("diff_pure", result)
        self.assertIn("allowed_wastage_pure", result)
        self.assertIn("expected_pure_received", result)
        # karigar received less than expected → deficit
        self.assertLess(result["diff_pure"], Decimal("0"))
        # verify pure_issued formula
        expected_pure_issued = Decimal("100") * (Decimal("91.6") / Decimal("99.9"))
        self.assertAlmostEqual(float(result["pure_issued"]), float(expected_pure_issued), places=4)


# ─── API Tests ────────────────────────────────────────────────────────────────

karigar_url = "/api/jwl/v1/karigar/"
orders_url = "/api/jwl/v1/orders/"
issues_url = "/api/jwl/v1/karigar-issues/"
receipts_url = "/api/jwl/v1/karigar-receipts/"


class KarigarApiTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9666600010", "Karigar Test Tenant")
        self.metal, self.purity, self.design = _make_master(self.tenant)
        self.customer = _make_customer(self.tenant, "9666600011")
        self.karigar = _make_karigar(self.tenant)
        self.client.force_authenticate(user=self.tenant)

    def test_create_karigar(self):
        resp = self.client.post(karigar_url, {
            "code": "KRG002",
            "name": "Test Karigar 2",
            "mobile": "9111111111",
            "default_wastage_pct": "3.00",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["code"], "KRG002")

    def test_create_order(self):
        resp = self.client.post(orders_url, {
            "customer_id": str(self.customer.id),
            "order_date": "2026-05-01",
            "advance_amount": "5000.00",
            "notes": "Plain ring order",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], "BOOKED")

    def test_advance_order_status_valid(self):
        order = CustomerOrder.objects.create(
            tenant=self.tenant, branch_name="", created_by=self.tenant, updated_by=self.tenant,
            customer=self.customer, order_date="2026-05-01",
        )
        resp = self.client.post(f"{orders_url}{order.id}/advance/", {"status": "METAL_ISSUED"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "METAL_ISSUED")

    def test_advance_order_status_invalid(self):
        order = CustomerOrder.objects.create(
            tenant=self.tenant, branch_name="", created_by=self.tenant, updated_by=self.tenant,
            customer=self.customer, order_date="2026-05-01",
        )
        resp = self.client.post(f"{orders_url}{order.id}/advance/", {"status": "DELIVERED"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_issue(self):
        resp = self.client.post(issues_url, {
            "karigar_id": str(self.karigar.id),
            "metal_id": str(self.metal.id),
            "gross_wt_issued": "100.0000",
            "tunch_pct": "91.600",
            "date": "2026-05-01",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # pure_gold_wt_issued = 100 × 91.6/99.9 ≈ 91.6917
        expected_pure = (Decimal("100") * Decimal("91.6") / Decimal("99.9")).quantize(Decimal("0.0001"))
        self.assertEqual(Decimal(resp.data["pure_gold_wt_issued"]), expected_pure)

    def test_create_receipt_with_reconciliation(self):
        # First create an issue directly
        issue = KarigarIssue.objects.create(
            tenant=self.tenant, branch_name="", created_by=self.tenant, updated_by=self.tenant,
            karigar=self.karigar, metal=self.metal,
            date="2026-05-01",
            gross_wt_issued=Decimal("100.0000"),
            tunch_pct=Decimal("91.600"),
            pure_gold_wt_issued=(Decimal("100") * Decimal("91.6") / Decimal("99.9")).quantize(Decimal("0.0001")),
        )
        resp = self.client.post(receipts_url, {
            "issue_id": str(issue.id),
            "gross_wt_received": "97.0000",
            "net_wt": "95.0000",
            "stone_wt": "2.0000",
            "final_purity_pct": "91.600",
            "wastage_actual_pct": "3.00",
            "labour_amount": "1500.00",
            "date": "2026-05-10",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # Verify pure_diff is present and computed
        self.assertIn("pure_diff", resp.data)
        self.assertIn("reconcile", resp.data)
        # pure_diff should be negative (karigar got less than expected with 2% allowed wastage)
        pure_diff = Decimal(resp.data["pure_diff"])
        # pure_issued = 100 × 91.6/99.9 ≈ 91.6917
        # allowed_wastage = 91.6917 × 2/100 ≈ 1.8338
        # expected = 91.6917 - 1.8338 = 89.8579
        # pure_received = (97-2) × 91.6/99.9 = 95 × 0.9169... = 87.1071
        # diff = 87.1071 - 89.8579 = -2.75... (deficit)
        self.assertLess(pure_diff, Decimal("0"))
