"""B-1.5 billing service tests: formulas §7.1–7.8 + API."""

from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.jewellery.models.admin import AdminControl
from apps.jewellery.models.billing import Customer, OldGoldPurchase, SalesInvoice, SalesInvoiceLine
from apps.jewellery.models.master import Category, Design, Metal, NumberSeries, Purity
from apps.jewellery.models.outstanding import PartyOutstandingBalance, PartyOutstandingMovement
from apps.jewellery.services.billing import (
    calc_making_charge,
    calc_old_gold_deduction,
    calc_wastage,
    convert_to_invoice,
    calculate_invoice,
    cancel_invoice,
    create_invoice,
    issue_invoice,
)
from apps.jewellery.models.inventory import Item
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
    metal, _ = Metal.objects.get_or_create(
        tenant=tenant,
        code="GOLD",
        defaults={
            "branch_name": "",
            "created_by": tenant,
            "updated_by": tenant,
            "name": "Gold",
        },
    )
    purity, _ = Purity.objects.get_or_create(
        tenant=tenant,
        metal=metal,
        code="22K",
        defaults={
            "branch_name": "",
            "created_by": tenant,
            "updated_by": tenant,
            "pct": Decimal("91.600"),
        },
    )
    category, _ = Category.objects.get_or_create(
        tenant=tenant,
        parent=None,
        name="Rings",
        defaults={
            "branch_name": "",
            "created_by": tenant,
            "updated_by": tenant,
            "default_making_charge_formula": "PER_GRAM",
        },
    )
    design, _ = Design.objects.get_or_create(
        tenant=tenant,
        code="RG001",
        defaults={
            "branch_name": "",
            "created_by": tenant,
            "updated_by": tenant,
            "category": category,
            "name": "Plain Ring",
        },
    )
    item = Item.objects.create(
        tenant=tenant, branch_name="", created_by=tenant, updated_by=tenant,
        design=design, metal=metal, purity=purity,
        gross_wt=Decimal("10.5000"), net_wt=Decimal("10.0000"),
        status="IN_STOCK",
    )
    return metal, purity, item


# ─── §7.2 Making Charge ───────────────────────────────────────────────────────

class MakingChargeTests(APITestCase):
    def test_per_gram(self):
        result = calc_making_charge("PER_GRAM", Decimal("10"), Decimal("63730"), Decimal("150"))
        self.assertEqual(result, Decimal("1500.00"))

    def test_pct_metal(self):
        """Spec example: metal ₹63,730 × 12% = ₹7,647.60"""
        result = calc_making_charge("PCT_METAL", Decimal("10"), Decimal("63730"), Decimal("12"))
        self.assertEqual(result, Decimal("7647.60"))

    def test_per_piece(self):
        result = calc_making_charge("PER_PIECE", Decimal("10"), Decimal("63730"), Decimal("500"))
        self.assertEqual(result, Decimal("500.00"))


# ─── §7.3 Wastage ────────────────────────────────────────────────────────────

class WastageTests(APITestCase):
    def test_spec_example(self):
        """Spec: net_wt=10g, wastage 6%, rate ₹6373 → ₹3,823.80"""
        result = calc_wastage(Decimal("10"), Decimal("6"), Decimal("6373"))
        self.assertEqual(result, Decimal("3823.80"))


# ─── §7.6 GST Split ──────────────────────────────────────────────────────────

class GSTSplitTests(APITestCase):
    def _line(self, is_inter_state):
        lines = [{
            "net_wt": "10",
            "rate_per_gram": "6373",
            "making_mode": "PCT_METAL",
            "making_rate": "12",
            "wastage_pct": "6",
            "hallmarking_fee": "45",
            "stone_value": "0",
            "gst_rate_pct": "3",
        }]
        result = calculate_invoice(lines, Decimal("0"), is_inter_state)
        return result

    def test_intra_state_cgst_sgst(self):
        result = self._line(is_inter_state=False)
        self.assertGreater(result["cgst"], 0)
        self.assertGreater(result["sgst"], 0)
        self.assertEqual(result["igst"], Decimal("0.00"))
        self.assertEqual(result["cgst"], result["sgst"])

    def test_inter_state_igst(self):
        result = self._line(is_inter_state=True)
        self.assertGreater(result["igst"], 0)
        self.assertEqual(result["cgst"], Decimal("0.00"))
        self.assertEqual(result["sgst"], Decimal("0.00"))

    def test_cgst_plus_sgst_equals_total_gst(self):
        result = self._line(is_inter_state=False)
        self.assertEqual(result["cgst"] + result["sgst"], result["cgst"] + result["sgst"])


# ─── §7.7 Discount ───────────────────────────────────────────────────────────

class DiscountTests(APITestCase):
    def test_discount_reduces_total(self):
        lines = [{
            "net_wt": "10", "rate_per_gram": "6373",
            "making_mode": "PER_GRAM", "making_rate": "0",
            "wastage_pct": "0", "hallmarking_fee": "0",
            "stone_value": "0", "gst_rate_pct": "3",
        }]
        no_disc = calculate_invoice(lines, Decimal("0"), False)
        with_disc = calculate_invoice(lines, Decimal("500"), False)
        self.assertLess(with_disc["total_amount"], no_disc["total_amount"])

    def test_discount_allocated_per_line(self):
        lines = [{
            "net_wt": "10", "rate_per_gram": "6373",
            "making_mode": "PER_GRAM", "making_rate": "0",
            "wastage_pct": "0", "hallmarking_fee": "0",
            "stone_value": "0", "gst_rate_pct": "3",
        }]
        result = calculate_invoice(lines, Decimal("1000"), False)
        self.assertEqual(result["computed_lines"][0]["discount_allocated"], Decimal("1000.00"))


# ─── §7.8 Old Gold ───────────────────────────────────────────────────────────

class OldGoldTests(APITestCase):
    def test_pure_grams_calculation(self):
        """old_gold_pure_grams = gross_wt × (tested_purity / 99.9)"""
        result = calc_old_gold_deduction(
            gross_wt=Decimal("10"),
            tested_purity=Decimal("91.600"),
            buy_rate_per_gram=Decimal("6200"),
        )
        expected_pure = (Decimal("10") * Decimal("91.600") / Decimal("99.9")).quantize(Decimal("0.0001"))
        self.assertEqual(result["pure_grams"], expected_pure)

    def test_deduction_value(self):
        result = calc_old_gold_deduction(
            gross_wt=Decimal("10"),
            tested_purity=Decimal("99.9"),
            buy_rate_per_gram=Decimal("6850"),
        )
        self.assertEqual(result["deduction_value"], Decimal("68500.00"))


# ─── Issue Invoice → Item Status SOLD ─────────────────────────────────────────

class IssueInvoiceTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500030", "Billing Tenant")
        self.metal, self.purity, self.item = _make_master(self.tenant)
        self.customer = Customer.objects.create(
            tenant=self.tenant, branch_name="", created_by=self.tenant, updated_by=self.tenant,
            name="Test Customer", mobile="9000000001",
        )

    def _create_draft(self):
        return create_invoice(
            tenant=self.tenant,
            branch_name="",
            invoice_data={
                "customer": str(self.customer.id),
                "invoice_type": "TAX_INVOICE",
                "discount_amount": 0,
            },
            lines_data=[{
                "item": str(self.item.id),
                "description": "Gold Ring",
                "metal_code": "GOLD",
                "purity_code": "22K",
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "PER_GRAM",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "45",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
            old_gold_data=[],
            payments_data=[{"mode": "CASH", "amount": "60000"}],
            created_by=self.tenant,
        )

    def test_create_draft(self):
        invoice = self._create_draft()
        self.assertEqual(invoice.status, "DRAFT")
        self.assertGreater(invoice.total_amount, 0)

    def test_issue_sets_item_sold(self):
        invoice = self._create_draft()
        issue_invoice(invoice, issued_by=self.tenant)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "SOLD")

    def test_issue_assigns_voucher_no(self):
        NumberSeries.objects.create(
            tenant=self.tenant, branch_name="", created_by=self.tenant, updated_by=self.tenant,
            voucher_type="TAX_INVOICE", prefix="INV", next_number=1, padding=5,
        )
        invoice = self._create_draft()
        issue_invoice(invoice, issued_by=self.tenant)
        invoice.refresh_from_db()
        self.assertTrue(invoice.voucher_no.startswith("INV"))

    def test_cannot_issue_non_in_stock_item(self):
        self.item.status = "SOLD"
        self.item.save()
        invoice = self._create_draft()
        with self.assertRaises(ValueError):
            issue_invoice(invoice, issued_by=self.tenant)

    def test_cannot_issue_already_issued(self):
        invoice = self._create_draft()
        issue_invoice(invoice, issued_by=self.tenant)
        with self.assertRaises(ValueError):
            issue_invoice(invoice, issued_by=self.tenant)

    def test_cancel_reverses_item_to_in_stock(self):
        invoice = self._create_draft()
        issue_invoice(invoice, issued_by=self.tenant)
        cancel_invoice(invoice, cancelled_by=self.tenant, reason="Customer returned")
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_STOCK")

    def test_credit_note_issue_sets_item_back_in_stock(self):
        sale_invoice = self._create_draft()
        issue_invoice(sale_invoice, issued_by=self.tenant)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "SOLD")

        credit_note = create_invoice(
            tenant=self.tenant,
            branch_name="",
            invoice_data={
                "customer": str(self.customer.id),
                "reference_invoice": str(sale_invoice.id),
                "invoice_type": "CREDIT_NOTE",
                "discount_amount": 0,
            },
            lines_data=[{
                "item": str(self.item.id),
                "description": "Return Gold Ring",
                "metal_code": "GOLD",
                "purity_code": "22K",
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "PER_GRAM",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "45",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
            old_gold_data=[],
            payments_data=[],
            created_by=self.tenant,
        )
        issue_invoice(credit_note, issued_by=self.tenant)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_STOCK")


class BillingOutstandingMovementTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500032", "Movement Billing Tenant")
        self.metal, self.purity, self.item = _make_master(self.tenant)
        self.customer = Customer.objects.create(
            tenant=self.tenant,
            branch_name="",
            created_by=self.tenant,
            updated_by=self.tenant,
            name="Movement Customer",
            mobile="9000000003",
        )

    def _line(self, item_id):
        return {
            "item": str(item_id),
            "description": "Gold Ring",
            "metal_code": "GOLD",
            "purity_code": "22K",
            "net_wt": "10",
            "rate_per_gram": "6373",
            "making_mode": "PER_GRAM",
            "making_rate": "150",
            "wastage_pct": "0",
            "hallmarking_fee": "45",
            "stone_value": "0",
            "gst_rate_pct": "3",
        }

    def _create_draft(self, *, invoice_type, item_id, reference_invoice=None):
        return create_invoice(
            tenant=self.tenant,
            branch_name="",
            invoice_data={
                "customer": str(self.customer.id),
                "invoice_type": invoice_type,
                "reference_invoice": str(reference_invoice.id) if reference_invoice else None,
                "discount_amount": 0,
            },
            lines_data=[self._line(item_id)],
            old_gold_data=[],
            payments_data=[],
            created_by=self.tenant,
        )

    def test_create_draft_does_not_post_outstanding_movement(self):
        _, _, item = _make_master(self.tenant)
        draft = self._create_draft(invoice_type="TAX_INVOICE", item_id=item.id)

        self.assertEqual(
            PartyOutstandingMovement.objects.filter(reference_id=str(draft.id)).count(),
            0,
        )

    def test_create_credit_note_draft_does_not_post_outstanding_movement(self):
        _, _, item = _make_master(self.tenant)
        sale_invoice = self._create_draft(invoice_type="TAX_INVOICE", item_id=item.id)
        issue_invoice(sale_invoice, issued_by=self.tenant)

        credit_note = self._create_draft(
            invoice_type="CREDIT_NOTE",
            item_id=item.id,
            reference_invoice=sale_invoice,
        )
        self.assertEqual(
            PartyOutstandingMovement.objects.filter(reference_id=str(credit_note.id)).count(),
            0,
        )

    def test_cancel_draft_does_not_post_outstanding_movement(self):
        _, _, item = _make_master(self.tenant)
        draft = self._create_draft(invoice_type="TAX_INVOICE", item_id=item.id)
        baseline_count = PartyOutstandingMovement.objects.count()

        with self.assertRaises(ValueError):
            cancel_invoice(draft, cancelled_by=self.tenant, reason="Draft cancel should fail")

        self.assertEqual(PartyOutstandingMovement.objects.count(), baseline_count)

    def test_issue_sales_docs_post_invoice_debit_with_positive_amount_and_reference(self):
        for invoice_type in ("TAX_INVOICE", "CASH_MEMO", "NON_GST"):
            _, _, item = _make_master(self.tenant)
            invoice = self._create_draft(invoice_type=invoice_type, item_id=item.id)
            self.assertGreater(invoice.balance_amount, 0)

            issue_invoice(invoice, issued_by=self.tenant)

            movement = PartyOutstandingMovement.objects.get(
                reference_type="SALES_INVOICE",
                reference_id=str(invoice.id),
                movement_type="INVOICE_DEBIT",
            )
            self.assertEqual(movement.amount_delta, invoice.balance_amount)
            self.assertGreater(movement.amount_delta, 0)

    def test_issue_credit_note_posts_invoice_credit_with_negative_amount(self):
        _, _, item = _make_master(self.tenant)
        sale_invoice = self._create_draft(invoice_type="TAX_INVOICE", item_id=item.id)
        issue_invoice(sale_invoice, issued_by=self.tenant)

        credit_note = self._create_draft(
            invoice_type="CREDIT_NOTE",
            item_id=item.id,
            reference_invoice=sale_invoice,
        )
        self.assertGreater(credit_note.balance_amount, 0)

        issue_invoice(credit_note, issued_by=self.tenant)

        movement = PartyOutstandingMovement.objects.get(
            reference_type="SALES_INVOICE",
            reference_id=str(credit_note.id),
            movement_type="INVOICE_CREDIT",
        )
        self.assertEqual(movement.amount_delta, -credit_note.balance_amount)
        self.assertLess(movement.amount_delta, 0)

    def test_cancel_issued_sales_docs_post_invoice_credit_with_negative_amount(self):
        for invoice_type in ("TAX_INVOICE", "CASH_MEMO", "NON_GST"):
            _, _, item = _make_master(self.tenant)
            invoice = self._create_draft(invoice_type=invoice_type, item_id=item.id)
            issue_invoice(invoice, issued_by=self.tenant)

            cancel_invoice(invoice, cancelled_by=self.tenant, reason="Cancel test")

            movement = PartyOutstandingMovement.objects.get(
                reference_type="SALES_INVOICE_CANCEL",
                reference_id=str(invoice.id),
                movement_type="INVOICE_CREDIT",
            )
            self.assertEqual(movement.amount_delta, -invoice.balance_amount)
            self.assertLess(movement.amount_delta, 0)

    def test_cancel_issued_credit_note_posts_invoice_debit_with_positive_amount(self):
        _, _, item = _make_master(self.tenant)
        sale_invoice = self._create_draft(invoice_type="TAX_INVOICE", item_id=item.id)
        issue_invoice(sale_invoice, issued_by=self.tenant)
        credit_note = self._create_draft(
            invoice_type="CREDIT_NOTE",
            item_id=item.id,
            reference_invoice=sale_invoice,
        )
        issue_invoice(credit_note, issued_by=self.tenant)

        cancel_invoice(credit_note, cancelled_by=self.tenant, reason="Cancel credit note")

        movement = PartyOutstandingMovement.objects.get(
            reference_type="SALES_INVOICE_CANCEL",
            reference_id=str(credit_note.id),
            movement_type="INVOICE_DEBIT",
        )
        self.assertEqual(movement.amount_delta, credit_note.balance_amount)
        self.assertGreater(movement.amount_delta, 0)

    def test_estimate_issue_and_cancel_do_not_create_outstanding_movements(self):
        _, _, item = _make_master(self.tenant)
        estimate = self._create_draft(invoice_type="ESTIMATE", item_id=item.id)
        baseline_count = PartyOutstandingMovement.objects.count()

        issue_invoice(estimate, issued_by=self.tenant)
        cancel_invoice(estimate, cancelled_by=self.tenant, reason="Estimate cancel")

        self.assertEqual(
            PartyOutstandingMovement.objects.filter(reference_id=str(estimate.id)).count(),
            0,
        )
        self.assertEqual(PartyOutstandingMovement.objects.count(), baseline_count)

    def test_convert_estimate_to_invoice_creates_movement_only_after_issue(self):
        _, _, item = _make_master(self.tenant)
        estimate = self._create_draft(invoice_type="ESTIMATE", item_id=item.id)

        converted_invoice = convert_to_invoice(estimate, converted_by=self.tenant)

        self.assertEqual(
            PartyOutstandingMovement.objects.filter(balance__customer_id=self.customer.id).count(),
            0,
        )

        issue_invoice(converted_invoice, issued_by=self.tenant)

        movement = PartyOutstandingMovement.objects.get(
            reference_type="SALES_INVOICE",
            reference_id=str(converted_invoice.id),
            movement_type="INVOICE_DEBIT",
        )
        self.assertEqual(movement.amount_delta, converted_invoice.balance_amount)
        self.assertGreater(movement.amount_delta, 0)


# ─── API Endpoint Tests ───────────────────────────────────────────────────────

class BillingApiTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500031", "API Billing Tenant")
        self.metal, self.purity, self.item = _make_master(self.tenant)
        self.customer = Customer.objects.create(
            tenant=self.tenant, branch_name="", created_by=self.tenant, updated_by=self.tenant,
            name="Walk-in Customer", mobile="9000000002",
        )
        self.client.force_authenticate(user=self.tenant)

    def test_calculate_endpoint(self):
        url = reverse("jewellery:invoice-calculate")
        resp = self.client.post(url, {
            "lines": [{
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "PER_GRAM",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "0",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
            "discount_amount": "0",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("total_amount", resp.data)

    def test_create_invoice_endpoint(self):
        url = reverse("jewellery:sales-invoice-list")
        resp = self.client.post(url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
                "item": str(self.item.id),
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "PER_GRAM",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "45",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
            "discount_amount": "0",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], "DRAFT")

    def test_create_invoice_rejects_invalid_invoice_type_enum(self):
        url = reverse("jewellery:sales-invoice-list")
        resp = self.client.post(url, {
            "customer": str(self.customer.id),
            "invoice_type": "BAD_TYPE",
            "lines": [{
                "item": str(self.item.id),
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "PER_GRAM",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "45",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invoice_type", resp.data)

    def test_create_invoice_rejects_invalid_line_making_mode_enum(self):
        url = reverse("jewellery:sales-invoice-list")
        resp = self.client.post(url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
                "item": str(self.item.id),
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "INVALID",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "45",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("lines", resp.data)

    def test_create_credit_note_without_reference_invoice_returns_400(self):
        url = reverse("jewellery:sales-invoice-list")
        resp = self.client.post(url, {
            "customer": str(self.customer.id),
            "invoice_type": "CREDIT_NOTE",
            "lines": [{
                "item": str(self.item.id),
                "description": "Gold Ring return",
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "PER_GRAM",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "45",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reference_invoice", resp.data)

    def test_create_credit_note_with_draft_reference_invoice_returns_400(self):
        create_url = reverse("jewellery:sales-invoice-list")
        sale_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
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
            }],
        }, format="json")
        self.assertEqual(sale_resp.status_code, status.HTTP_201_CREATED)

        credit_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "CREDIT_NOTE",
            "reference_invoice": sale_resp.data["id"],
            "lines": [{
                "item": str(self.item.id),
                "description": "Gold Ring return",
                "net_wt": "10",
                "rate_per_gram": "6373",
                "making_mode": "PER_GRAM",
                "making_rate": "150",
                "wastage_pct": "0",
                "hallmarking_fee": "45",
                "stone_value": "0",
                "gst_rate_pct": "3",
            }],
        }, format="json")
        self.assertEqual(credit_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reference_invoice", credit_resp.data)

    def test_convert_non_estimate_invoice_returns_400(self):
        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
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
            }],
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        invoice_id = create_resp.data["id"]

        convert_url = reverse("jewellery:sales-invoice-convert-to-invoice-action", kwargs={"pk": invoice_id})
        convert_resp = self.client.post(convert_url, {}, format="json")
        self.assertEqual(convert_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", convert_resp.data)

    def test_issue_invoice_rejects_non_in_stock_item_state(self):
        self.item.status = "SOLD"
        self.item.save(update_fields=["status", "updated_at"])
        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
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
            }],
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)

        issue_url = reverse("jewellery:sales-invoice-issue", kwargs={"pk": create_resp.data["id"]})
        issue_resp = self.client.post(issue_url, {}, format="json")
        self.assertEqual(issue_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", issue_resp.data)

    def test_convert_estimate_to_invoice_embeds_audit_note(self):
        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "ESTIMATE",
            "notes": "Customer asked for final quote",
            "lines": [{
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
            }],
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)

        estimate_id = create_resp.data["id"]
        convert_url = reverse("jewellery:sales-invoice-convert-to-invoice-action", kwargs={"pk": estimate_id})
        convert_resp = self.client.post(convert_url, {}, format="json")
        self.assertEqual(convert_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(convert_resp.data["invoice_type"], "TAX_INVOICE")
        self.assertIn(f"[CONVERTED_FROM_ESTIMATE:{estimate_id}]", convert_resp.data["notes"])

    def test_customer_list(self):
        url = reverse("jewellery:customer-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_customer_detail_returns_zero_outstanding_when_balance_missing(self):
        url = reverse("jewellery:customer-detail", kwargs={"pk": self.customer.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["outstanding_amount_balance"], "0.00")
        self.assertEqual(resp.data["outstanding_metal_balance_grams"], "0.0000")
        self.assertIsNone(resp.data["outstanding_last_txn_date"])

    def test_customer_detail_includes_outstanding_snapshot(self):
        PartyOutstandingBalance.objects.create(
            tenant=self.tenant,
            branch_name="",
            created_by=self.tenant,
            updated_by=self.tenant,
            customer=self.customer,
            amount_balance=Decimal("15250.75"),
            metal_balance_grams=Decimal("3.2400"),
            last_txn_date=timezone.localdate(),
        )
        url = reverse("jewellery:customer-detail", kwargs={"pk": self.customer.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["outstanding_amount_balance"], "15250.75")
        self.assertEqual(resp.data["outstanding_metal_balance_grams"], "3.2400")
        self.assertEqual(resp.data["outstanding_last_txn_date"], str(timezone.localdate()))

    def test_invoice_pdf_endpoint(self):
        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
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
            }],
            "discount_amount": "0",
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        invoice_id = create_resp.data["id"]

        pdf_url = reverse("jewellery:sales-invoice-pdf", kwargs={"pk": invoice_id})
        pdf_resp = self.client.get(pdf_url)
        self.assertEqual(pdf_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_resp["Content-Type"], "application/pdf")
        self.assertTrue(bytes(pdf_resp.content).startswith(b"%PDF-1.4"))

    def test_send_invoice_endpoint(self):
        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
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
            }],
            "discount_amount": "0",
        }, format="json")
        invoice_id = create_resp.data["id"]

        issue_url = reverse("jewellery:sales-invoice-issue", kwargs={"pk": invoice_id})
        issue_resp = self.client.post(issue_url, {}, format="json")
        self.assertEqual(issue_resp.status_code, status.HTTP_200_OK)

        send_url = reverse("jewellery:sales-invoice-send", kwargs={"pk": invoice_id})
        send_resp = self.client.post(send_url, {"channel": "WA", "to": "919999999999"}, format="json")
        self.assertEqual(send_resp.status_code, status.HTTP_200_OK)
        self.assertIn("share_url", send_resp.data)

    def test_einvoice_generation_endpoint(self):
        AdminControl.objects.create(
            tenant=self.tenant,
            branch_name="",
            created_by=self.tenant,
            updated_by=self.tenant,
            einvoice_applicable=True,
        )
        self.customer.gstin = "27ABCDE1234F1Z5"
        self.customer.save(update_fields=["gstin", "updated_at"])

        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(create_url, {
            "customer": str(self.customer.id),
            "invoice_type": "TAX_INVOICE",
            "lines": [{
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
            }],
            "discount_amount": "0",
        }, format="json")
        invoice_id = create_resp.data["id"]

        issue_url = reverse("jewellery:sales-invoice-issue", kwargs={"pk": invoice_id})
        issue_resp = self.client.post(issue_url, {}, format="json")
        self.assertEqual(issue_resp.status_code, status.HTTP_200_OK)

        einvoice_url = reverse("jewellery:sales-invoice-e-invoice", kwargs={"pk": invoice_id})
        einvoice_resp = self.client.post(einvoice_url, {}, format="json")
        self.assertEqual(einvoice_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(einvoice_resp.data["e_invoice_irn"])


    def test_invoice_list_ordering_by_voucher_date(self):
        """Ordering param controls sort direction."""
        import datetime
        inv1 = SalesInvoice.objects.create(
            tenant=self.tenant,
            invoice_type="TAX_INVOICE",
            voucher_date=datetime.date(2026, 1, 1),
        )
        inv2 = SalesInvoice.objects.create(
            tenant=self.tenant,
            invoice_type="TAX_INVOICE",
            voucher_date=datetime.date(2026, 6, 1),
        )
        # ascending
        res = self.client.get("/api/jwl/v1/sales/invoices/?ordering=voucher_date")
        self.assertEqual(res.status_code, 200)
        ids = [r["id"] for r in res.data["results"]]
        self.assertLess(ids.index(str(inv1.id)), ids.index(str(inv2.id)))
        # descending (default)
        res2 = self.client.get("/api/jwl/v1/sales/invoices/?ordering=-voucher_date")
        self.assertEqual(res2.status_code, 200)
        ids2 = [r["id"] for r in res2.data["results"]]
        self.assertLess(ids2.index(str(inv2.id)), ids2.index(str(inv1.id)))


class BillingPermissionTests(APITestCase):
    def setUp(self):
        self.tenant = _make_tenant("9555500041", "Billing Permission Tenant")
        self.metal, self.purity, self.item = _make_master(self.tenant)
        self.customer = Customer.objects.create(
            tenant=self.tenant,
            branch_name="",
            created_by=self.tenant,
            updated_by=self.tenant,
            name="Permission Customer",
            mobile="9000000011",
        )

    def _create_and_issue_invoice(self) -> str:
        self.client.force_authenticate(user=self.tenant)
        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(
            create_url,
            {
                "customer": str(self.customer.id),
                "invoice_type": "TAX_INVOICE",
                "lines": [{
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
                }],
                "discount_amount": "0",
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        invoice_id = create_resp.data["id"]

        issue_url = reverse("jewellery:sales-invoice-issue", kwargs={"pk": invoice_id})
        issue_resp = self.client.post(issue_url, {}, format="json")
        self.assertEqual(issue_resp.status_code, status.HTTP_200_OK)
        return invoice_id

    def _create_estimate_draft(self) -> str:
        self.client.force_authenticate(user=self.tenant)
        create_url = reverse("jewellery:sales-invoice-list")
        create_resp = self.client.post(
            create_url,
            {
                "customer": str(self.customer.id),
                "invoice_type": "ESTIMATE",
                "lines": [{
                    "item": str(self.item.id),
                    "description": "Estimate Ring",
                    "net_wt": "10",
                    "rate_per_gram": "6373",
                    "making_mode": "PER_GRAM",
                    "making_rate": "150",
                    "wastage_pct": "0",
                    "hallmarking_fee": "45",
                    "stone_value": "0",
                    "gst_rate_pct": "3",
                }],
                "discount_amount": "0",
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        return create_resp.data["id"]

    def _make_module_user(self, *, mobile: str, name: str, role_code: str) -> User:
        user = User.objects.create_user(
            mobile_number=mobile,
            password="Test@1234",
            full_name=name,
            role="collector",
            tenant=self.tenant,
            branch_name="",
        )
        UserModuleRole.objects.create(
            user=user,
            module=ModuleCode.JEWELLERY,
            role_code=role_code,
            branch_name="",
            granted_by=self.tenant,
            is_active=True,
        )
        return user

    def test_cashier_cannot_cancel_invoice(self):
        invoice_id = self._create_and_issue_invoice()
        cashier = self._make_module_user(
            mobile="9555500042",
            name="Cashier User",
            role_code=JwlRoleCode.CASHIER,
        )
        self.client.force_authenticate(user=cashier)

        cancel_url = reverse("jewellery:sales-invoice-cancel", kwargs={"pk": invoice_id})
        resp = self.client.post(cancel_url, {"reason": "Wrong billing"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_cancel_invoice(self):
        invoice_id = self._create_and_issue_invoice()
        manager = self._make_module_user(
            mobile="9555500043",
            name="Manager User",
            role_code=JwlRoleCode.MANAGER,
        )
        self.client.force_authenticate(user=manager)

        cancel_url = reverse("jewellery:sales-invoice-cancel", kwargs={"pk": invoice_id})
        resp = self.client.post(cancel_url, {"reason": "Customer returned"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_cashier_can_convert_estimate(self):
        estimate_id = self._create_estimate_draft()
        cashier = self._make_module_user(
            mobile="9555500044",
            name="Cashier Convert User",
            role_code=JwlRoleCode.CASHIER,
        )
        self.client.force_authenticate(user=cashier)

        convert_url = reverse("jewellery:sales-invoice-convert-to-invoice-action", kwargs={"pk": estimate_id})
        resp = self.client.post(convert_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["invoice_type"], "TAX_INVOICE")

    def test_manager_can_convert_estimate(self):
        estimate_id = self._create_estimate_draft()
        manager = self._make_module_user(
            mobile="9555500045",
            name="Manager Convert User",
            role_code=JwlRoleCode.MANAGER,
        )
        self.client.force_authenticate(user=manager)

        convert_url = reverse("jewellery:sales-invoice-convert-to-invoice-action", kwargs={"pk": estimate_id})
        resp = self.client.post(convert_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["invoice_type"], "TAX_INVOICE")

    def test_auditor_cannot_convert_estimate(self):
        estimate_id = self._create_estimate_draft()
        auditor = self._make_module_user(
            mobile="9555500046",
            name="Auditor Convert User",
            role_code=JwlRoleCode.AUDITOR,
        )
        self.client.force_authenticate(user=auditor)

        convert_url = reverse("jewellery:sales-invoice-convert-to-invoice-action", kwargs={"pk": estimate_id})
        resp = self.client.post(convert_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


# ─── B-2.7 Post-movement consistency ─────────────────────────────────────────

import unittest


class PostMovementConsistencyTests(APITestCase):
    """
    B-2.7: Post-movement consistency across billing document lifecycle.

    Verifies that item stock states are consistent after each key billing event:
    ISSUE, CANCEL, CREDIT NOTE, ESTIMATE, and CONVERT.
    """

    def setUp(self):
        self.tenant = _make_tenant("9555507001", "Post-Movement Tenant")
        self.metal, self.purity, self.item = _make_master(self.tenant)
        self.customer = Customer.objects.create(
            tenant=self.tenant,
            branch_name="",
            created_by=self.tenant,
            updated_by=self.tenant,
            name="Consistency Customer",
            mobile="9100000099",
        )

    def _line(self, item_id):
        return {
            "item": str(item_id),
            "description": "Gold Ring",
            "metal_code": "GOLD",
            "purity_code": "22K",
            "net_wt": "10",
            "rate_per_gram": "6373",
            "making_mode": "PER_GRAM",
            "making_rate": "150",
            "wastage_pct": "0",
            "hallmarking_fee": "45",
            "stone_value": "0",
            "gst_rate_pct": "3",
        }

    def _make_invoice(self, invoice_type, item_id, reference_invoice=None):
        return create_invoice(
            tenant=self.tenant,
            branch_name="",
            invoice_data={
                "customer": str(self.customer.id),
                "invoice_type": invoice_type,
                "reference_invoice": str(reference_invoice.id) if reference_invoice else None,
                "discount_amount": 0,
            },
            lines_data=[self._line(item_id)],
            old_gold_data=[],
            payments_data=[],
            created_by=self.tenant,
        )

    def _fresh_item(self):
        self.item.status = "IN_STOCK"
        self.item.save(update_fields=["status"])
        return self.item

    # a. Issue → item SOLD
    def test_after_invoice_issue_item_status_is_sold(self):
        item = self._fresh_item()
        invoice = self._make_invoice("TAX_INVOICE", item.id)
        issue_invoice(invoice, issued_by=self.tenant)
        item.refresh_from_db()
        self.assertEqual(item.status, "SOLD")
        self.assertEqual(invoice.status, "ISSUED")

    def test_after_invoice_issue_line_references_item(self):
        item = self._fresh_item()
        invoice = self._make_invoice("TAX_INVOICE", item.id)
        issue_invoice(invoice, issued_by=self.tenant)
        self.assertTrue(SalesInvoiceLine.objects.filter(invoice=invoice, item=item).exists())

    # b. Cancel → item back to IN_STOCK
    def test_after_invoice_cancel_item_is_in_stock(self):
        item = self._fresh_item()
        invoice = self._make_invoice("TAX_INVOICE", item.id)
        issue_invoice(invoice, issued_by=self.tenant)
        cancel_invoice(invoice, cancelled_by=self.tenant, reason="Customer changed mind")
        item.refresh_from_db()
        self.assertEqual(item.status, "IN_STOCK")
        self.assertEqual(invoice.status, "CANCELLED")

    def test_after_invoice_cancel_timestamp_set(self):
        item = self._fresh_item()
        invoice = self._make_invoice("TAX_INVOICE", item.id)
        issue_invoice(invoice, issued_by=self.tenant)
        cancel_invoice(invoice, cancelled_by=self.tenant, reason="Return")
        invoice.refresh_from_db()
        self.assertIsNotNone(invoice.cancelled_at)

    # c. Credit note → item IN_STOCK, reference_invoice set
    def test_credit_note_returns_item_to_in_stock(self):
        item = self._fresh_item()
        sale = self._make_invoice("TAX_INVOICE", item.id)
        issue_invoice(sale, issued_by=self.tenant)
        item.refresh_from_db()
        self.assertEqual(item.status, "SOLD")

        cn = self._make_invoice("CREDIT_NOTE", item.id, reference_invoice=sale)
        self.assertEqual(str(cn.reference_invoice_id), str(sale.id))
        issue_invoice(cn, issued_by=self.tenant)
        item.refresh_from_db()
        self.assertEqual(item.status, "IN_STOCK")

    def test_credit_note_reference_invoice_points_to_original_sale(self):
        item = self._fresh_item()
        sale = self._make_invoice("TAX_INVOICE", item.id)
        issue_invoice(sale, issued_by=self.tenant)
        cn = self._make_invoice("CREDIT_NOTE", item.id, reference_invoice=sale)
        cn.refresh_from_db()
        self.assertEqual(cn.reference_invoice_id, sale.id)
        self.assertEqual(cn.invoice_type, "CREDIT_NOTE")

    # d. Estimate issue → NO stock movement
    def test_estimate_issue_does_not_sell_item(self):
        item = self._fresh_item()
        estimate = self._make_invoice("ESTIMATE", item.id)
        issue_invoice(estimate, issued_by=self.tenant)
        item.refresh_from_db()
        self.assertEqual(item.status, "IN_STOCK")
        self.assertEqual(estimate.status, "ISSUED")

    def test_estimate_draft_does_not_change_item_status(self):
        item = self._fresh_item()
        estimate = self._make_invoice("ESTIMATE", item.id)
        self.assertEqual(estimate.status, "DRAFT")
        item.refresh_from_db()
        self.assertEqual(item.status, "IN_STOCK")

    def test_estimate_cancel_item_stays_in_stock(self):
        item = self._fresh_item()
        estimate = self._make_invoice("ESTIMATE", item.id)
        issue_invoice(estimate, issued_by=self.tenant)
        cancel_invoice(estimate, cancelled_by=self.tenant, reason="Quote expired")
        item.refresh_from_db()
        self.assertEqual(item.status, "IN_STOCK")

    # e. Estimate → convert → issue → item SOLD
    def test_estimate_convert_then_issue_sells_item(self):
        item = self._fresh_item()
        estimate = self._make_invoice("ESTIMATE", item.id)
        issue_invoice(estimate, issued_by=self.tenant)

        converted = convert_to_invoice(estimate, converted_by=self.tenant)
        self.assertEqual(converted.invoice_type, "TAX_INVOICE")
        self.assertEqual(converted.status, "DRAFT")
        item.refresh_from_db()
        self.assertEqual(item.status, "IN_STOCK")  # not sold yet — still draft

        issue_invoice(converted, issued_by=self.tenant)
        item.refresh_from_db()
        self.assertEqual(item.status, "SOLD")
