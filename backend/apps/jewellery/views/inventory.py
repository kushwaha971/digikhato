"""Jewellery inventory viewsets (Phase B-1.3)."""

from datetime import timedelta
from decimal import Decimal
from typing import Optional

from django.db import transaction
from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.constants import P_INVENTORY_WRITEOFF, P_REPORTS_EXPORT
from apps.jewellery.models.inventory import Item, StockMovement, StockTake, StockTakeLine, Transfer, TransferLine
from apps.jewellery.permissions import HasJewelleryPermission
from apps.jewellery.serializers.inventory import (
    ItemDetailSerializer,
    ItemListSerializer,
    ItemWriteSerializer,
    StockMovementSerializer,
    StockTakeLineSerializer,
    StockTakeSerializer,
    TransferRegisterRowSerializer,
    TransferSerializer,
    TransferWriteSerializer,
)
from apps.jewellery.services.inventory import (
    ITEM_STATUS_IN_STOCK,
    STOCK_TAKE_STATUS_IN_PROGRESS,
    TRANSFER_REJECTABLE_STATUSES,
    TRANSFER_STATUS_APPROVED,
    TRANSFER_STATUS_IN_TRANSIT,
    TRANSFER_STATUS_RECEIVED,
    TRANSFER_STATUS_REQUESTED,
    TRANSFER_STATUS_REJECTED,
    complete_stock_take,
    dispatch_transfer,
    receive_transfer,
    scan_item,
    write_off_item,
)
from apps.jewellery.views.master import JewelleryTenantScopedViewSet
from apps.users.views import get_effective_tenant


class ItemViewSet(JewelleryTenantScopedViewSet):
    queryset = Item.objects.select_related("design__category", "metal", "purity", "tenant")
    inventory_writeoff_permission = HasJewelleryPermission(P_INVENTORY_WRITEOFF)

    def get_serializer_class(self):
        if self.action == "list":
            return ItemListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ItemWriteSerializer
        return ItemDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if branch := params.get("branch"):
            qs = qs.filter(branch_name=branch)
        if item_status := params.get("status"):
            qs = qs.filter(status=item_status)
        if purity := params.get("purity") or params.get("purity_code"):
            qs = qs.filter(purity__code__iexact=purity)
        if metal_code := params.get("metal_code"):
            qs = qs.filter(metal__code__iexact=metal_code)
        if hallmark_status := params.get("hallmark_status"):
            qs = qs.filter(hallmark_status=hallmark_status)
        if design := params.get("design"):
            qs = qs.filter(design_id=design)
        if design_name := params.get("design_name"):
            qs = qs.filter(design__name__icontains=design_name)
        if search := params.get("search"):
            qs = qs.filter(
                Q(sku__icontains=search)
                | Q(barcode__icontains=search)
                | Q(huid__icontains=search)
                | Q(design__name__icontains=search)
            )
        return qs

    @action(detail=True, methods=["post"], url_path="write-off")
    @transaction.atomic
    def write_off(self, request, pk=None):
        if not self.inventory_writeoff_permission.has_permission(request, self):
            return Response(
                {"detail": "You do not have inventory write-off permission."},
                status=status.HTTP_403_FORBIDDEN,
            )
        item = self.get_object()
        reason = request.data.get("reason", "")
        try:
            movement = write_off_item(item, reason=reason, performed_by=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StockMovementSerializer(movement)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path=r"scan/(?P<code>[^/.]+)")
    def scan(self, request, code=None):
        tenant = get_effective_tenant(request.user)
        required_status = (request.query_params.get("status") or "").strip()
        try:
            item = scan_item(tenant, code)
        except Item.DoesNotExist:
            return Response({"detail": f"No item found for code: {code}"}, status=status.HTTP_404_NOT_FOUND)
        if required_status and item.status != required_status:
            return Response(
                {"detail": f"Item found but not in required status '{required_status}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ItemDetailSerializer(item, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="purity-summary")
    def purity_summary(self, request):
        params = request.query_params
        qs = self.get_queryset().filter(status=ITEM_STATUS_IN_STOCK)
        if metal_code := params.get("metal_code"):
            qs = qs.filter(metal__code__iexact=metal_code)

        grouped = (
            qs.values("metal__code", "purity__code")
            .annotate(
                item_count=Count("id"),
                gross_wt_total=Sum("gross_wt"),
                net_wt_total=Sum("net_wt"),
                charge_wt_total=Sum("charge_wt"),
            )
            .order_by("metal__code", "purity__code")
        )
        result = [
            {
                "metal_code": row["metal__code"],
                "purity_code": row["purity__code"],
                "item_count": row["item_count"],
                "gross_wt_total": row["gross_wt_total"] or 0,
                "net_wt_total": row["net_wt_total"] or 0,
                "charge_wt_total": row["charge_wt_total"] or 0,
            }
            for row in grouped
        ]
        return Response(result)


class StockMovementViewSet(JewelleryTenantScopedViewSet):
    queryset = StockMovement.objects.select_related("item", "tenant")
    serializer_class = StockMovementSerializer
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        if item_id := self.request.query_params.get("item"):
            qs = qs.filter(item_id=item_id)
        if movement_type := self.request.query_params.get("type"):
            qs = qs.filter(movement_type=movement_type)
        return qs


class StockTakeViewSet(JewelleryTenantScopedViewSet):
    queryset = StockTake.objects.prefetch_related("lines__item").select_related("tenant")
    serializer_class = StockTakeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if branch := self.request.query_params.get("branch"):
            qs = qs.filter(branch_name=branch)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        tenant = self.get_tenant()
        stock_take = serializer.save(
            tenant=tenant,
            branch_name=self._branch_name(),
            created_by=self.request.user,
            updated_by=self.request.user,
            conducted_by=self.request.user,
            started_at=timezone.now(),
        )
        branch = self._branch_name()
        in_stock_items = Item.objects.filter(
            tenant=tenant,
            branch_name=branch,
            status=ITEM_STATUS_IN_STOCK,
            deleted_at__isnull=True,
        )
        lines = [
            StockTakeLine(
                stock_take=stock_take,
                item=item,
                system_qty=1,
                system_wt=item.net_wt,
            )
            for item in in_stock_items
        ]
        StockTakeLine.objects.bulk_create(lines)

    @action(detail=True, methods=["patch"], url_path="lines/(?P<line_id>[^/.]+)")
    @transaction.atomic
    def update_line(self, request, pk=None, line_id=None):
        stock_take = self.get_object()
        if stock_take.status != STOCK_TAKE_STATUS_IN_PROGRESS:
            return Response(
                {"detail": "Stock take is not in progress."}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            line = stock_take.lines.get(id=line_id)
        except StockTakeLine.DoesNotExist:
            return Response({"detail": "Line not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StockTakeLineSerializer(line, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        stock_take = self.get_object()
        if stock_take.status != STOCK_TAKE_STATUS_IN_PROGRESS:
            return Response(
                {"detail": "Only IN_PROGRESS stock takes can be completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        complete_stock_take(stock_take)
        serializer = self.get_serializer(stock_take)
        return Response(serializer.data)


class TransferViewSet(JewelleryTenantScopedViewSet):
    queryset = Transfer.objects.prefetch_related("lines__item").select_related("tenant")
    report_export_permission = HasJewelleryPermission(P_REPORTS_EXPORT)

    def get_serializer_class(self):
        if self.action in ("create",):
            return TransferWriteSerializer
        return TransferSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if transfer_status := self.request.query_params.get("status"):
            qs = qs.filter(status=transfer_status)
        if from_branch := self.request.query_params.get("from_branch"):
            qs = qs.filter(from_branch=from_branch)
        if to_branch := self.request.query_params.get("to_branch"):
            qs = qs.filter(to_branch=to_branch)
        return qs

    @action(detail=False, methods=["get"], url_path="register-report")
    def register_report(self, request):
        export_requested = (request.query_params.get("export") or "").strip().lower() in {"1", "true", "yes"}
        if export_requested and not self.report_export_permission.has_permission(request, self):
            return Response(
                {"detail": "You do not have report export permission."},
                status=status.HTTP_403_FORBIDDEN,
            )

        filtered_qs = super().get_queryset()

        from_branch = (request.query_params.get("from_branch") or "").strip()
        to_branch = (request.query_params.get("to_branch") or "").strip()
        if from_branch and to_branch and from_branch == to_branch:
            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "summary": {
                        "count": 0,
                        "received_count": 0,
                        "in_transit_count": 0,
                        "total_weight": Decimal("0.0000"),
                    },
                    "results": [],
                }
            )
        if from_branch:
            filtered_qs = filtered_qs.filter(from_branch=from_branch)
        if to_branch:
            filtered_qs = filtered_qs.filter(to_branch=to_branch)

        def _safe_parse_date(value: Optional[str]):
            if not value:
                return None
            try:
                return parse_date(value)
            except ValueError:
                return None

        from_date_raw = request.query_params.get("from_date")
        to_date_raw = request.query_params.get("to_date")
        parsed_from = _safe_parse_date(from_date_raw)
        if from_date_raw and parsed_from is None:
            return Response({"detail": "Invalid from_date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        parsed_to = _safe_parse_date(to_date_raw)
        if to_date_raw and parsed_to is None:
            return Response({"detail": "Invalid to_date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        if parsed_from and parsed_to and parsed_from > parsed_to:
            return Response(
                {"detail": "Invalid date range. from_date cannot be greater than to_date."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if parsed_from and parsed_to and (parsed_to - parsed_from) > timedelta(days=92):
            return Response(
                {"detail": "Date range cannot exceed 92 days."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if parsed_from:
            filtered_qs = filtered_qs.filter(created_at__date__gte=parsed_from)
        if parsed_to:
            filtered_qs = filtered_qs.filter(created_at__date__lte=parsed_to)

        valid_statuses = {choice[0] for choice in Transfer.STATUS}
        status_filter = (request.query_params.get("status") or "").strip()
        if status_filter and status_filter != "ALL" and status_filter not in valid_statuses:
            return Response(
                {"detail": "Invalid status. Allowed: ALL or valid transfer status values."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if status_filter and status_filter != "ALL":
            filtered_qs = filtered_qs.filter(status=status_filter)

        summary_counts = filtered_qs.aggregate(
            count=Count("id"),
            received_count=Count("id", filter=Q(status=TRANSFER_STATUS_RECEIVED)),
            in_transit_count=Count("id", filter=Q(status=TRANSFER_STATUS_IN_TRANSIT)),
        )
        summary_weight = (
            TransferLine.objects.filter(transfer__in=filtered_qs)
            .aggregate(
                total_weight=Coalesce(
                    Sum("weight"),
                    Value(Decimal("0.0000")),
                    output_field=DecimalField(max_digits=12, decimal_places=4),
                )
            )
            .get("total_weight")
        )

        report_qs = filtered_qs.annotate(
            line_count=Count("lines", distinct=True),
            total_weight=Coalesce(
                Sum("lines__weight"),
                Value(Decimal("0.0000")),
                output_field=DecimalField(max_digits=12, decimal_places=4),
            ),
        ).order_by("-created_at", "-id")

        page = self.paginate_queryset(report_qs)
        rows = page if page is not None else report_qs
        serializer = TransferRegisterRowSerializer(rows, many=True)

        summary = {
            "count": summary_counts.get("count", 0) or 0,
            "received_count": summary_counts.get("received_count", 0) or 0,
            "in_transit_count": summary_counts.get("in_transit_count", 0) or 0,
            "total_weight": summary_weight or Decimal("0.0000"),
        }

        if page is None:
            return Response({"summary": summary, "results": serializer.data})

        paginator = self.paginator
        return Response(
            {
                "count": paginator.page.paginator.count,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "summary": summary,
                "results": serializer.data,
            }
        )

    @transaction.atomic
    def perform_create(self, serializer):
        tenant = self.get_tenant()
        serializer.save(
            tenant=tenant,
            branch_name=self._branch_name(),
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    @action(detail=True, methods=["post"], url_path="approve")
    @transaction.atomic
    def approve(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != TRANSFER_STATUS_REQUESTED:
            return Response(
                {"detail": "Only REQUESTED transfers can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        transfer.status = TRANSFER_STATUS_APPROVED
        transfer.approved_by = request.user
        transfer.updated_by = request.user
        transfer.save(update_fields=["status", "approved_by", "updated_by", "updated_at"])
        return Response(TransferSerializer(transfer).data)

    @action(detail=True, methods=["post"], url_path="dispatch", url_name="dispatch")
    def dispatch_transfer_action(self, request, pk=None):
        transfer = self.get_object()
        try:
            dispatch_transfer(transfer, dispatched_by=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TransferSerializer(transfer).data)

    @action(detail=True, methods=["post"], url_path="receive")
    def receive(self, request, pk=None):
        transfer = self.get_object()
        try:
            receive_transfer(transfer, received_by=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TransferSerializer(transfer).data)

    @action(detail=True, methods=["post"], url_path="reject")
    @transaction.atomic
    def reject(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status not in TRANSFER_REJECTABLE_STATUSES:
            return Response(
                {"detail": "Transfer cannot be rejected in its current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        transfer.status = TRANSFER_STATUS_REJECTED
        transfer.updated_by = request.user
        transfer.save(update_fields=["status", "updated_by", "updated_at"])
        return Response(TransferSerializer(transfer).data)
