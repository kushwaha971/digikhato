"""Party Outstanding views (Phase B-2.4)."""
import csv
from typing import Optional

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
    PartyOutstandingMovementSerializer,
    PartyOutstandingMovementsFilterSerializer,
)
from apps.jewellery.services.outstanding import get_ageing_report, post_movement
from apps.users.views import get_effective_tenant

DEFAULT_QUERY_TEXT = ""
INCLUDE_ZERO_TRUE_VALUES = ("1", "true", "yes")


def _query_text(request, key: str, default: str = DEFAULT_QUERY_TEXT) -> str:
    value = request.query_params.get(key)
    return value if value is not None else default


def _branch_name(request) -> str:
    return request.query_params.get("branch_name") or request.headers.get("X-Branch-Name") or DEFAULT_QUERY_TEXT


def _include_zero_flag(request) -> bool:
    include_zero_param = request.query_params.get("include_zero")
    if include_zero_param is None:
        return False
    return include_zero_param.lower() in INCLUDE_ZERO_TRUE_VALUES


def _text_or_default(value: Optional[str], default: str = DEFAULT_QUERY_TEXT) -> str:
    return default if value in (None, "") else value


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
        branch_name = _branch_name(request)
        customer_id = _query_text(request, "customer")
        ageing = _query_text(request, "ageing")
        include_zero = _include_zero_flag(request)
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
        branch_name = _branch_name(request)
        customer_id = _query_text(request, "customer")
        ageing = _query_text(request, "ageing")
        include_zero = _include_zero_flag(request)
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

    @action(detail=True, methods=["get"], url_path="movements")
    def movements(self, request, pk=None):
        """GET /outstanding/{id}/movements/ — paginated movement history."""
        view_perm = HasJewelleryPermission(P_ACCOUNTS_VIEW)
        if not view_perm.has_permission(request, self):
            return Response(
                {"detail": "You do not have permission to view outstanding balances."},
                status=status.HTTP_403_FORBIDDEN,
            )

        balance = get_object_or_404(self.get_queryset(), pk=pk)
        raw_filters = {}
        movement_type = request.query_params.get("movement_type")
        date_from = request.query_params.get("from") or request.query_params.get("date_from")
        date_to = request.query_params.get("to") or request.query_params.get("date_to")
        if movement_type:
            raw_filters["movement_type"] = movement_type
        if date_from:
            raw_filters["date_from"] = date_from
        if date_to:
            raw_filters["date_to"] = date_to
        filters = PartyOutstandingMovementsFilterSerializer(data=raw_filters)
        filters.is_valid(raise_exception=True)
        data = filters.validated_data

        queryset = balance.movements.filter(deleted_at__isnull=True).order_by("-txn_date", "-created_at")
        if data.get("movement_type"):
            queryset = queryset.filter(movement_type=data["movement_type"])
        if data.get("date_from"):
            queryset = queryset.filter(txn_date__gte=data["date_from"])
        if data.get("date_to"):
            queryset = queryset.filter(txn_date__lte=data["date_to"])

        page = self.paginate_queryset(queryset)
        serializer = PartyOutstandingMovementSerializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
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
            reference_type=_text_or_default(data.get("reference_type"), DEFAULT_QUERY_TEXT),
            reference_id=_text_or_default(data.get("reference_id"), DEFAULT_QUERY_TEXT),
            notes=_text_or_default(data.get("notes"), DEFAULT_QUERY_TEXT),
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
