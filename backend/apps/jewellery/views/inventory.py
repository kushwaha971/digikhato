"""Jewellery inventory viewsets (Phase B-1.3)."""

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.jewellery.models.inventory import Item, StockMovement, StockTake, StockTakeLine, Transfer
from apps.jewellery.serializers.inventory import (
    ItemDetailSerializer,
    ItemListSerializer,
    ItemWriteSerializer,
    StockMovementSerializer,
    StockTakeLineSerializer,
    StockTakeSerializer,
    TransferSerializer,
    TransferWriteSerializer,
)
from apps.jewellery.services.inventory import (
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
        if purity := params.get("purity"):
            qs = qs.filter(purity__code__iexact=purity)
        if design := params.get("design"):
            qs = qs.filter(design_id=design)
        if search := params.get("search"):
            qs = qs.filter(
                sku__icontains=search
            ) | qs.filter(
                barcode__icontains=search
            ) | qs.filter(
                huid__icontains=search
            )
        return qs

    @action(detail=True, methods=["post"], url_path="write-off")
    @transaction.atomic
    def write_off(self, request, pk=None):
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
        try:
            item = scan_item(tenant, code)
        except Item.DoesNotExist:
            return Response({"detail": f"No item found for code: {code}"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ItemDetailSerializer(item, context={"request": request})
        return Response(serializer.data)


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
            status="IN_STOCK",
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
        if stock_take.status != "IN_PROGRESS":
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
        if stock_take.status != "IN_PROGRESS":
            return Response(
                {"detail": "Only IN_PROGRESS stock takes can be completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        complete_stock_take(stock_take)
        serializer = self.get_serializer(stock_take)
        return Response(serializer.data)


class TransferViewSet(JewelleryTenantScopedViewSet):
    queryset = Transfer.objects.prefetch_related("lines__item").select_related("tenant")

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
        return qs

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
        if transfer.status != "REQUESTED":
            return Response(
                {"detail": "Only REQUESTED transfers can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        transfer.status = "APPROVED"
        transfer.approved_by = request.user
        transfer.updated_by = request.user
        transfer.save(update_fields=["status", "approved_by", "updated_by", "updated_at"])
        return Response(TransferSerializer(transfer).data)

    @action(detail=True, methods=["post"], url_path="dispatch")
    def dispatch(self, request, pk=None):
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
        if transfer.status not in ("REQUESTED", "APPROVED"):
            return Response(
                {"detail": "Transfer cannot be rejected in its current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        transfer.status = "REJECTED"
        transfer.updated_by = request.user
        transfer.save(update_fields=["status", "updated_by", "updated_at"])
        return Response(TransferSerializer(transfer).data)
