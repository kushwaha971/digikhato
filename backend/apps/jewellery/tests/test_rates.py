"""B-1.4 rate service tests: formula correctness + API."""

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.master import Metal, Purity
from apps.jewellery.models.rates import RateHistory, TenantRate
from apps.jewellery.services.rates import calculate_gold_rate, get_live_rates, record_rate_override
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


def _make_metal_purity(tenant):
    metal = Metal.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        code="GOLD", name="Gold",
    )
    purity = Purity.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        metal=metal, code="22K", pct=Decimal("91.600"),
    )
    return metal, purity


class GoldRateFormulaTests(APITestCase):
    """§7.1 formula: MCX 68500 / 22K 91.6% / markup 1.5% → ₹6,375.09"""

    def test_spec_example_matches(self):
        result = calculate_gold_rate(
            mcx_rate_per_10g=Decimal("68500"),
            purity_pct=Decimal("91.600"),
            markup_pct=Decimal("1.5"),
        )
        self.assertEqual(result, Decimal("6375.09"))

    def test_zero_markup(self):
        result = calculate_gold_rate(
            mcx_rate_per_10g=Decimal("68500"),
            purity_pct=Decimal("91.600"),
            markup_pct=Decimal("0"),
        )
        self.assertEqual(result, Decimal("6280.88"))

    def test_24k_no_markup(self):
        result = calculate_gold_rate(
            mcx_rate_per_10g=Decimal("68500"),
            purity_pct=Decimal("99.9"),
            markup_pct=Decimal("0"),
        )
        self.assertEqual(result, Decimal("6850.00"))


class RateOverrideTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500020", "Rate Tenant")
        self.metal, self.purity = _make_metal_purity(self.tenant)
        self.client.force_authenticate(user=self.tenant)

    def test_override_creates_tenant_rate(self):
        record_rate_override(
            tenant=self.tenant,
            metal=self.metal,
            purity=self.purity,
            buy_rate=Decimal("6200.0000"),
            sell_rate=Decimal("6373.0000"),
            reason="Market rate",
            overridden_by=self.tenant,
        )
        self.assertTrue(
            TenantRate.objects.filter(
                tenant=self.tenant, metal=self.metal, purity=self.purity, deleted_at__isnull=True
            ).exists()
        )

    def test_override_records_rate_history(self):
        record_rate_override(
            tenant=self.tenant,
            metal=self.metal,
            purity=self.purity,
            buy_rate=Decimal("6200.0000"),
            sell_rate=Decimal("6373.0000"),
            reason="Test",
            overridden_by=self.tenant,
        )
        self.assertTrue(
            RateHistory.objects.filter(metal=self.metal, purity=self.purity, source="MANUAL").exists()
        )

    def test_override_is_idempotent(self):
        for _ in range(2):
            record_rate_override(
                tenant=self.tenant,
                metal=self.metal,
                purity=self.purity,
                buy_rate=Decimal("6200.0000"),
                sell_rate=Decimal("6373.0000"),
                reason="Test",
                overridden_by=self.tenant,
            )
        count = TenantRate.objects.filter(
            tenant=self.tenant, metal=self.metal, deleted_at__isnull=True
        ).count()
        self.assertEqual(count, 1)

    def test_override_api_endpoint(self):
        url = reverse("jewellery:rate-override")
        resp = self.client.post(url, {
            "metal": str(self.metal.id),
            "purity": str(self.purity.id),
            "buy_rate": "6200.0000",
            "sell_rate": "6373.0000",
            "reason": "API test",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_live_rates_returns_override(self):
        record_rate_override(
            tenant=self.tenant,
            metal=self.metal,
            purity=self.purity,
            buy_rate=Decimal("6200.0000"),
            sell_rate=Decimal("6373.0000"),
            reason="Test",
            overridden_by=self.tenant,
        )
        rates = get_live_rates(self.tenant)
        self.assertEqual(len(rates), 1)
        self.assertEqual(rates[0]["source"], "OVERRIDE")
        self.assertFalse(rates[0]["is_stale"])


class StaleFlagTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500021", "Stale Tenant")
        self.metal, self.purity = _make_metal_purity(self.tenant)

    def test_old_rate_history_is_stale(self):
        from django.utils import timezone
        old_ts = timezone.now() - timezone.timedelta(minutes=10)
        RateHistory.objects.create(
            metal=self.metal,
            purity=self.purity,
            source="MCX",
            rate_per_gram=Decimal("6373.0000"),
            ts=old_ts,
        )
        rates = get_live_rates(self.tenant)
        matching = [r for r in rates if r["metal"] == "GOLD" and r["purity"] == "22K"]
        self.assertEqual(len(matching), 1)
        self.assertTrue(matching[0]["is_stale"])
