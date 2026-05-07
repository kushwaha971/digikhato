from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.billing import Customer, SalesInvoice
from apps.jewellery.models.inventory import Item
from apps.jewellery.models.master import Category, Design, Metal, Purity
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


def _make_master_for_billing(tenant: User):
    metal = Metal.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        code="GOLD",
        name="Gold",
    )
    purity = Purity.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        metal=metal,
        code="22K",
        pct=Decimal("91.600"),
    )
    category = Category.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        name="Rings",
        default_making_charge_formula="PER_GRAM",
    )
    design = Design.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        category=category,
        code="RG001",
        name="Plain Ring",
    )
    return Item.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        design=design,
        metal=metal,
        purity=purity,
        gross_wt=Decimal("10.5000"),
        net_wt=Decimal("10.0000"),
        status="IN_STOCK",
    )


class AdminFeatureFlagsAndTrashTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500201", "JWL Admin Controls Tenant")
        self.customer = Customer.objects.create(
            tenant=self.tenant,
            branch_name="",
            created_by=self.tenant,
            updated_by=self.tenant,
            name="Trash Customer",
            mobile="9000000201",
        )
        self.client.force_authenticate(user=self.tenant)

    def test_feature_flags_get_and_patch(self):
        url = reverse("jewellery:admin-feature-flags")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["feature_flags"], {})

        patch_resp = self.client.patch(
            url,
            {"feature_flags": {"billing_enabled": True, "allow_negative_stock": False}},
            format="json",
        )
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(patch_resp.data["feature_flags"]["billing_enabled"])
        self.assertFalse(patch_resp.data["feature_flags"]["allow_negative_stock"])

    def test_non_admin_manage_role_cannot_access_admin_endpoints(self):
        cashier = User.objects.create_user(
            mobile_number="9555500202",
            password="Test@1234",
            full_name="Cashier User",
            role="collector",
            tenant=self.tenant,
            branch_name="",
        )
        UserModuleRole.objects.create(
            user=cashier,
            module=ModuleCode.JEWELLERY,
            role_code=JwlRoleCode.CASHIER,
            branch_name="",
            granted_by=self.tenant,
            is_active=True,
        )

        self.client.force_authenticate(user=cashier)
        url = reverse("jewellery:admin-feature-flags")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_endpoints_require_authentication(self):
        self.client.force_authenticate(user=None)
        url = reverse("jewellery:admin-feature-flags")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_trash_list_invalid_entity_returns_400(self):
        url = reverse("jewellery:admin-trash-list")
        resp = self.client.get(url, {"entity": "unknown-entity"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_restore_customer_from_trash(self):
        delete_url = reverse("jewellery:customer-detail", kwargs={"pk": self.customer.id})
        del_resp = self.client.delete(delete_url)
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

        list_url = reverse("jewellery:admin-trash-list")
        trash_resp = self.client.get(list_url, {"entity": "customers"})
        self.assertEqual(trash_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(trash_resp.data["count"], 1)

        restore_url = reverse(
            "jewellery:admin-trash-restore",
            kwargs={"entity": "customers", "object_id": self.customer.id},
        )
        restore_resp = self.client.post(restore_url, {}, format="json")
        self.assertEqual(restore_resp.status_code, status.HTTP_200_OK)

        self.customer.refresh_from_db()
        self.assertIsNone(self.customer.deleted_at)

    def test_restore_invalid_entity_returns_400(self):
        restore_url = reverse(
            "jewellery:admin-trash-restore",
            kwargs={"entity": "unknown-entity", "object_id": uuid4()},
        )
        resp = self.client.post(restore_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_restore_non_deleted_record_returns_404(self):
        restore_url = reverse(
            "jewellery:admin-trash-restore",
            kwargs={"entity": "customers", "object_id": self.customer.id},
        )
        resp = self.client.post(restore_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class BillingLockPeriodEnforcementTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500203", "JWL Lock Period Tenant")
        self.item = _make_master_for_billing(self.tenant)
        self.customer = Customer.objects.create(
            tenant=self.tenant,
            branch_name="",
            created_by=self.tenant,
            updated_by=self.tenant,
            name="Lock Period Customer",
            mobile="9000000203",
        )
        self.client.force_authenticate(user=self.tenant)
        self.lock_url = reverse("jewellery:admin-lock-period")
        self.create_url = reverse("jewellery:sales-invoice-list")

    def _create_invoice(self, voucher_date):
        resp = self.client.post(
            self.create_url,
            {
                "customer": str(self.customer.id),
                "invoice_type": "TAX_INVOICE",
                "voucher_date": voucher_date.isoformat(),
                "lines": [
                    {
                        "item": str(self.item.id),
                        "description": "Gold Ring",
                        "net_wt": "10",
                        "rate_per_gram": "6373",
                        "making_mode": "PER_GRAM",
                        "making_rate": "150",
                        "wastage_pct": "0",
                        "hallmarking_fee": "45",
                        "stone_value": "0",
                        "gst_rate_pct": "3",
                    }
                ],
                "discount_amount": "0",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        return resp.data["id"]

    def _set_lock_period(self, lock_date):
        resp = self.client.post(
            self.lock_url,
            {"lock_period_end": lock_date.isoformat(), "reason": "Month close"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_lock_period_blocks_create_flow(self):
        today = timezone.localdate()
        self._set_lock_period(today)
        resp = self.client.post(
            self.create_url,
            {
                "customer": str(self.customer.id),
                "invoice_type": "TAX_INVOICE",
                "voucher_date": today.isoformat(),
                "lines": [
                    {
                        "item": str(self.item.id),
                        "description": "Gold Ring",
                        "net_wt": "10",
                        "rate_per_gram": "6373",
                        "making_mode": "PER_GRAM",
                        "making_rate": "150",
                        "wastage_pct": "0",
                        "hallmarking_fee": "45",
                        "stone_value": "0",
                        "gst_rate_pct": "3",
                    }
                ],
                "discount_amount": "0",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("locked", str(resp.data["detail"]).lower())

    def test_lock_period_blocks_issue_and_cancel(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        draft_id = self._create_invoice(yesterday)
        self._set_lock_period(today)

        issue_url = reverse("jewellery:sales-invoice-issue", kwargs={"pk": draft_id})
        issue_resp = self.client.post(issue_url, {}, format="json")
        self.assertEqual(issue_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # create and issue future-dated invoice before setting stricter lock for cancel check
        self.client.post(
            self.lock_url,
            {"lock_period_end": None, "reason": ""},
            format="json",
        )
        tomorrow = today + timedelta(days=1)
        invoice_id = self._create_invoice(tomorrow)
        issue_url_future = reverse("jewellery:sales-invoice-issue", kwargs={"pk": invoice_id})
        issue_future_resp = self.client.post(issue_url_future, {}, format="json")
        self.assertEqual(issue_future_resp.status_code, status.HTTP_200_OK)

        self._set_lock_period(tomorrow)
        cancel_url = reverse("jewellery:sales-invoice-cancel", kwargs={"pk": invoice_id})
        cancel_resp = self.client.post(cancel_url, {"reason": "Customer changed mind"}, format="json")
        self.assertEqual(cancel_resp.status_code, status.HTTP_400_BAD_REQUEST)
        invoice = SalesInvoice.objects.get(id=invoice_id)
        self.assertEqual(invoice.status, "ISSUED")

    def test_global_lock_still_applies_when_branch_control_exists_without_lock(self):
        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)

        # Set global lock up to today.
        self._set_lock_period(today)

        # Create a branch-scoped control without a lock by patching feature flags.
        flags_url = reverse("jewellery:admin-feature-flags")
        flags_resp = self.client.patch(
            flags_url,
            {"feature_flags": {"billing_enabled": True}},
            format="json",
            HTTP_X_BRANCH_NAME="B1",
        )
        self.assertEqual(flags_resp.status_code, status.HTTP_200_OK)

        # Even with branch control present, global lock must block same-day voucher creation.
        blocked_resp = self.client.post(
            self.create_url,
            {
                "customer": str(self.customer.id),
                "invoice_type": "TAX_INVOICE",
                "voucher_date": today.isoformat(),
                "lines": [
                    {
                        "item": str(self.item.id),
                        "description": "Gold Ring",
                        "net_wt": "10",
                        "rate_per_gram": "6373",
                        "making_mode": "PER_GRAM",
                        "making_rate": "150",
                        "wastage_pct": "0",
                        "hallmarking_fee": "45",
                        "stone_value": "0",
                        "gst_rate_pct": "3",
                    }
                ],
                "discount_amount": "0",
            },
            format="json",
            HTTP_X_BRANCH_NAME="B1",
        )
        self.assertEqual(blocked_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # A later date should still pass.
        allowed_resp = self.client.post(
            self.create_url,
            {
                "customer": str(self.customer.id),
                "invoice_type": "TAX_INVOICE",
                "voucher_date": tomorrow.isoformat(),
                "lines": [
                    {
                        "item": str(self.item.id),
                        "description": "Gold Ring",
                        "net_wt": "10",
                        "rate_per_gram": "6373",
                        "making_mode": "PER_GRAM",
                        "making_rate": "150",
                        "wastage_pct": "0",
                        "hallmarking_fee": "45",
                        "stone_value": "0",
                        "gst_rate_pct": "3",
                    }
                ],
                "discount_amount": "0",
            },
            format="json",
            HTTP_X_BRANCH_NAME="B1",
        )
        self.assertEqual(allowed_resp.status_code, status.HTTP_201_CREATED)

    def test_lock_period_can_be_cleared_and_reason_is_reset(self):
        today = timezone.localdate()
        self._set_lock_period(today)
        resp = self.client.post(
            self.lock_url,
            {"lock_period_end": None, "reason": "will-be-cleared"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNone(resp.data["lock_period_end"])
        self.assertEqual(resp.data["lock_period_reason"], "")
