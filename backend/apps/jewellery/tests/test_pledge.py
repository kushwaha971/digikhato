"""B-2.5 gold pledge loan service tests: formulas §7.11–7.16 + API."""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.billing import Customer
from apps.jewellery.models.master import Metal, NumberSeries, Purity
from apps.jewellery.models.pledge import GoldPledgeLoan, LoanScheme
from apps.jewellery.services.pledge import (
    calc_compound_interest,
    calc_daily_interest,
    calc_flat_interest,
    calc_foreclosure,
    calc_ltv,
    calc_simple_interest,
    create_loan,
)
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole

SCHEME_URL = "/api/jwl/v1/loan-schemes/"
LOAN_URL = "/api/jwl/v1/pledge-loans/"


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
    NumberSeries.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        voucher_type="PLEDGE_LOAN", prefix="PL", next_number=1, padding=4,
    )
    return metal, purity


def _make_customer(tenant, mobile="9000002001"):
    return Customer.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        name="Pledge Customer", mobile=mobile,
    )


def _make_scheme(tenant, method="SIMPLE", rate="2.000", ltv="75.00"):
    return LoanScheme.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        name=f"Scheme {method}", ltv_pct=Decimal(ltv),
        interest_method=method, interest_rate_pct=Decimal(rate),
        min_tenure=1, max_tenure=24,
    )


# ─── Formula Unit Tests ───────────────────────────────────────────────────────

class PledgeFormulaTests(TestCase):

    def test_simple_interest_spec_example(self):
        """§7.11: ₹50,000 at 2%/month for 6 months → interest = ₹6,000."""
        result = calc_simple_interest(Decimal("50000"), Decimal("2"), Decimal("6"))
        self.assertEqual(result["interest"], Decimal("6000.00"))
        self.assertEqual(result["total_due"], Decimal("56000.00"))

    def test_compound_interest_spec_example(self):
        """§7.12: ₹50,000 at 2% compounded monthly for 6 months → total ≈ ₹56,308."""
        result = calc_compound_interest(Decimal("50000"), Decimal("2"), Decimal("6"))
        # spec says 56,308 — allow ±1 rupee
        self.assertAlmostEqual(float(result["total_due"]), 56308.12, delta=1.0)

    def test_daily_interest_spec_example(self):
        """§7.13: ₹50,000 at 2%/month for 47 days → ≈ ₹1,566.67."""
        result = calc_daily_interest(Decimal("50000"), Decimal("2"), 47)
        self.assertAlmostEqual(float(result["interest"]), 1566.67, delta=1.0)

    def test_flat_interest(self):
        """§7.14: ₹50,000 at 5% flat → interest = ₹2,500."""
        result = calc_flat_interest(Decimal("50000"), Decimal("5"))
        self.assertEqual(result["interest"], Decimal("2500.00"))
        self.assertEqual(result["total_due"], Decimal("52500.00"))

    def test_ltv_spec_example(self):
        """§7.15: 80g net at ₹6278/g, LTV 75% → max_loan ≈ ₹3,76,680."""
        result = calc_ltv(
            pledge_items=[{"net_wt": "80"}],
            buy_rate_per_gram=Decimal("6278"),
            ltv_pct=Decimal("75"),
        )
        self.assertAlmostEqual(float(result["max_loan"]), 376680.0, delta=1.0)
        self.assertEqual(result["pledge_value"], Decimal("502240.00"))

    def test_foreclosure_rebate_reduces_due(self):
        """§7.16: foreclosing early reduces amount due vs full-tenure interest."""
        full = calc_simple_interest(Decimal("50000"), Decimal("2"), Decimal("6"))
        result = calc_foreclosure(
            principal=Decimal("50000"),
            rate_pct=Decimal("2"),
            method="SIMPLE",
            tenure_months=6,
            days_elapsed=90,  # half the tenure
            rebate_factor=Decimal("1"),
        )
        self.assertLess(result["amount_due"], full["total_due"])
        self.assertGreater(result["rebate"], Decimal("0"))


# ─── API Tests ────────────────────────────────────────────────────────────────

class PledgeLoanApiTests(APITestCase):

    def setUp(self):
        self.tenant = _make_tenant("9900003001", "Pledge Shop")
        self.metal, self.purity = _make_master(self.tenant)
        self.customer = _make_customer(self.tenant)
        self.scheme = _make_scheme(self.tenant)
        self.client.force_authenticate(user=self.tenant)

    def test_create_loan_scheme(self):
        resp = self.client.post(SCHEME_URL, {
            "name": "Standard Scheme",
            "ltv_pct": "70.00",
            "interest_method": "COMPOUND",
            "interest_rate_pct": "1.500",
            "min_tenure": 3,
            "max_tenure": 12,
            "late_fee_pct": "0.50",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["name"], "Standard Scheme")

    def test_create_pledge_loan(self):
        resp = self.client.post(LOAN_URL, {
            "customer": str(self.customer.id),
            "scheme": str(self.scheme.id),
            "principal": "50000.00",
            "tenure_months": 6,
            "pledge_items": [
                {
                    "description": "Gold ring",
                    "metal": str(self.metal.id),
                    "purity": str(self.purity.id),
                    "gross_wt": "10.0000",
                    "net_wt": "9.5000",
                    "stone_wt": "0.0000",
                    "valuation_rate": "6200.0000",
                }
            ],
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.data["loan_no"].startswith("PL"))
        self.assertEqual(len(resp.data["pledge_items"]), 1)

    def test_interest_preview(self):
        # create loan first via service
        loan = create_loan(
            tenant=self.tenant,
            branch_name="",
            customer=self.customer,
            scheme=self.scheme,
            data={"principal": Decimal("50000"), "tenure_months": 6},
            pledge_items_data=[{
                "metal": str(self.metal.id),
                "purity": str(self.purity.id),
                "gross_wt": "10.0000",
                "net_wt": "9.5000",
                "valuation_rate": "6200.0000",
            }],
            created_by=self.tenant,
        )
        resp = self.client.get(f"{LOAN_URL}{loan.id}/interest/?days=60")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("interest", resp.data)
        self.assertIn("total_due", resp.data)

    def test_tenant_isolation(self):
        """Tenant B cannot see Tenant A loans."""
        tenant_b = _make_tenant("9900003002", "Other Shop")
        self.client.force_authenticate(user=tenant_b)
        resp = self.client.get(LOAN_URL)
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        count = data["count"] if isinstance(data, dict) else len(data)
        self.assertEqual(count, 0)
