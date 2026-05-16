"""B-1.3 inventory tests: write-off, scan, tenant isolation."""

from decimal import Decimal
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.inventory import Item, StockMovement, Transfer, TransferLine
from apps.jewellery.models.master import Category, Design, Metal, Purity
from apps.jewellery.serializers.inventory import ItemListSerializer
from apps.jewellery.services.inventory import (
    ITEM_STATUS_IN_STOCK,
    ITEM_STATUS_TRANSIT,
    STOCK_MOVEMENT_TYPE_TRANSFER_IN,
    STOCK_MOVEMENT_TYPE_TRANSFER_OUT,
    TRANSFER_STATUS_APPROVED,
    TRANSFER_STATUS_IN_TRANSIT,
    TRANSFER_STATUS_RECEIVED,
    TRANSFER_STATUS_REQUESTED,
    TRANSFER_STATUS_REJECTED,
    dispatch_transfer,
    receive_transfer,
    scan_item,
    write_off_item,
)
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole


def _make_tenant(mobile, name, role_code=JwlRoleCode.ADMIN):
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
        role_code=role_code,
        branch_name="",
        granted_by=user,
        is_active=True,
    )
    return user


def _make_item(tenant, sku="SKU001", barcode="BAR001", huid="HID001", status=ITEM_STATUS_IN_STOCK):
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

    def test_item_list_serializer_uses_category_hsn_default(self):
        serializer = ItemListSerializer()
        self.assertEqual(
            serializer.fields["hsn_code"].default,
            Category._meta.get_field("hsn_code").default,
        )


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


class TransferLifecycleTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500014", "Transfer Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.item = _make_item(
            self.tenant,
            sku="TR-SKU",
            barcode="TR-BAR",
            huid="TR-HID1",
        )
        self.transfer = Transfer.objects.create(
            tenant=self.tenant,
            branch_name="Main",
            created_by=self.tenant,
            updated_by=self.tenant,
            from_branch="Main",
            to_branch="Branch-2",
            status=TRANSFER_STATUS_APPROVED,
        )
        TransferLine.objects.create(
            transfer=self.transfer,
            item=self.item,
            qty=1,
            weight=self.item.net_wt,
        )

    def test_dispatch_and_receive_transfer_uses_enum_constants(self):
        dispatch_transfer(self.transfer, dispatched_by=self.tenant)
        self.transfer.refresh_from_db()
        self.item.refresh_from_db()
        self.assertEqual(self.transfer.status, TRANSFER_STATUS_IN_TRANSIT)
        self.assertEqual(self.item.status, ITEM_STATUS_TRANSIT)
        self.assertTrue(
            StockMovement.objects.filter(
                item=self.item,
                movement_type=STOCK_MOVEMENT_TYPE_TRANSFER_OUT,
            ).exists()
        )

        receive_transfer(self.transfer, received_by=self.tenant)
        self.transfer.refresh_from_db()
        self.item.refresh_from_db()
        self.assertEqual(self.transfer.status, TRANSFER_STATUS_RECEIVED)
        self.assertEqual(self.item.status, ITEM_STATUS_IN_STOCK)
        self.assertEqual(self.item.branch_name, "Branch-2")
        self.assertTrue(
            StockMovement.objects.filter(
                item=self.item,
                movement_type=STOCK_MOVEMENT_TYPE_TRANSFER_IN,
            ).exists()
        )


class TransferPolicyHardeningAPITests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500015", "Transfer Policy Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.item = _make_item(
            self.tenant,
            sku="TR-POLICY-1",
            barcode="TR-POLICY-BAR",
            huid="TRPOL1",
        )
        self.create_url = reverse("jewellery:transfer-list")

    def _create_payload(self, **overrides):
        payload = {
            "from_branch": "Main",
            "to_branch": "Branch-2",
            "notes": "Policy test",
            "lines": [{"item": str(self.item.id), "qty": 1, "weight": "9.5000"}],
        }
        payload.update(overrides)
        return payload

    def test_create_transfer_rejects_same_source_and_destination_branch(self):
        resp = self.client.post(
            self.create_url,
            self._create_payload(to_branch="Main"),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("to_branch", resp.data)

    def test_create_transfer_rejects_non_in_stock_items(self):
        self.item.status = "SOLD"
        self.item.save(update_fields=["status"])
        resp = self.client.post(self.create_url, self._create_payload(), format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("lines.0.item_status", resp.data)

    def test_create_transfer_rejects_item_from_different_branch(self):
        self.item.branch_name = "Branch-X"
        self.item.save(update_fields=["branch_name"])
        resp = self.client.post(self.create_url, self._create_payload(), format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("lines.0.item", resp.data)

    def test_create_transfer_rejects_cross_tenant_items(self):
        other_tenant = _make_tenant("9555500016", "Other Transfer Tenant")
        other_item = _make_item(
            other_tenant,
            sku="TR-OTHER-1",
            barcode="TR-OTHER-BAR",
            huid="TROTH1",
        )
        resp = self.client.post(
            self.create_url,
            self._create_payload(lines=[{"item": str(other_item.id), "qty": 1, "weight": "9.5000"}]),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("lines.0.item", resp.data)

    def test_create_transfer_rejects_duplicate_item_lines(self):
        resp = self.client.post(
            self.create_url,
            self._create_payload(
                lines=[
                    {"item": str(self.item.id), "qty": 1, "weight": "9.5000"},
                    {"item": str(self.item.id), "qty": 1, "weight": "9.5000"},
                ]
            ),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("lines.1.item", resp.data)

    def test_dispatch_rejects_when_item_state_changed_after_approval(self):
        transfer = Transfer.objects.create(
            tenant=self.tenant,
            branch_name="Main",
            created_by=self.tenant,
            updated_by=self.tenant,
            from_branch="Main",
            to_branch="Branch-2",
            status=TRANSFER_STATUS_APPROVED,
        )
        TransferLine.objects.create(
            transfer=transfer,
            item=self.item,
            qty=1,
            weight=self.item.net_wt,
        )
        self.item.status = "SOLD"
        self.item.save(update_fields=["status"])

        dispatch_url = reverse("jewellery:transfer-dispatch", kwargs={"pk": str(transfer.id)})
        resp = self.client.post(dispatch_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not IN_STOCK", str(resp.data.get("detail")))


class TransferRegisterReportAPITests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500017", "Transfer Report Tenant")
        self.client.force_authenticate(user=self.tenant)
        self.url = reverse("jewellery:transfer-register-report")

        self.item_1 = _make_item(self.tenant, sku="TR-REP-1", barcode="TR-REP-BAR-1", huid="TRREP1")

    def _create_transfer(self, *, from_branch, to_branch, status_value, item, weight):
        transfer = Transfer.objects.create(
            tenant=self.tenant,
            branch_name=from_branch,
            created_by=self.tenant,
            updated_by=self.tenant,
            from_branch=from_branch,
            to_branch=to_branch,
            status=status_value,
        )
        TransferLine.objects.create(
            transfer=transfer,
            item=item,
            qty=1,
            weight=Decimal(weight),
        )
        return transfer

    def test_register_report_applies_filters_and_returns_summary_totals(self):
        received_transfer = self._create_transfer(
            from_branch="Main",
            to_branch="Branch-2",
            status_value=TRANSFER_STATUS_RECEIVED,
            item=self.item_1,
            weight="5.5000",
        )
        in_transit_transfer = self._create_transfer(
            from_branch="Main",
            to_branch="Branch-3",
            status_value=TRANSFER_STATUS_IN_TRANSIT,
            item=self.item_1,
            weight="3.2500",
        )
        old_transfer = self._create_transfer(
            from_branch="Branch-X",
            to_branch="Main",
            status_value=TRANSFER_STATUS_APPROVED,
            item=self.item_1,
            weight="2.0000",
        )

        old_date = timezone.now() - timedelta(days=10)
        Transfer.objects.filter(id=old_transfer.id).update(created_at=old_date)

        from_date = (timezone.now() - timedelta(days=2)).date().isoformat()
        to_date = timezone.now().date().isoformat()
        resp = self.client.get(
            self.url,
            {
                "from_date": from_date,
                "to_date": to_date,
                "from_branch": "Main",
            },
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["count"], 2)
        self.assertEqual(resp.data["summary"]["received_count"], 1)
        self.assertEqual(resp.data["summary"]["in_transit_count"], 1)
        self.assertEqual(Decimal(str(resp.data["summary"]["total_weight"])), Decimal("8.7500"))

        result_ids = {row["id"] for row in resp.data["results"]}
        self.assertIn(str(received_transfer.id), result_ids)
        self.assertIn(str(in_transit_transfer.id), result_ids)
        self.assertNotIn(str(old_transfer.id), result_ids)

    def test_register_report_rejects_invalid_date_filter(self):
        resp = self.client.get(self.url, {"from_date": "2026-13-45"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid from_date", str(resp.data.get("detail")))

    def test_register_report_rejects_invalid_to_date_filter(self):
        resp = self.client.get(self.url, {"to_date": "not-a-date"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid to_date", str(resp.data.get("detail")))

    def test_register_report_rejects_from_date_greater_than_to_date(self):
        resp = self.client.get(
            self.url,
            {"from_date": "2026-05-10", "to_date": "2026-05-01"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("from_date cannot be greater than to_date", str(resp.data.get("detail")))

    def test_register_report_rejects_date_range_over_92_days(self):
        resp = self.client.get(
            self.url,
            {"from_date": "2026-01-01", "to_date": "2026-04-10"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot exceed 92 days", str(resp.data.get("detail")))

    def test_register_report_rejects_invalid_status_filter(self):
        resp = self.client.get(self.url, {"status": "INVALID"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid status", str(resp.data.get("detail")))

    def test_register_report_status_all_does_not_filter(self):
        self._create_transfer(
            from_branch="Main",
            to_branch="Branch-2",
            status_value=TRANSFER_STATUS_REQUESTED,
            item=self.item_1,
            weight="1.0000",
        )
        self._create_transfer(
            from_branch="Main",
            to_branch="Branch-3",
            status_value=TRANSFER_STATUS_REJECTED,
            item=self.item_1,
            weight="2.0000",
        )
        resp = self.client.get(self.url, {"status": "ALL"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["count"], 2)
        self.assertEqual(len(resp.data["results"]), 2)

    def test_register_report_empty_status_does_not_filter(self):
        self._create_transfer(
            from_branch="Main",
            to_branch="Branch-2",
            status_value=TRANSFER_STATUS_APPROVED,
            item=self.item_1,
            weight="1.0000",
        )
        self._create_transfer(
            from_branch="Main",
            to_branch="Branch-3",
            status_value=TRANSFER_STATUS_RECEIVED,
            item=self.item_1,
            weight="2.0000",
        )
        resp = self.client.get(self.url, {"status": ""})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["count"], 2)

    def test_register_report_filters_by_specific_valid_status(self):
        approved = self._create_transfer(
            from_branch="Main",
            to_branch="Branch-2",
            status_value=TRANSFER_STATUS_APPROVED,
            item=self.item_1,
            weight="1.0000",
        )
        self._create_transfer(
            from_branch="Main",
            to_branch="Branch-3",
            status_value=TRANSFER_STATUS_RECEIVED,
            item=self.item_1,
            weight="2.0000",
        )
        resp = self.client.get(self.url, {"status": TRANSFER_STATUS_APPROVED})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["count"], 1)
        self.assertEqual(resp.data["results"][0]["id"], str(approved.id))

    def test_register_report_same_from_and_to_branch_returns_zero_summary(self):
        self._create_transfer(
            from_branch="Main",
            to_branch="Branch-2",
            status_value=TRANSFER_STATUS_IN_TRANSIT,
            item=self.item_1,
            weight="2.5000",
        )
        resp = self.client.get(
            self.url,
            {"from_branch": "Main", "to_branch": "Main"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 0)
        self.assertEqual(resp.data["summary"]["count"], 0)
        self.assertEqual(resp.data["summary"]["received_count"], 0)
        self.assertEqual(resp.data["summary"]["in_transit_count"], 0)
        self.assertEqual(Decimal(str(resp.data["summary"]["total_weight"])), Decimal("0.0000"))
        self.assertEqual(resp.data["results"], [])

    def test_register_report_is_tenant_scoped(self):
        own_transfer = self._create_transfer(
            from_branch="Main",
            to_branch="Branch-2",
            status_value=TRANSFER_STATUS_RECEIVED,
            item=self.item_1,
            weight="2.0000",
        )
        other_tenant = _make_tenant("9555500018", "Transfer Report Tenant B")
        other_item = _make_item(other_tenant, sku="TR-REP-OTHER", barcode="TR-REP-OTH-BAR", huid="TRRP02")
        other_transfer = Transfer.objects.create(
            tenant=other_tenant,
            branch_name="Main",
            created_by=other_tenant,
            updated_by=other_tenant,
            from_branch="Main",
            to_branch="Branch-9",
            status=TRANSFER_STATUS_RECEIVED,
        )
        TransferLine.objects.create(
            transfer=other_transfer,
            item=other_item,
            qty=1,
            weight=Decimal("7.0000"),
        )

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        result_ids = [row["id"] for row in resp.data["results"]]
        self.assertIn(str(own_transfer.id), result_ids)
        self.assertNotIn(str(other_transfer.id), result_ids)

    def test_register_report_pagination_no_duplicates_across_pages(self):
        created = [
            self._create_transfer(
                from_branch="Main",
                to_branch=f"Branch-{i}",
                status_value=TRANSFER_STATUS_APPROVED,
                item=self.item_1,
                weight="1.0000",
            )
            for i in (2, 3, 4)
        ]
        same_moment = timezone.now()
        Transfer.objects.filter(id__in=[tr.id for tr in created]).update(created_at=same_moment)

        page_1 = self.client.get(self.url, {"page_size": 1, "page": 1})
        page_2 = self.client.get(self.url, {"page_size": 1, "page": 2})
        page_3 = self.client.get(self.url, {"page_size": 1, "page": 3})
        self.assertEqual(page_1.status_code, status.HTTP_200_OK)
        self.assertEqual(page_2.status_code, status.HTTP_200_OK)
        self.assertEqual(page_3.status_code, status.HTTP_200_OK)

        ids = {
            page_1.data["results"][0]["id"],
            page_2.data["results"][0]["id"],
            page_3.data["results"][0]["id"],
        }
        self.assertEqual(page_1.data["count"], 3)
        self.assertEqual(len(ids), 3)

    def test_register_report_same_filter_snapshot_is_deterministic(self):
        created = [
            self._create_transfer(
                from_branch="Main",
                to_branch=f"Branch-{i}",
                status_value=TRANSFER_STATUS_APPROVED,
                item=self.item_1,
                weight="1.0000",
            )
            for i in (2, 3, 4)
        ]
        same_moment = timezone.now()
        Transfer.objects.filter(id__in=[tr.id for tr in created]).update(created_at=same_moment)

        resp_1 = self.client.get(self.url, {"page_size": 50})
        resp_2 = self.client.get(self.url, {"page_size": 50})
        self.assertEqual(resp_1.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_2.status_code, status.HTTP_200_OK)
        ids_1 = [row["id"] for row in resp_1.data["results"]]
        ids_2 = [row["id"] for row in resp_2.data["results"]]
        self.assertEqual(ids_1, ids_2)

    def test_register_report_export_denied_without_reports_export_permission(self):
        cashier = _make_tenant("9555500019", "Transfer Report Cashier", role_code=JwlRoleCode.CASHIER)
        self.client.force_authenticate(user=cashier)

        export_resp = self.client.get(self.url, {"export": "1"})
        self.assertEqual(export_resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("report export permission", str(export_resp.data.get("detail")))

        read_resp = self.client.get(self.url)
        self.assertEqual(read_resp.status_code, status.HTTP_200_OK)
