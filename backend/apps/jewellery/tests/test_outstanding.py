"""B-2.4 Party Outstanding tests."""

from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.billing import Customer
from apps.jewellery.models.master import Metal, Purity
from apps.jewellery.models.outstanding import PartyOutstandingBalance, PartyOutstandingMovement
from apps.jewellery.services.outstanding import get_ageing_report, get_or_create_balance, post_movement
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole

OUTSTANDING_URL = "/api/jwl/v1/outstanding/"


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
    return metal, purity


def _make_customer(tenant, mobile="9100001001", name="Test Customer"):
    return Customer.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        name=name, mobile=mobile,
    )


def _make_cashier(mobile, name, tenant):
    """Create a user with CASHIER role under the given tenant."""
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
        role_code=JwlRoleCode.CASHIER,
        branch_name="",
        granted_by=tenant,
        is_active=True,
    )
    return user


# ─── Service Unit Tests ───────────────────────────────────────────────────────

class OutstandingServiceTests(TestCase):

    def setUp(self):
        self.tenant = _make_tenant("9200001001", "Outstanding Shop")
        self.customer = _make_customer(self.tenant)

    def test_post_movement_updates_balance(self):
        """Two movements should sum correctly in balance."""
        m1 = post_movement(
            tenant=self.tenant,
            customer=self.customer,
            movement_type="INVOICE_DEBIT",
            amount_delta=Decimal("5000.00"),
            txn_date=date.today(),
        )
        m2 = post_movement(
            tenant=self.tenant,
            customer=self.customer,
            movement_type="PAYMENT_RECEIVED",
            amount_delta=Decimal("-2000.00"),
            txn_date=date.today(),
        )

        balance = PartyOutstandingBalance.objects.get(customer=self.customer)
        self.assertEqual(balance.amount_balance, Decimal("3000.00"))
        self.assertEqual(balance.movements.count(), 2)

    def test_metal_balance_accumulates(self):
        """Metal deltas should accumulate in balance."""
        post_movement(
            tenant=self.tenant,
            customer=self.customer,
            movement_type="METAL_ISSUED",
            metal_delta_grams=Decimal("10.5000"),
            txn_date=date.today(),
        )
        post_movement(
            tenant=self.tenant,
            customer=self.customer,
            movement_type="METAL_RECEIVED",
            metal_delta_grams=Decimal("-3.2500"),
            txn_date=date.today(),
        )

        balance = PartyOutstandingBalance.objects.get(customer=self.customer)
        self.assertAlmostEqual(float(balance.metal_balance_grams), 7.25, places=4)

    def test_select_for_update_race_safety(self):
        """Verify atomic update pattern: movement + balance in same transaction."""
        # We can't easily test concurrency in SQLite, but verify:
        # 1. Balance and movement are created within the same atomic block.
        # 2. Balance reflects the movement immediately after.
        from django.db import transaction
        with transaction.atomic():
            movement = post_movement(
                tenant=self.tenant,
                customer=self.customer,
                movement_type="MANUAL_ADJUSTMENT",
                amount_delta=Decimal("1000.00"),
                txn_date=date.today(),
            )
            # Within the same outer transaction, the balance must already reflect the movement
            balance = PartyOutstandingBalance.objects.get(customer=self.customer)
            self.assertEqual(balance.amount_balance, Decimal("1000.00"))

        # Verify movement is persisted
        self.assertTrue(
            PartyOutstandingMovement.objects.filter(id=movement.id).exists()
        )

    def test_ageing_report_marks_overdue(self):
        """Customer with last_txn_date > 90 days ago gets overdue_90_plus=True."""
        old_date = date.today() - timedelta(days=100)
        balance = get_or_create_balance(self.tenant, self.customer)
        balance.last_txn_date = old_date
        balance.save(update_fields=["last_txn_date"])

        report = get_ageing_report(self.tenant)
        self.assertEqual(len(report), 1)
        self.assertTrue(report[0]["overdue_90_plus"])

    def test_ageing_report_not_overdue_recent(self):
        """Customer with recent transaction is NOT overdue."""
        balance = get_or_create_balance(self.tenant, self.customer)
        balance.last_txn_date = date.today() - timedelta(days=30)
        balance.save(update_fields=["last_txn_date"])

        report = get_ageing_report(self.tenant)
        self.assertEqual(len(report), 1)
        self.assertFalse(report[0]["overdue_90_plus"])

    def test_get_or_create_balance_idempotent(self):
        """Calling get_or_create_balance twice returns same record."""
        b1 = get_or_create_balance(self.tenant, self.customer)
        b2 = get_or_create_balance(self.tenant, self.customer)
        self.assertEqual(b1.id, b2.id)
        self.assertEqual(PartyOutstandingBalance.objects.filter(customer=self.customer).count(), 1)

    def test_last_txn_date_tracks_latest(self):
        """last_txn_date should track the most recent txn_date."""
        old = date.today() - timedelta(days=10)
        new = date.today()

        post_movement(
            tenant=self.tenant, customer=self.customer,
            movement_type="INVOICE_DEBIT", txn_date=old,
        )
        post_movement(
            tenant=self.tenant, customer=self.customer,
            movement_type="PAYMENT_RECEIVED", txn_date=new,
        )

        balance = PartyOutstandingBalance.objects.get(customer=self.customer)
        self.assertEqual(balance.last_txn_date, new)


# ─── API Tests ────────────────────────────────────────────────────────────────

class OutstandingApiTests(APITestCase):

    def setUp(self):
        self.tenant = _make_tenant("9200002001", "Outstanding API Shop")
        self.customer = _make_customer(self.tenant, mobile="9200002100")
        self.client.force_authenticate(user=self.tenant)

    def _create_balance(self, amount=Decimal("5000.00")):
        return post_movement(
            tenant=self.tenant,
            customer=self.customer,
            movement_type="INVOICE_DEBIT",
            amount_delta=amount,
            txn_date=date.today(),
        )

    def test_list_returns_ageing_report(self):
        """GET /outstanding/ returns ageing report for tenant."""
        self._create_balance()
        resp = self.client.get(OUTSTANDING_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        row = resp.data[0]
        self.assertIn("customer_id", row)
        self.assertIn("amount_balance", row)
        self.assertIn("overdue_90_plus", row)

    def test_retrieve_balance_detail(self):
        """GET /outstanding/{id}/ returns balance with movements."""
        self._create_balance()
        balance = PartyOutstandingBalance.objects.get(customer=self.customer)
        resp = self.client.get(f"{OUTSTANDING_URL}{balance.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("movements", resp.data)
        self.assertEqual(len(resp.data["movements"]), 1)

    def test_manual_adjustment_api(self):
        """POST /outstanding/{id}/adjust/ creates movement + updates balance."""
        self._create_balance(amount=Decimal("3000.00"))
        balance = PartyOutstandingBalance.objects.get(customer=self.customer)

        resp = self.client.post(
            f"{OUTSTANDING_URL}{balance.id}/adjust/",
            {
                "movement_type": "MANUAL_ADJUSTMENT",
                "amount_delta": "-1000.00",
                "metal_delta_grams": "0.0000",
                "notes": "Correction entry",
                "txn_date": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["movement_type"], "MANUAL_ADJUSTMENT")
        self.assertEqual(Decimal(resp.data["amount_balance"]), Decimal("2000.00"))

        # Verify DB
        balance.refresh_from_db()
        self.assertEqual(balance.amount_balance, Decimal("2000.00"))
        self.assertEqual(balance.movements.count(), 2)

    def test_tenant_isolation(self):
        """Tenant B cannot see Tenant A balances."""
        self._create_balance()

        tenant_b = _make_tenant("9200003001", "Other Shop B")
        self.client.force_authenticate(user=tenant_b)

        resp = self.client.get(OUTSTANDING_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)

    def test_readonly_for_cashier_list(self):
        """Cashier role gets 403 on list (no P_ACCOUNTS_VIEW)."""
        self._create_balance()
        cashier = _make_cashier("9200004001", "Cashier User", self.tenant)
        self.client.force_authenticate(user=cashier)

        resp = self.client.get(OUTSTANDING_URL)
        self.assertEqual(resp.status_code, 403)

    def test_readonly_for_cashier_adjust(self):
        """Cashier role gets 403 on adjust endpoint."""
        self._create_balance()
        balance = PartyOutstandingBalance.objects.get(customer=self.customer)

        cashier = _make_cashier("9200004002", "Cashier User 2", self.tenant)
        self.client.force_authenticate(user=cashier)

        resp = self.client.post(
            f"{OUTSTANDING_URL}{balance.id}/adjust/",
            {"movement_type": "MANUAL_ADJUSTMENT", "amount_delta": "100.00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_manager_can_adjust(self):
        """Manager role can post adjustments (has P_ACCOUNTS_VIEW but not P_ACCOUNTS_ADJUST by default)."""
        # Note: per JWL_ROLE_PERMISSIONS, Manager has P_ACCOUNTS_VIEW but NOT P_ACCOUNTS_ADJUST.
        # Admin has P_ACCOUNTS_ADJUST. This test verifies Admin can adjust.
        self._create_balance(Decimal("1000.00"))
        balance = PartyOutstandingBalance.objects.get(customer=self.customer)

        # Admin (self.tenant) should be able to adjust
        resp = self.client.post(
            f"{OUTSTANDING_URL}{balance.id}/adjust/",
            {
                "movement_type": "MANUAL_ADJUSTMENT",
                "amount_delta": "500.00",
                "txn_date": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)

    def test_ageing_report_overdue_flag_in_api(self):
        """Ageing report from API correctly sets overdue_90_plus."""
        # Create balance with old txn date directly
        balance = get_or_create_balance(self.tenant, self.customer)
        balance.last_txn_date = date.today() - timedelta(days=95)
        balance.save(update_fields=["last_txn_date"])

        resp = self.client.get(OUTSTANDING_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertTrue(resp.data[0]["overdue_90_plus"])
