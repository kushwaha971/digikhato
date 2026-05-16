"""Tests for Accounts & Ledger module (Module 5)."""

from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.accounts import Account, Voucher, VoucherEntry
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole


def _make_tenant(mobile: str, name: str) -> User:
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


def _make_account(tenant, code, name, account_type, parent=None):
    return Account.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        code=code,
        name=name,
        account_type=account_type,
        parent=parent,
        is_system=True,
    )


def _make_voucher(tenant, voucher_no, voucher_date, voucher_type="RECEIPT", status="DRAFT"):
    return Voucher.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        voucher_no=voucher_no,
        voucher_date=voucher_date,
        voucher_type=voucher_type,
        total_amount=Decimal("1000.00"),
        status=status,
    )


def _make_entry(tenant, voucher, account, debit=Decimal("0"), credit=Decimal("0")):
    return VoucherEntry.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        voucher=voucher,
        account=account,
        debit=debit,
        credit=credit,
    )


class CoaTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500601", "COA Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.coa_url = reverse("jewellery:jwl-coa")

    def test_admin_can_fetch_coa(self):
        _make_account(self.tenant, "1000", "Cash", "ASSET")
        resp = self.client.get(self.coa_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_coa_returns_tree_with_children(self):
        parent = _make_account(self.tenant, "1000", "Cash", "ASSET")
        _make_account(self.tenant, "1010", "Petty Cash", "ASSET", parent=parent)

        resp = self.client.get(self.coa_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Find the root account
        root = next((a for a in resp.data if a["code"] == "1000"), None)
        self.assertIsNotNone(root)
        self.assertEqual(len(root["children"]), 1)
        self.assertEqual(root["children"][0]["code"], "1010")

    def test_coa_only_shows_own_tenant_accounts(self):
        other_tenant = _make_tenant("9555500602", "Other Tenant")
        _make_account(other_tenant, "1000", "Cash", "ASSET")
        _make_account(self.tenant, "2000", "Bank", "ASSET")

        resp = self.client.get(self.coa_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        codes = [a["code"] for a in resp.data]
        self.assertIn("2000", codes)
        self.assertNotIn("1000", codes)

    def test_coa_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.coa_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class VoucherTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500603", "Voucher Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.list_url = reverse("jewellery:jwl-vouchers")
        self.cash_account = _make_account(self.tenant, "1000", "Cash", "ASSET")
        self.sales_account = _make_account(self.tenant, "3000", "Sales", "INCOME")

    def test_create_voucher_as_draft(self):
        payload = {
            "voucher_no": "VCH-001",
            "voucher_date": "2026-05-01",
            "voucher_type": "RECEIPT",
            "narration": "Test receipt",
            "total_amount": "500.00",
            "entries": [
                {
                    "account_id": str(self.cash_account.id),
                    "debit": "500.00",
                    "credit": "0.00",
                    "narration": "",
                },
                {
                    "account_id": str(self.sales_account.id),
                    "debit": "0.00",
                    "credit": "500.00",
                    "narration": "",
                },
            ],
        }
        resp = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], "DRAFT")
        self.assertEqual(resp.data["voucher_no"], "VCH-001")
        self.assertEqual(len(resp.data["entries"]), 2)

    def test_post_voucher_changes_status(self):
        voucher = _make_voucher(self.tenant, "VCH-002", "2026-05-02")
        post_url = reverse("jewellery:jwl-voucher-post", kwargs={"pk": voucher.id})

        resp = self.client.post(post_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "POSTED")

        voucher.refresh_from_db()
        self.assertEqual(voucher.status, "POSTED")

    def test_post_already_posted_voucher_returns_400(self):
        voucher = _make_voucher(self.tenant, "VCH-003", "2026-05-03", status="POSTED")
        post_url = reverse("jewellery:jwl-voucher-post", kwargs={"pk": voucher.id})

        resp = self.client.post(post_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_vouchers_returns_own_tenant(self):
        _make_voucher(self.tenant, "VCH-010", "2026-05-01")
        resp = self.client.get(self.list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        voucher_nos = [v["voucher_no"] for v in resp.data["results"]]
        self.assertIn("VCH-010", voucher_nos)

    def test_tenant_isolation_for_vouchers(self):
        other_tenant = _make_tenant("9555500604", "Other Voucher Tenant")
        _make_voucher(other_tenant, "VCH-OTHER", "2026-05-01")
        _make_voucher(self.tenant, "VCH-MINE", "2026-05-01")

        resp = self.client.get(self.list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        voucher_nos = [v["voucher_no"] for v in resp.data["results"]]
        self.assertIn("VCH-MINE", voucher_nos)
        self.assertNotIn("VCH-OTHER", voucher_nos)


class TrialBalanceTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500605", "Trial Balance Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.tb_url = reverse("jewellery:jwl-trial-balance")
        self.cash_account = _make_account(self.tenant, "1000", "Cash", "ASSET")
        self.sales_account = _make_account(self.tenant, "3000", "Sales", "INCOME")

    def test_trial_balance_returns_correct_totals(self):
        today = "2026-05-01"
        voucher = _make_voucher(self.tenant, "VCH-TB1", today, status="POSTED")
        _make_entry(self.tenant, voucher, self.cash_account, debit=Decimal("1000.00"))
        _make_entry(self.tenant, voucher, self.sales_account, credit=Decimal("1000.00"))

        resp = self.client.get(self.tb_url, {"date_from": today, "date_to": today})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        cash_row = next((r for r in resp.data if r["account_code"] == "1000"), None)
        sales_row = next((r for r in resp.data if r["account_code"] == "3000"), None)

        self.assertIsNotNone(cash_row)
        self.assertEqual(Decimal(cash_row["debit_total"]), Decimal("1000.00"))
        self.assertEqual(Decimal(cash_row["balance"]), Decimal("1000.00"))

        self.assertIsNotNone(sales_row)
        self.assertEqual(Decimal(sales_row["credit_total"]), Decimal("1000.00"))
        self.assertEqual(Decimal(sales_row["balance"]), Decimal("-1000.00"))

    def test_trial_balance_excludes_draft_vouchers(self):
        today = "2026-05-02"
        draft_voucher = _make_voucher(self.tenant, "VCH-TB-DRAFT", today, status="DRAFT")
        _make_entry(self.tenant, draft_voucher, self.cash_account, debit=Decimal("500.00"))

        resp = self.client.get(self.tb_url, {"date_from": today, "date_to": today})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Draft entries should not appear
        cash_row = next((r for r in resp.data if r["account_code"] == "1000"), None)
        self.assertIsNone(cash_row)

    def test_trial_balance_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.tb_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
