"""Jewellery billing views (Phase B-1.5)."""

from decimal import Decimal

from django.db.models import Q
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.constants import P_BILLING_CANCEL, P_BILLING_CREATE, P_BILLING_VIEW
from apps.jewellery.models.billing import Customer, SalesInvoice
from apps.jewellery.permissions import HasJewelleryPermission, JewelleryFeatureGuard
from apps.jewellery.serializers.billing import (
    CalculateInvoiceSerializer,
    CancelInvoiceSerializer,
    CreateInvoiceSerializer,
    CustomerSerializer,
    SalesInvoiceSerializer,
)
from apps.jewellery.services.billing import (
    calculate_invoice,
    cancel_invoice,
    create_invoice,
    build_invoice_pdf,
    issue_invoice,
)
from apps.users.views import get_effective_tenant


class CustomerViewSet(viewsets.ModelViewSet):
    """CRUD for jewellery customers."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]
    serializer_class = CustomerSerializer

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = Customer.objects.filter(tenant=tenant, deleted_at__isnull=True)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(mobile__icontains=search)
        return qs.order_by("name")

    def perform_create(self, serializer):
        tenant = get_effective_tenant(self.request.user)
        serializer.save(
            tenant=tenant,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SalesInvoiceViewSet(viewsets.ModelViewSet):
    """Sales invoice CRUD + issue/cancel actions."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]
    serializer_class = SalesInvoiceSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]
    billing_view_permission = HasJewelleryPermission(P_BILLING_VIEW)
    billing_create_permission = HasJewelleryPermission(P_BILLING_CREATE)
    billing_cancel_permission = HasJewelleryPermission(P_BILLING_CANCEL)

    def _check_billing_permission(self, permission_checker):
        return permission_checker.has_permission(self.request, self)

    def get_permissions(self):
        permissions = [IsAuthenticated(), JewelleryFeatureGuard()]
        if self.action in ("list", "retrieve", "pdf"):
            permissions.append(HasJewelleryPermission(P_BILLING_VIEW))
        elif self.action in ("create", "issue"):
            permissions.append(HasJewelleryPermission(P_BILLING_CREATE))
        elif self.action == "cancel":
            permissions.append(HasJewelleryPermission(P_BILLING_CANCEL))
        return permissions

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = SalesInvoice.objects.filter(
            tenant=tenant, deleted_at__isnull=True
        ).select_related("customer").prefetch_related("lines", "payments", "old_gold_purchases")

        params = self.request.query_params
        if invoice_type := params.get("type"):
            qs = qs.filter(invoice_type=invoice_type)
        if inv_status := params.get("status"):
            qs = qs.filter(status=inv_status)
        if customer := params.get("customer"):
            qs = qs.filter(customer_id=customer)
        if search := params.get("search"):
            qs = qs.filter(
                Q(customer__name__icontains=search)
                | Q(customer__mobile__icontains=search)
                | Q(voucher_no__icontains=search)
            )
        if from_date := params.get("from"):
            qs = qs.filter(voucher_date__gte=from_date)
        if to_date := params.get("to"):
            qs = qs.filter(voucher_date__lte=to_date)
        return qs.order_by("-created_at")

    def create(self, request):
        """POST /sales/invoices/ — create DRAFT invoice."""
        if not self._check_billing_permission(self.billing_create_permission):
            return Response({"detail": "You do not have billing create permission."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        tenant = get_effective_tenant(request.user)
        reference_invoice = None
        reference_invoice_id = d.get("reference_invoice")
        if reference_invoice_id:
            reference_invoice = SalesInvoice.objects.filter(
                id=reference_invoice_id,
                tenant=tenant,
                deleted_at__isnull=True,
            ).first()
            if reference_invoice is None:
                return Response({"reference_invoice": ["Invalid reference invoice."]}, status=status.HTTP_400_BAD_REQUEST)

        if d["invoice_type"] == "CREDIT_NOTE":
            if reference_invoice is None:
                return Response({"reference_invoice": ["Reference invoice is required for credit note."]}, status=status.HTTP_400_BAD_REQUEST)
            if reference_invoice.status != "ISSUED":
                return Response({"reference_invoice": ["Reference invoice must be issued."]}, status=status.HTTP_400_BAD_REQUEST)

        invoice = create_invoice(
            tenant=tenant,
            branch_name=request.headers.get("X-Branch-Name", ""),
            invoice_data={
                "customer": d.get("customer"),
                "reference_invoice": str(reference_invoice.id) if reference_invoice else None,
                "invoice_type": d["invoice_type"],
                "voucher_date": d.get("voucher_date"),
                "place_of_supply_state_code": d.get("place_of_supply_state_code", ""),
                "seller_state_code": d.get("seller_state_code", ""),
                "discount_amount": d.get("discount_amount", 0),
                "notes": d.get("notes", ""),
            },
            lines_data=[dict(line) for line in d["lines"]],
            old_gold_data=[dict(og) for og in d.get("old_gold", [])],
            payments_data=[dict(p) for p in d.get("payments", [])],
            created_by=request.user,
        )
        return Response(SalesInvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="issue")
    def issue(self, request, pk=None):
        """POST /sales/invoices/{id}/issue/ — issue DRAFT invoice."""
        if not self._check_billing_permission(self.billing_create_permission):
            return Response({"detail": "You do not have billing create permission."}, status=status.HTTP_403_FORBIDDEN)
        invoice = self.get_object()
        try:
            invoice = issue_invoice(invoice, issued_by=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(SalesInvoiceSerializer(invoice).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """POST /sales/invoices/{id}/cancel/ — cancel issued invoice."""
        if not self._check_billing_permission(self.billing_cancel_permission):
            return Response({"detail": "You do not have billing cancel permission."}, status=status.HTTP_403_FORBIDDEN)
        invoice = self.get_object()
        serializer = CancelInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            invoice = cancel_invoice(
                invoice,
                cancelled_by=request.user,
                reason=serializer.validated_data["reason"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(SalesInvoiceSerializer(invoice).data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        """GET /sales/invoices/{id}/pdf/ — printable PDF for invoice/credit note."""
        if not self._check_billing_permission(self.billing_view_permission):
            return Response({"detail": "You do not have billing view permission."}, status=status.HTTP_403_FORBIDDEN)
        invoice = self.get_object()
        pdf_bytes = build_invoice_pdf(invoice)
        filename = (invoice.voucher_no or f"{invoice.invoice_type.lower()}-{invoice.id}").replace(" ", "_")
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{filename}.pdf"'
        return response


class CalculateInvoiceView(APIView):
    """POST /sales/calculate/ — stateless preview; no DB write."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def post(self, request):
        serializer = CalculateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        seller_state = d.get("seller_state_code", "")
        buyer_state = d.get("place_of_supply_state_code", "")
        is_inter_state = bool(seller_state and buyer_state and seller_state != buyer_state)

        result = calculate_invoice(
            lines_data=[dict(line) for line in d["lines"]],
            discount_amount=Decimal(str(d.get("discount_amount", 0))),
            is_inter_state=is_inter_state,
        )
        return Response(result)
