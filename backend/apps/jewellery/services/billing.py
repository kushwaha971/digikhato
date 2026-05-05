"""Jewellery billing service — formulas §7.1–7.8 (Phase B-1.5).

All business logic lives here; views only call these functions.
Every input used in a calculation is persisted on the line so
historical bills don't change when masters change.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.jewellery.models.billing import (
    OldGoldPurchase,
    SalesInvoice,
    SalesInvoiceLine,
    SalesInvoicePayment,
)
from apps.jewellery.models.inventory import Item
from apps.jewellery.services.number_series import get_next_number

TWO = Decimal("0.01")
FOUR = Decimal("0.0001")
ONE = Decimal("1")


def _pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_invoice_pdf(invoice: SalesInvoice) -> bytes:
    """
    Build a compact single-page PDF without external dependencies.
    This keeps Phase B printable/PDF flow working in all environments.
    """
    lines = [
        "DigiKhaato Jewellery ERP",
        f"Document: {_pdf_escape(invoice.get_invoice_type_display())}",
        f"Voucher: {_pdf_escape(invoice.voucher_no or 'DRAFT')}",
        f"Date: {_pdf_escape(str(invoice.voucher_date or ''))}",
        f"Status: {_pdf_escape(invoice.status)}",
        f"Customer: {_pdf_escape(invoice.customer.name if invoice.customer else 'Walk-in customer')}",
        "",
        "Line Items:",
    ]
    for idx, line in enumerate(invoice.lines.all(), start=1):
        desc = line.description or f"Line {idx}"
        lines.append(
            _pdf_escape(
                f"{idx}. {desc} | {line.net_wt}g | Rate {line.rate_per_gram} | Total {line.line_total}"
            )
        )
    lines.extend(
        [
            "",
            f"Gross: {invoice.gross_amount}",
            f"Discount: {invoice.discount_amount}",
            f"Taxable: {invoice.taxable_amount}",
            f"CGST: {invoice.cgst}",
            f"SGST: {invoice.sgst}",
            f"IGST: {invoice.igst}",
            f"Total: {invoice.total_amount}",
            "",
            f"Generated at: {_pdf_escape(timezone.localtime().strftime('%Y-%m-%d %H:%M:%S'))}",
        ]
    )

    y = 800
    content_lines = ["BT", "/F1 11 Tf"]
    for row in lines:
        safe = _pdf_escape(row)
        content_lines.append(f"1 0 0 1 50 {y} Tm ({safe}) Tj")
        y -= 16
        if y < 60:
            break
    content_lines.append("ET")
    stream_data = "\n".join(content_lines).encode("latin-1", errors="replace")

    objects = []

    def add_obj(payload: bytes) -> None:
        objects.append(payload)

    add_obj(b"<< /Type /Catalog /Pages 2 0 R >>")
    add_obj(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    add_obj(
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
    )
    add_obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    add_obj(b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream_data), stream_data))

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for idx, payload in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{idx} 0 obj\n".encode("ascii"))
        pdf.extend(payload)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects)+1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    trailer = (
        f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    )
    pdf.extend(trailer.encode("ascii"))
    return bytes(pdf)


# ─── §7.2 Making Charge ───────────────────────────────────────────────────────

def calc_making_charge(
    mode: str,
    net_wt: Decimal,
    metal_value: Decimal,
    making_rate: Decimal,
) -> Decimal:
    """
    mode: PER_GRAM | PCT_METAL | PER_PIECE
    Returns making_charge rounded to 2dp.
    """
    if mode == "PER_GRAM":
        result = net_wt * making_rate
    elif mode == "PCT_METAL":
        result = metal_value * making_rate / Decimal("100")
    else:  # PER_PIECE
        result = making_rate
    return result.quantize(TWO, rounding=ROUND_HALF_UP)


# ─── §7.3 Wastage ────────────────────────────────────────────────────────────

def calc_wastage(net_wt: Decimal, wastage_pct: Decimal, rate_per_gram: Decimal) -> Decimal:
    """Returns wastage_amount rounded to 2dp."""
    wastage_grams = net_wt * wastage_pct / Decimal("100")
    return (wastage_grams * rate_per_gram).quantize(TWO, rounding=ROUND_HALF_UP)


# ─── §7.6 Line GST ───────────────────────────────────────────────────────────

def calc_line_gst(
    line_metal_part: Decimal,
    hallmarking_fee: Decimal,
    gst_rate_pct: Decimal,
    is_inter_state: bool,
) -> dict:
    """
    Returns dict with keys: gst_amount, cgst, sgst, igst, hallmark_gst_amount.
    Metal GST rate (gst_rate_pct) is typically 3% for gold jewellery (HSN 7113).
    Hallmarking fee is always 18% GST (service).
    """
    metal_gst = (line_metal_part * gst_rate_pct / Decimal("100")).quantize(TWO, rounding=ROUND_HALF_UP)
    hallmark_gst = (hallmarking_fee * Decimal("18") / Decimal("100")).quantize(TWO, rounding=ROUND_HALF_UP)

    if is_inter_state:
        cgst = Decimal("0.00")
        sgst = Decimal("0.00")
        igst = metal_gst
    else:
        half = (metal_gst / Decimal("2")).quantize(TWO, rounding=ROUND_HALF_UP)
        cgst = half
        sgst = metal_gst - half  # keeps sum exact
        igst = Decimal("0.00")

    return {
        "gst_amount": metal_gst,
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "hallmark_gst_amount": hallmark_gst,
    }


# ─── §7.1 + §7.2–7.6 Full Line Calculation ───────────────────────────────────

def calculate_line(line_data: dict, is_inter_state: bool) -> dict:
    """
    Compute all derived fields for one invoice line.
    line_data keys (all required):
      net_wt, rate_per_gram, making_mode, making_rate, wastage_pct,
      hallmarking_fee, stone_value, gst_rate_pct
    Returns dict with all computed fields merged back.
    """
    net_wt = Decimal(str(line_data.get("net_wt", 0)))
    rate_per_gram = Decimal(str(line_data.get("rate_per_gram", 0)))
    making_mode = line_data.get("making_mode", "PER_GRAM")
    making_rate = Decimal(str(line_data.get("making_rate", 0)))
    wastage_pct = Decimal(str(line_data.get("wastage_pct", 0)))
    hallmarking_fee = Decimal(str(line_data.get("hallmarking_fee", 0)))
    stone_value = Decimal(str(line_data.get("stone_value", 0)))
    gst_rate_pct = Decimal(str(line_data.get("gst_rate_pct", 3)))

    metal_value = (net_wt * rate_per_gram).quantize(TWO, rounding=ROUND_HALF_UP)
    making_charge = calc_making_charge(making_mode, net_wt, metal_value, making_rate)
    wastage_amount = calc_wastage(net_wt, wastage_pct, rate_per_gram)

    line_metal_part = metal_value + making_charge + wastage_amount
    gst_info = calc_line_gst(line_metal_part, hallmarking_fee, gst_rate_pct, is_inter_state)

    line_total = (
        line_metal_part
        + gst_info["gst_amount"]
        + hallmarking_fee
        + gst_info["hallmark_gst_amount"]
        + stone_value
    ).quantize(TWO, rounding=ROUND_HALF_UP)

    return {
        **line_data,
        "metal_value": metal_value,
        "making_charge": making_charge,
        "wastage_amount": wastage_amount,
        "line_metal_part": line_metal_part,
        "gst_amount": gst_info["gst_amount"],
        "hallmark_gst_amount": gst_info["hallmark_gst_amount"],
        "line_subtotal": line_metal_part + hallmarking_fee + stone_value,
        "line_total": line_total,
        "cgst_line": gst_info["cgst"],
        "sgst_line": gst_info["sgst"],
        "igst_line": gst_info["igst"],
    }


# ─── §7.7 Bill-Level Discount + Round-Off ─────────────────────────────────────

def calculate_invoice(lines_data: list[dict], discount_amount: Decimal, is_inter_state: bool) -> dict:
    """
    Stateless preview: compute full invoice totals from raw lines + discount.
    Returns a dict with computed_lines and invoice-level totals.
    Does NOT touch the database.
    """
    discount_amount = Decimal(str(discount_amount))
    computed_lines = [calculate_line(ld, is_inter_state) for ld in lines_data]

    total_taxable = sum(Decimal(str(cl["line_metal_part"])) + Decimal(str(cl.get("hallmarking_fee", 0))) for cl in computed_lines)
    total_stone = sum(Decimal(str(cl.get("stone_value", 0))) for cl in computed_lines)

    # Allocate discount proportionally across lines (reduces taxable base)
    if discount_amount > 0 and total_taxable > 0:
        for cl in computed_lines:
            line_taxable = Decimal(str(cl["line_metal_part"])) + Decimal(str(cl.get("hallmarking_fee", 0)))
            cl["discount_allocated"] = (discount_amount * line_taxable / total_taxable).quantize(TWO, rounding=ROUND_HALF_UP)
    else:
        for cl in computed_lines:
            cl["discount_allocated"] = Decimal("0.00")

    # Recompute GST on reduced taxable base after discount
    total_cgst = Decimal("0.00")
    total_sgst = Decimal("0.00")
    total_igst = Decimal("0.00")
    total_hallmark_gst = Decimal("0.00")
    for cl in computed_lines:
        alloc = Decimal(str(cl["discount_allocated"]))
        reduced_metal_part = max(Decimal(str(cl["line_metal_part"])) - alloc, Decimal("0.00"))
        gst_rate_pct = Decimal(str(cl.get("gst_rate_pct", 3)))
        hallmarking_fee = Decimal(str(cl.get("hallmarking_fee", 0)))
        gst_info = calc_line_gst(reduced_metal_part, hallmarking_fee, gst_rate_pct, is_inter_state)
        total_cgst += gst_info["cgst"]
        total_sgst += gst_info["sgst"]
        total_igst += gst_info["igst"]
        total_hallmark_gst += gst_info["hallmark_gst_amount"]

    total_gst = total_cgst + total_sgst + total_igst + total_hallmark_gst
    gross_total = total_taxable + total_gst - discount_amount + total_stone
    round_off = (round(gross_total) - gross_total).quantize(TWO, rounding=ROUND_HALF_UP)
    total_payable = gross_total + round_off

    return {
        "computed_lines": computed_lines,
        "gross_amount": (total_taxable + total_stone).quantize(TWO, rounding=ROUND_HALF_UP),
        "discount_amount": discount_amount,
        "taxable_amount": total_taxable.quantize(TWO, rounding=ROUND_HALF_UP),
        "stone_value": total_stone.quantize(TWO, rounding=ROUND_HALF_UP),
        "cgst": total_cgst.quantize(TWO, rounding=ROUND_HALF_UP),
        "sgst": total_sgst.quantize(TWO, rounding=ROUND_HALF_UP),
        "igst": total_igst.quantize(TWO, rounding=ROUND_HALF_UP),
        "hallmark_gst": total_hallmark_gst.quantize(TWO, rounding=ROUND_HALF_UP),
        "round_off": round_off,
        "total_amount": total_payable.quantize(TWO, rounding=ROUND_HALF_UP),
    }


# ─── §7.8 Old Gold Buy-Back ───────────────────────────────────────────────────

def calc_old_gold_deduction(gross_wt: Decimal, tested_purity: Decimal, buy_rate_per_gram: Decimal) -> dict:
    """
    old_gold_pure_grams = gross_wt × (tested_purity / 99.9)
    deduction_value     = pure_grams × buy_rate_per_gram
    """
    pure_grams = (Decimal(str(gross_wt)) * Decimal(str(tested_purity)) / Decimal("99.9")).quantize(FOUR, rounding=ROUND_HALF_UP)
    deduction_value = (pure_grams * Decimal(str(buy_rate_per_gram))).quantize(TWO, rounding=ROUND_HALF_UP)
    return {"pure_grams": pure_grams, "deduction_value": deduction_value}


# ─── Issue Invoice ────────────────────────────────────────────────────────────

def issue_invoice(invoice: SalesInvoice, issued_by: Any) -> SalesInvoice:
    """
    Atomically:
    1. Assign voucher_no from number series.
    2. Set status → ISSUED, record issued_at/issued_by.
    3. For sales invoices: set linked Item.status → SOLD.
    4. For credit notes: set linked Item.status → IN_STOCK.
    4. Estimates: no stock movement on issue.
    """
    if invoice.status != "DRAFT":
        raise ValueError(f"Only DRAFT invoices can be issued. Current status: {invoice.status}")

    with transaction.atomic():
        if not invoice.voucher_no:
            invoice.voucher_no = get_next_number(
                tenant=invoice.tenant,
                voucher_type=invoice.invoice_type,
                branch_name=invoice.branch_name,
            )

        invoice.status = "ISSUED"
        invoice.issued_at = timezone.now()
        invoice.issued_by = issued_by
        invoice.save(update_fields=["voucher_no", "status", "issued_at", "issued_by", "updated_at"])

        # Move linked items to SOLD (not for estimates/credit notes)
        if invoice.invoice_type in ("TAX_INVOICE", "CASH_MEMO", "NON_GST"):
            item_ids = (
                SalesInvoiceLine.objects
                .filter(invoice=invoice, item__isnull=False)
                .values_list("item_id", flat=True)
            )
            if item_ids:
                in_stock = Item.objects.filter(id__in=item_ids, status="IN_STOCK")
                not_in_stock = Item.objects.filter(id__in=item_ids).exclude(status="IN_STOCK")
                if not_in_stock.exists():
                    codes = list(not_in_stock.values_list("sku", flat=True))
                    raise ValueError(f"Items not in stock: {codes}. Cannot issue invoice.")
                in_stock.update(status="SOLD")
        elif invoice.invoice_type == "CREDIT_NOTE":
            item_ids = (
                SalesInvoiceLine.objects
                .filter(invoice=invoice, item__isnull=False)
                .values_list("item_id", flat=True)
            )
            if item_ids:
                sold_items = Item.objects.filter(id__in=item_ids, status="SOLD")
                not_sold = Item.objects.filter(id__in=item_ids).exclude(status="SOLD")
                if not_sold.exists():
                    codes = list(not_sold.values_list("sku", flat=True))
                    raise ValueError(f"Items not in sold state: {codes}. Cannot issue credit note.")
                sold_items.update(status="IN_STOCK")

    return invoice


# ─── Cancel Invoice ───────────────────────────────────────────────────────────

def cancel_invoice(invoice: SalesInvoice, cancelled_by: Any, reason: str) -> SalesInvoice:
    """
    Cancel an issued invoice. Reverses item status → IN_STOCK.
    Draft invoices can be deleted; only ISSUED invoices are cancelled.
    """
    if invoice.status == "CANCELLED":
        raise ValueError("Invoice is already cancelled.")
    if invoice.status == "DRAFT":
        raise ValueError("Delete draft invoices instead of cancelling.")

    with transaction.atomic():
        invoice.status = "CANCELLED"
        invoice.cancelled_at = timezone.now()
        invoice.cancelled_by = cancelled_by
        invoice.cancel_reason = reason
        invoice.save(update_fields=["status", "cancelled_at", "cancelled_by", "cancel_reason", "updated_at"])

        # Reverse item status based on document type.
        item_ids = (
            SalesInvoiceLine.objects
            .filter(invoice=invoice, item__isnull=False)
            .values_list("item_id", flat=True)
        )
        if item_ids:
            if invoice.invoice_type == "CREDIT_NOTE":
                Item.objects.filter(id__in=item_ids, status="IN_STOCK").update(status="SOLD")
            elif invoice.invoice_type in ("TAX_INVOICE", "CASH_MEMO", "NON_GST"):
                Item.objects.filter(id__in=item_ids, status="SOLD").update(status="IN_STOCK")

    return invoice


# ─── Create Invoice From Validated Data ───────────────────────────────────────

def create_invoice(tenant, branch_name: str, invoice_data: dict, lines_data: list[dict], old_gold_data: list[dict], payments_data: list[dict], created_by: Any) -> SalesInvoice:
    """Create a DRAFT invoice with all lines, old gold, and initial payments."""
    discount_amount = Decimal(str(invoice_data.get("discount_amount", 0)))
    seller_state = invoice_data.get("seller_state_code", "")
    buyer_state = invoice_data.get("place_of_supply_state_code", "")
    is_inter_state = bool(seller_state and buyer_state and seller_state != buyer_state)

    totals = calculate_invoice(lines_data, discount_amount, is_inter_state)

    with transaction.atomic():
        invoice = SalesInvoice.objects.create(
            tenant=tenant,
            branch_name=branch_name,
            created_by=created_by,
            updated_by=created_by,
            customer_id=invoice_data.get("customer"),
            reference_invoice_id=invoice_data.get("reference_invoice"),
            invoice_type=invoice_data.get("invoice_type", "TAX_INVOICE"),
            voucher_date=invoice_data.get("voucher_date"),
            place_of_supply_state_code=buyer_state,
            seller_state_code=seller_state,
            is_inter_state=is_inter_state,
            notes=invoice_data.get("notes", ""),
            discount_amount=totals["discount_amount"],
            gross_amount=totals["gross_amount"],
            taxable_amount=totals["taxable_amount"],
            stone_value=totals["stone_value"],
            cgst=totals["cgst"],
            sgst=totals["sgst"],
            igst=totals["igst"],
            hallmark_gst=totals["hallmark_gst"],
            round_off=totals["round_off"],
            total_amount=totals["total_amount"],
        )

        for i, cl in enumerate(totals["computed_lines"], start=1):
            SalesInvoiceLine.objects.create(
                invoice=invoice,
                line_no=i,
                item_id=cl.get("item"),
                description=cl.get("description", ""),
                hsn_code=cl.get("hsn_code", ""),
                metal_code=cl.get("metal_code", ""),
                purity_code=cl.get("purity_code", ""),
                gross_wt=cl.get("gross_wt", 0),
                net_wt=cl.get("net_wt", 0),
                stone_wt=cl.get("stone_wt", 0),
                rate_per_gram=cl.get("rate_per_gram", 0),
                metal_value=cl["metal_value"],
                making_mode=cl.get("making_mode", "PER_GRAM"),
                making_rate=cl.get("making_rate", 0),
                making_charge=cl["making_charge"],
                wastage_pct=cl.get("wastage_pct", 0),
                wastage_amount=cl["wastage_amount"],
                hallmarking_fee=cl.get("hallmarking_fee", 0),
                stone_value=cl.get("stone_value", 0),
                gst_rate_pct=cl.get("gst_rate_pct", 3),
                line_metal_part=cl["line_metal_part"],
                gst_amount=cl["gst_amount"],
                hallmark_gst_amount=cl.get("hallmark_gst_amount", 0),
                discount_allocated=cl.get("discount_allocated", 0),
                line_subtotal=cl["line_subtotal"],
                line_total=cl["line_total"],
            )

        # Old gold buy-back rows
        total_old_gold = Decimal("0.00")
        for og in old_gold_data:
            deduction = calc_old_gold_deduction(
                og["gross_wt"], og["tested_purity"], og["buy_rate_per_gram"]
            )
            OldGoldPurchase.objects.create(
                invoice=invoice,
                metal_code=og.get("metal_code", "GOLD"),
                description=og.get("description", ""),
                gross_wt=og["gross_wt"],
                tested_purity=og["tested_purity"],
                pure_grams=deduction["pure_grams"],
                buy_rate_per_gram=og["buy_rate_per_gram"],
                deduction_value=deduction["deduction_value"],
            )
            total_old_gold += deduction["deduction_value"]

        # Payment rows
        paid = Decimal("0.00")
        for pmt in payments_data:
            amt = Decimal(str(pmt["amount"]))
            SalesInvoicePayment.objects.create(
                invoice=invoice,
                mode=pmt.get("mode", "CASH"),
                amount=amt,
                reference=pmt.get("reference", ""),
            )
            paid += amt

        balance = (invoice.total_amount - total_old_gold - paid).quantize(TWO, rounding=ROUND_HALF_UP)
        invoice.advance_used = total_old_gold
        invoice.paid_amount = paid
        invoice.balance_amount = balance
        invoice.save(update_fields=["advance_used", "paid_amount", "balance_amount", "updated_at"])

    return invoice
