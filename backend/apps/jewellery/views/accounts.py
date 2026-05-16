"""Views for Accounts & Ledger module (Module 5)."""

from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jewellery.models.accounts import Account, Voucher, VoucherEntry
from apps.jewellery.permissions import HasJewelleryPermission, JewelleryFeatureGuard
from apps.jewellery.serializers.accounts import (
    AccountSerializer,
    TrialBalanceRowSerializer,
    VoucherSerializer,
)
from apps.jewellery.views.master import JewelleryTenantScopedViewSet
from apps.users.views import get_effective_tenant


class CoaView(APIView):
    """GET /accounts/coa/ — returns full account tree (top-level nodes with nested children)."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get(self, request):
        tenant = get_effective_tenant(request.user)
        if not tenant:
            return Response([], status=status.HTTP_200_OK)

        root_accounts = (
            Account.objects.filter(tenant=tenant, deleted_at__isnull=True, parent__isnull=True)
            .prefetch_related("children")
            .order_by("code")
        )
        serializer = AccountSerializer(root_accounts, many=True)
        return Response(serializer.data)


class VoucherViewSet(JewelleryTenantScopedViewSet):
    serializer_class = VoucherSerializer
    queryset = Voucher.objects.prefetch_related("entries__account")

    def get_permissions(self):
        return [IsAuthenticated(), JewelleryFeatureGuard()]

    def get_queryset(self):
        tenant = self.get_tenant()
        if not tenant:
            return self.queryset.none()
        qs = self.queryset.filter(tenant=tenant, deleted_at__isnull=True)

        voucher_type = self.request.query_params.get("voucher_type")
        if voucher_type:
            qs = qs.filter(voucher_type=voucher_type)

        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(voucher_date__gte=date_from)
        if date_to:
            qs = qs.filter(voucher_date__lte=date_to)

        return qs.order_by("-voucher_date", "-created_at")

    @transaction.atomic
    def perform_create(self, serializer):
        tenant = self.get_tenant()
        serializer.save(
            tenant=tenant,
            branch_name=self._branch_name(),
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    @action(detail=True, methods=["post"], url_path="post")
    @transaction.atomic
    def post_voucher(self, request, pk=None):
        """POST /accounts/vouchers/{id}/post/ — transitions DRAFT → POSTED."""
        voucher = self.get_object()
        if voucher.status == "POSTED":
            raise ValidationError({"detail": "Voucher is already posted."})
        voucher.status = "POSTED"
        voucher.updated_by = request.user
        voucher.save(update_fields=["status", "updated_by", "updated_at"])
        serializer = self.get_serializer(voucher)
        return Response(serializer.data)


class TrialBalanceView(APIView):
    """GET /accounts/trial-balance/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD"""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get(self, request):
        tenant = get_effective_tenant(request.user)
        if not tenant:
            return Response([], status=status.HTTP_200_OK)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        entries_qs = VoucherEntry.objects.filter(
            tenant=tenant,
            deleted_at__isnull=True,
            voucher__status="POSTED",
            voucher__deleted_at__isnull=True,
        )
        if date_from:
            entries_qs = entries_qs.filter(voucher__voucher_date__gte=date_from)
        if date_to:
            entries_qs = entries_qs.filter(voucher__voucher_date__lte=date_to)

        aggregated = (
            entries_qs.values("account__id", "account__code", "account__name")
            .annotate(
                debit_total=Sum("debit"),
                credit_total=Sum("credit"),
            )
            .order_by("account__code")
        )

        rows = []
        for row in aggregated:
            debit_total = row["debit_total"] or Decimal("0")
            credit_total = row["credit_total"] or Decimal("0")
            rows.append(
                {
                    "account_id": row["account__id"],
                    "account_code": row["account__code"],
                    "account_name": row["account__name"],
                    "debit_total": debit_total,
                    "credit_total": credit_total,
                    "balance": debit_total - credit_total,
                }
            )

        serializer = TrialBalanceRowSerializer(rows, many=True)
        return Response(serializer.data)
