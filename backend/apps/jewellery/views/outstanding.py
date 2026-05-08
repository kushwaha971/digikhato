"""Party Outstanding views (Phase B-2.4)."""
import csv

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.constants import P_ACCOUNTS_ADJUST, P_ACCOUNTS_VIEW
from apps.jewellery.models.billing import Customer
from apps.jewellery.models.outstanding import PartyOutstandingBalance
from apps.jewellery.permissions import HasJewelleryPermission, JewelleryFeatureGuard
from apps.jewellery.serializers.outstanding import (
    ManualAdjustmentSerializer,
    PartyOutstandingBalanceListSerializer,
    PartyOutstandingBalanceSerializer,
)
from apps.jewellery.services.outstanding import get_ageing_report, post_movement
from apps.users.views import get_effective_tenant


class PartyOutstandingViewSet(viewsets.GenericViewSet):
    """
    GET  /outstanding/              — list all customer balances (ageing report)
    GET  /outstanding/export/       — export balances as CSV
    GET  /outstanding/{id}/         — customer balance + last 20 movements
    POST /outstanding/{id}/adjust/  — manual debit/credit (Admin/Manager only)

    {id} is the PartyOutstandingBalance UUID.
    """

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        return PartyOutstandingBalance.objects.filter(
            tenant=tenant,
            deleted_at__isnull=True,
        ).select_related("customer").order_by("-amount_balance")

    def list(self, request):
        """GET /outstanding/ — ageing report."""
        view_perm = HasJewelleryPermission(P_ACCOUNTS_VIEW)
        if not view_perm.has_permission(request, self):
            return Response(
                {"detail": "You do not have permission to view outstanding balances."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tenant = get_effective_tenant(request.user)
        branch_name = (
            request.query_params.get("branch_name")
            or request.headers.get("X-Branch-Name")
            or ""
        )
        customer_id = request.query_params.get("customer") or ""
        ageing = request.query_params.get("ageing") or ""
        include_zero_param = request.query_params.get("include_zero")
        include_zero = False if include_zero_param is None else include_zero_param.lower() in ("1", "true", "yes")
        report = get_ageing_report(
            tenant,
            branch_name=branch_name,
            customer_id=customer_id,
            ageing=ageing,
            include_zero=include_zero,
        )
        return Response(report)

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """GET /outstanding/export/ — CSV export for party outstanding list."""
        view_perm = HasJewelleryPermission(P_ACCOUNTS_VIEW)
        if not view_perm.has_permission(request, self):
            return Response(
                {"detail": "You do not have permission to view outstanding balances."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tenant = get_effective_tenant(request.user)
        branch_name = (
            request.query_params.get("branch_name")
            or request.headers.get("X-Branch-Name")
            or ""
        )
        customer_id = request.query_params.get("customer") or ""
        ageing = request.query_params.get("ageing") or ""
        include_zero_param = request.query_params.get("include_zero")
        include_zero = False if include_zero_param is None else include_zero_param.lower() in ("1", "true", "yes")
        rows = get_ageing_report(
            tenant,
            branch_name=branch_name,
            customer_id=customer_id,
            ageing=ageing,
            include_zero=include_zero,
        )

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="jwl-outstanding.csv"'
        writer = csv.writer(response)
        writer.writerow([
            "Customer Name",
            "Mobile",
            "Cash Balance",
            "Metal Balance (g)",
            "Last Activity Date",
            "Ageing Bucket",
        ])
        for row in rows:
            writer.writerow([
                row.get("customer_name", ""),
                row.get("mobile", ""),
                str(row.get("amount_balance", "0")),
                str(row.get("metal_balance_grams", "0")),
                str(row.get("last_txn_date") or ""),
                row.get("ageing_bucket", ""),
            ])
        return response

    def retrieve(self, request, pk=None):
        """GET /outstanding/{id}/ — balance detail with last 20 movements."""
        view_perm = HasJewelleryPermission(P_ACCOUNTS_VIEW)
        if not view_perm.has_permission(request, self):
            return Response(
                {"detail": "You do not have permission to view outstanding balances."},
                status=status.HTTP_403_FORBIDDEN,
            )

        balance = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = PartyOutstandingBalanceSerializer(balance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="adjust")
    def adjust(self, request, pk=None):
        """POST /outstanding/{id}/adjust/ — post a manual adjustment."""
        adjust_perm = HasJewelleryPermission(P_ACCOUNTS_ADJUST)
        if not adjust_perm.has_permission(request, self):
            return Response(
                {"detail": "You do not have permission to post adjustments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        balance = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = ManualAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tenant = get_effective_tenant(request.user)
        movement = post_movement(
            tenant=tenant,
            customer=balance.customer,
            movement_type=data["movement_type"],
            amount_delta=data["amount_delta"],
            metal_delta_grams=data["metal_delta_grams"],
            reference_type=data.get("reference_type", ""),
            reference_id=data.get("reference_id", ""),
            notes=data.get("notes", ""),
            txn_date=data.get("txn_date"),
            created_by=request.user,
        )

        # Refresh balance from DB
        balance.refresh_from_db()
        return Response(
            {
                "movement_id": str(movement.id),
                "movement_type": movement.movement_type,
                "amount_delta": str(movement.amount_delta),
                "metal_delta_grams": str(movement.metal_delta_grams),
                "amount_balance": str(balance.amount_balance),
                "metal_balance_grams": str(balance.metal_balance_grams),
                "last_txn_date": balance.last_txn_date,
            },
            status=status.HTTP_201_CREATED,
        )
