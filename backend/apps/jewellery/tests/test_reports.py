"""B-2.3 GST reports API contract tests."""

from datetime import date
from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.billing import Customer, SalesInvoice
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole

GSTR1_URL = "/api/jwl/v1/reports/gstr-1/"
GSTR3B_URL = "/api/jwl/v1/reports/gstr-3b/"


def _make_user(mobile, name, role_code=JwlRoleCode.ADMIN):
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


def _make_customer(tenant, name, gstin=""):
    return Customer.objects.create(
        tenant=tenant,
        branch_name="",
        created_by=tenant,
        updated_by=tenant,
        name=name,
        mobile=f"9{name[-8:]}",
        gstin=gstin,
    )


def _make_issued_invoice(
    tenant,
    customer,
    voucher_no,
    voucher_date,
    invoice_type=SalesInvoice._meta.get_field("invoice_type").default,
    taxable=Decimal("1000.00"),
    cgst=Decimal("15.00"),
    sgst=Decimal("15.00"),
    igst=Decimal("0.00"),
):
    return SalesInvoice.objects.create(
        tenant=tenant,
        branch_name="Main",
        created_by=tenant,
        updated_by=tenant,
        customer=customer,
        invoice_type=invoice_type,
        status="ISSUED",
        voucher_no=voucher_no,
        voucher_date=voucher_date,
        taxable_amount=taxable,
        cgst=cgst,
        sgst=sgst,
        igst=igst,
        total_amount=taxable + cgst + sgst + igst,
    )


class GstReportContractTests(APITestCase):
    def setUp(self):
        self.admin = _make_user("9777000001", "GST Admin", JwlRoleCode.ADMIN)
        self.client.force_authenticate(user=self.admin)
        self.b2b_customer = _make_customer(self.admin, "B2B Party", "27ABCDE1234F1Z5")
        self.b2c_customer = _make_customer(self.admin, "Retail Walkin", "")

    def test_gstr1_returns_expected_sections_and_net_summary(self):
        _make_issued_invoice(
            self.admin,
            self.b2b_customer,
            "INV-001",
            date(2026, 5, 10),
            invoice_type="TAX_INVOICE",
            taxable=Decimal("1000.00"),
            cgst=Decimal("15.00"),
            sgst=Decimal("15.00"),
        )
        _make_issued_invoice(
            self.admin,
            self.b2c_customer,
            "INV-002",
            date(2026, 5, 11),
            invoice_type="TAX_INVOICE",
            taxable=Decimal("800.00"),
            cgst=Decimal("12.00"),
            sgst=Decimal("12.00"),
        )
        _make_issued_invoice(
            self.admin,
            self.b2b_customer,
            "CN-001",
            date(2026, 5, 12),
            invoice_type="CREDIT_NOTE",
            taxable=Decimal("300.00"),
            cgst=Decimal("4.50"),
            sgst=Decimal("4.50"),
        )

        resp = self.client.get(GSTR1_URL, {"period": "202605"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["invoice_count"], 3)
        self.assertEqual(resp.data["summary"]["b2b_count"], 1)
        self.assertEqual(resp.data["summary"]["b2c_count"], 1)
        self.assertEqual(resp.data["summary"]["credit_note_count"], 1)
        self.assertEqual(Decimal(resp.data["summary"]["taxable_total"]), Decimal("1500.00"))
        self.assertEqual(Decimal(resp.data["summary"]["cgst_total"]), Decimal("22.50"))
        self.assertEqual(Decimal(resp.data["summary"]["sgst_total"]), Decimal("22.50"))
        self.assertEqual(resp.data["summary"]["igst_total"], "0.00")
        self.assertEqual(len(resp.data["b2b"]), 1)
        self.assertEqual(len(resp.data["b2c"]), 1)
        self.assertEqual(len(resp.data["cdnr"]), 1)

    def test_gstr3b_returns_net_tax_from_issued_sales_and_credit_notes(self):
        _make_issued_invoice(
            self.admin,
            self.b2b_customer,
            "INV-101",
            date(2026, 5, 10),
            invoice_type="TAX_INVOICE",
            taxable=Decimal("2000.00"),
            cgst=Decimal("30.00"),
            sgst=Decimal("30.00"),
        )
        _make_issued_invoice(
            self.admin,
            self.b2b_customer,
            "CN-101",
            date(2026, 5, 15),
            invoice_type="CREDIT_NOTE",
            taxable=Decimal("500.00"),
            cgst=Decimal("7.50"),
            sgst=Decimal("7.50"),
        )

        resp = self.client.get(GSTR3B_URL, {"period": "202605"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        outward = resp.data["outward_supplies"]
        self.assertEqual(Decimal(outward["taxable_value"]), Decimal("1500.00"))
        self.assertEqual(Decimal(outward["cgst"]), Decimal("22.50"))
        self.assertEqual(Decimal(outward["sgst"]), Decimal("22.50"))
        self.assertEqual(Decimal(outward["igst"]), Decimal("0.00"))
        self.assertEqual(resp.data["net_tax_payable"]["cess"], "0.00")

    def test_gst_reports_reject_invalid_period(self):
        resp = self.client.get(GSTR1_URL, {"period": "2026-05"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid period", str(resp.data.get("detail")))

        resp_month = self.client.get(GSTR3B_URL, {"period": "202613"})
        self.assertEqual(resp_month.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid period month", str(resp_month.data.get("detail")))

    def test_gstr1_export_requires_reports_export_permission(self):
        cashier = _make_user("9777000002", "GST Cashier", JwlRoleCode.CASHIER)
        self.client.force_authenticate(user=cashier)

        denied = self.client.get(GSTR1_URL, {"period": "202605", "file_format": "excel"})
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("report export permission", str(denied.data.get("detail")))

        allowed_json = self.client.get(GSTR1_URL, {"period": "202605"})
        self.assertEqual(allowed_json.status_code, status.HTTP_200_OK)

    def test_gstr1_is_tenant_scoped_and_period_scoped(self):
        _make_issued_invoice(
            self.admin,
            self.b2b_customer,
            "INV-THIS-MONTH",
            date(2026, 5, 5),
            invoice_type="TAX_INVOICE",
            taxable=Decimal("1000.00"),
        )
        _make_issued_invoice(
            self.admin,
            self.b2b_customer,
            "INV-OLD-MONTH",
            date(2026, 4, 30),
            invoice_type="TAX_INVOICE",
            taxable=Decimal("1000.00"),
        )

        other_tenant = _make_user("9777000003", "Other GST Tenant", JwlRoleCode.ADMIN)
        other_customer = _make_customer(other_tenant, "Other B2B", "29ABCDE1234F1Z5")
        _make_issued_invoice(
            other_tenant,
            other_customer,
            "INV-OTHER",
            date(2026, 5, 7),
            invoice_type="TAX_INVOICE",
            taxable=Decimal("5000.00"),
        )

        resp = self.client.get(GSTR1_URL, {"period": "202605"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["invoice_count"], 1)
        self.assertEqual(resp.data["b2b"][0]["voucher_no"], "INV-THIS-MONTH")
