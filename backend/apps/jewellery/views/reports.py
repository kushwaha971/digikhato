"""Jewellery GST report views (Phase B-2.3 MVP contracts)."""

import calendar
import csv
from datetime import date
from decimal import Decimal
from io import StringIO
from typing import Optional

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.constants import P_REPORTS_EXPORT, P_REPORTS_VIEW
from apps.jewellery.models.billing import SalesInvoice
from apps.jewellery.permissions import HasJewelleryPermission, JewelleryFeatureGuard
from apps.jewellery.services.billing import (
    INVOICE_STATUS_ISSUED,
    INVOICE_TYPE_CREDIT_NOTE as INVOICE_TYPE_CREDIT,
    INVOICE_TYPE_TAX,
)
from apps.users.views import get_effective_tenant


def _parse_period(period: Optional[str]):
    if not period or len(period) != 6 or not period.isdigit():
        raise ValueError("Invalid period. Use YYYYMM format.")
    year = int(period[:4])
    month = int(period[4:6])
    if month < 1 or month > 12:
        raise ValueError("Invalid period month. Use YYYYMM format.")
    start = date(year, month, 1)
    end = date(year, month, calendar.monthrange(year, month)[1])
    return start, end


def _period_queryset(user, period: str):
    tenant = get_effective_tenant(user)
    start, end = _parse_period(period)
    queryset = (
        SalesInvoice.objects.filter(
            tenant=tenant,
            deleted_at__isnull=True,
            status=INVOICE_STATUS_ISSUED,
            voucher_date__gte=start,
            voucher_date__lte=end,
            invoice_type__in=(INVOICE_TYPE_TAX, INVOICE_TYPE_CREDIT),
        )
        .select_related("customer")
        .order_by("voucher_date", "voucher_no")
    )
    return queryset


class GstR1ReportView(APIView):
    permission_classes = [IsAuthenticated, JewelleryFeatureGuard, HasJewelleryPermission(P_REPORTS_VIEW)]

    def get(self, request):
        period = request.query_params.get("period")
        fmt = (request.query_params.get("file_format") or "json").strip().lower()
        try:
            invoices = _period_queryset(request.user, period)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        rows = []
        b2b = []
        b2c = []
        cdnr = []
        taxable_total = Decimal("0.00")
        cgst_total = Decimal("0.00")
        sgst_total = Decimal("0.00")
        igst_total = Decimal("0.00")

        for inv in invoices:
            is_credit = inv.invoice_type == INVOICE_TYPE_CREDIT
            sign = Decimal("-1") if is_credit else Decimal("1")
            gstin = ((inv.customer.gstin if inv.customer else "") or "").strip()
            is_b2b = bool(gstin)
            row = {
                "voucher_no": inv.voucher_no,
                "voucher_date": str(inv.voucher_date or ""),
                "invoice_type": inv.invoice_type,
                "customer_gstin": gstin,
                "taxable_amount": str(inv.taxable_amount),
                "cgst": str(inv.cgst),
                "sgst": str(inv.sgst),
                "igst": str(inv.igst),
                "total_amount": str(inv.total_amount),
            }
            rows.append(row)
            taxable_total += sign * inv.taxable_amount
            cgst_total += sign * inv.cgst
            sgst_total += sign * inv.sgst
            igst_total += sign * inv.igst

            if is_credit:
                cdnr.append(row)
            elif is_b2b:
                b2b.append(row)
            else:
                b2c.append(row)

        if fmt in {"excel", "csv"}:
            export_perm = HasJewelleryPermission(P_REPORTS_EXPORT)
            if not export_perm.has_permission(request, self):
                return Response(
                    {"detail": "You do not have report export permission."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            buffer = StringIO()
            writer = csv.writer(buffer)
            writer.writerow(
                [
                    "section",
                    "voucher_no",
                    "voucher_date",
                    "invoice_type",
                    "customer_gstin",
                    "taxable_amount",
                    "cgst",
                    "sgst",
                    "igst",
                    "total_amount",
                ]
            )
            for section_name, section_rows in (("B2B", b2b), ("B2C", b2c), ("CDNR", cdnr)):
                for row in section_rows:
                    writer.writerow(
                        [
                            section_name,
                            row["voucher_no"],
                            row["voucher_date"],
                            row["invoice_type"],
                            row["customer_gstin"],
                            row["taxable_amount"],
                            row["cgst"],
                            row["sgst"],
                            row["igst"],
                            row["total_amount"],
                        ]
                    )

            response = HttpResponse(buffer.getvalue(), content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="jwl-gstr-1-{period}.csv"'
            return response

        if fmt != "json":
            return Response({"detail": "Invalid file_format. Use json, excel, or csv."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "period": period,
                "generated_at": timezone.now().isoformat(),
                "summary": {
                    "invoice_count": len(rows),
                    "b2b_count": len(b2b),
                    "b2c_count": len(b2c),
                    "credit_note_count": len(cdnr),
                    "taxable_total": str(taxable_total.quantize(Decimal("0.01"))),
                    "cgst_total": str(cgst_total.quantize(Decimal("0.01"))),
                    "sgst_total": str(sgst_total.quantize(Decimal("0.01"))),
                    "igst_total": str(igst_total.quantize(Decimal("0.01"))),
                },
                "b2b": b2b,
                "b2c": b2c,
                "cdnr": cdnr,
            }
        )


class GstR3BReportView(APIView):
    permission_classes = [IsAuthenticated, JewelleryFeatureGuard, HasJewelleryPermission(P_REPORTS_VIEW)]

    def get(self, request):
        period = request.query_params.get("period")
        try:
            invoices = _period_queryset(request.user, period)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        taxable_value = Decimal("0.00")
        cgst = Decimal("0.00")
        sgst = Decimal("0.00")
        igst = Decimal("0.00")

        for inv in invoices:
            sign = Decimal("-1") if inv.invoice_type == INVOICE_TYPE_CREDIT else Decimal("1")
            taxable_value += sign * inv.taxable_amount
            cgst += sign * inv.cgst
            sgst += sign * inv.sgst
            igst += sign * inv.igst

        return Response(
            {
                "period": period,
                "generated_at": timezone.now().isoformat(),
                "outward_supplies": {
                    "taxable_value": str(taxable_value.quantize(Decimal("0.01"))),
                    "igst": str(igst.quantize(Decimal("0.01"))),
                    "cgst": str(cgst.quantize(Decimal("0.01"))),
                    "sgst": str(sgst.quantize(Decimal("0.01"))),
                    "cess": "0.00",
                },
                "itc": {
                    "eligible_igst": "0.00",
                    "eligible_cgst": "0.00",
                    "eligible_sgst": "0.00",
                    "reversed_igst": "0.00",
                    "reversed_cgst": "0.00",
                    "reversed_sgst": "0.00",
                },
                "net_tax_payable": {
                    "igst": str(igst.quantize(Decimal("0.01"))),
                    "cgst": str(cgst.quantize(Decimal("0.01"))),
                    "sgst": str(sgst.quantize(Decimal("0.01"))),
                    "cess": "0.00",
                },
            }
        )
