"""B-1.3 inventory tests: write-off, scan, tenant isolation."""

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.jewellery.models.inventory import Item, StockMovement
from apps.jewellery.models.master import Category, Design, Metal, Purity
from apps.jewellery.services.inventory import scan_item, write_off_item
from apps.onboarding.models import BusinessProfile
from apps.users.models import User


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
    return user


def _make_item(tenant, sku="SKU001", barcode="BAR001", huid="HID001", status="IN_STOCK"):
    metal = Metal.objects.create(tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant, code="GOLD", name="Gold")
    purity = Purity.objects.create(tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant, metal=metal, code="22K", pct=Decimal("91.600"))
    category = Category.objects.create(tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant, name="Rings")
    design = Design.objects.create(tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant, category=category, code="D001", name="Ring Design")
    return Item.objects.create(
        tenant=tenant,
        branch_name="Main",
        created_by=tenant,
        updated_by=tenant,
        design=design,
        metal=metal,
        purity=purity,
        sku=sku,
        barcode=barcode,
        huid=huid,
        gross_wt=Decimal("10.0000"),
        net_wt=Decimal("9.5000"),
        status=status,
    )


class WriteOffTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500010", "WriteOff Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.item = _make_item(self.tenant)

    def test_write_off_creates_movement(self):
        write_off_item(self.item, reason="Damaged", performed_by=self.tenant)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "WRITTEN_OFF")
        movement = StockMovement.objects.get(item=self.item, movement_type="WRITE_OFF")
        self.assertEqual(movement.weight, Decimal("9.5000"))
        self.assertEqual(movement.notes, "Damaged")

    def test_write_off_api_endpoint(self):
        url = reverse("jewellery:item-write-off", kwargs={"pk": str(self.item.id)})
        resp = self.client.post(url, {"reason": "Lost"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "WRITTEN_OFF")

    def test_write_off_non_in_stock_raises(self):
        self.item.status = "SOLD"
        self.item.save(update_fields=["status"])
        with self.assertRaises(ValueError):
            write_off_item(self.item, reason="Error", performed_by=self.tenant)

    def test_write_off_api_rejects_non_in_stock(self):
        self.item.status = "SOLD"
        self.item.save(update_fields=["status"])
        url = reverse("jewellery:item-write-off", kwargs={"pk": str(self.item.id)})
        resp = self.client.post(url, {"reason": "test"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class ScanItemTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500011", "Scan Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.item = _make_item(self.tenant, sku="SKU-SCAN", barcode="BAR-SCAN", huid="HUID-SCAN")

    def test_scan_by_barcode(self):
        found = scan_item(self.tenant, "BAR-SCAN")
        self.assertEqual(found.id, self.item.id)

    def test_scan_by_sku(self):
        found = scan_item(self.tenant, "SKU-SCAN")
        self.assertEqual(found.id, self.item.id)

    def test_scan_by_huid(self):
        found = scan_item(self.tenant, "HUID-SCAN")
        self.assertEqual(found.id, self.item.id)

    def test_scan_missing_raises(self):
        with self.assertRaises(Item.DoesNotExist):
            scan_item(self.tenant, "NONEXISTENT")

    def test_scan_api_endpoint_by_barcode(self):
        url = reverse("jewellery:item-scan", kwargs={"code": "BAR-SCAN"})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(str(resp.data["id"]), str(self.item.id))

    def test_scan_api_endpoint_not_found(self):
        url = reverse("jewellery:item-scan", kwargs={"code": "NOTFOUND"})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class TenantIsolationTests(APITestCase):
    def setUp(self):
        self.tenant_a = _make_tenant("9555500012", "Tenant A")
        self.tenant_b = _make_tenant("9555500013", "Tenant B")
        self.item_a = _make_item(self.tenant_a, sku="A-SKU", barcode="A-BAR", huid="A-HID")
        self.item_b = _make_item(self.tenant_b, sku="B-SKU", barcode="B-BAR", huid="B-HID")

    def test_tenant_a_cannot_list_tenant_b_items(self):
        self.client.force_authenticate(user=self.tenant_a)
        url = reverse("jewellery:item-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [str(r["id"]) for r in resp.data.get("results", [])]
        self.assertIn(str(self.item_a.id), ids)
        self.assertNotIn(str(self.item_b.id), ids)

    def test_tenant_a_cannot_retrieve_tenant_b_item(self):
        self.client.force_authenticate(user=self.tenant_a)
        url = reverse("jewellery:item-detail", kwargs={"pk": str(self.item_b.id)})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_scan_does_not_cross_tenant(self):
        # Tenant A scanning Tenant B's barcode should get DoesNotExist
        with self.assertRaises(Item.DoesNotExist):
            scan_item(self.tenant_a, "B-BAR")
