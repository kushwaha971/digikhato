"""Jewellery karigar views (Phase B-2.1)."""

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.jewellery.models.karigar import CustomerOrder, Karigar, KarigarIssue, KarigarReceipt
from apps.jewellery.models.master import Design, Metal
from apps.jewellery.permissions import JewelleryFeatureGuard
from apps.jewellery.serializers.karigar import (
    CreateKarigarIssueSerializer,
    CreateKarigarReceiptSerializer,
    CreateOrderSerializer,
    CustomerOrderSerializer,
    KarigarIssueSerializer,
    KarigarReceiptSerializer,
    KarigarSerializer,
)
from apps.jewellery.services.karigar import (
    advance_order_status,
    create_karigar_issue,
    create_karigar_receipt,
)
from apps.users.views import get_effective_tenant


class KarigarViewSet(viewsets.ModelViewSet):
    """CRUD for karigars (artisans)."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]
    serializer_class = KarigarSerializer

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = Karigar.objects.filter(tenant=tenant, deleted_at__isnull=True)
        active_only = (self.request.query_params.get("active_only") or "").lower()
        if active_only in ("1", "true", "yes"):
            qs = qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        tenant = get_effective_tenant(self.request.user)
        serializer.save(
            tenant=tenant,
            branch_name=self.request.user.branch_name or "",
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.updated_by = self.request.user
        instance.save(update_fields=["deleted_at", "updated_by", "updated_at"])


class CustomerOrderViewSet(viewsets.ModelViewSet):
    """CRUD for customer orders + status advance action."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateOrderSerializer
        return CustomerOrderSerializer

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = CustomerOrder.objects.filter(tenant=tenant, deleted_at__isnull=True)
        karigar_id = self.request.query_params.get("karigar_id")
        if karigar_id:
            qs = qs.filter(issues__karigar_id=karigar_id).distinct()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tenant = get_effective_tenant(request.user)
        from apps.jewellery.models.billing import Customer
        try:
            customer = Customer.objects.get(id=data["customer_id"], tenant=tenant, deleted_at__isnull=True)
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found."}, status=status.HTTP_400_BAD_REQUEST)

        design = None
        if data.get("design_id"):
            try:
                design = Design.objects.get(id=data["design_id"], tenant=tenant, deleted_at__isnull=True)
            except Design.DoesNotExist:
                return Response({"detail": "Design not found."}, status=status.HTTP_400_BAD_REQUEST)

        order = CustomerOrder.objects.create(
            tenant=tenant,
            branch_name=request.user.branch_name or "",
            customer=customer,
            design=design,
            order_date=data["order_date"],
            expected_delivery=data.get("expected_delivery"),
            advance_amount=data.get("advance_amount", 0),
            notes=data.get("notes", ""),
            created_by=request.user,
            updated_by=request.user,
        )
        return Response(CustomerOrderSerializer(order).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.updated_by = self.request.user
        instance.save(update_fields=["deleted_at", "updated_by", "updated_at"])

    @action(detail=True, methods=["post"], url_path="advance")
    def advance_status(self, request, pk=None):
        """POST /orders/{id}/advance/ with {"status": "METAL_ISSUED"}"""
        order = self.get_object()
        new_status = request.data.get("status")
        if not new_status:
            return Response({"detail": "status is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            advance_order_status(order, new_status)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CustomerOrderSerializer(order).data)


class KarigarIssueViewSet(viewsets.GenericViewSet,
                           viewsets.mixins.ListModelMixin,
                           viewsets.mixins.RetrieveModelMixin,
                           viewsets.mixins.CreateModelMixin):
    """List/create/retrieve karigar metal issues."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateKarigarIssueSerializer
        return KarigarIssueSerializer

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = KarigarIssue.objects.filter(tenant=tenant, deleted_at__isnull=True)
        karigar_id = self.request.query_params.get("karigar_id")
        if karigar_id:
            qs = qs.filter(karigar_id=karigar_id)
        order_id = self.request.query_params.get("order_id")
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateKarigarIssueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tenant = get_effective_tenant(request.user)
        try:
            karigar = Karigar.objects.get(id=data["karigar_id"], tenant=tenant, deleted_at__isnull=True)
        except Karigar.DoesNotExist:
            return Response({"detail": "Karigar not found."}, status=status.HTTP_400_BAD_REQUEST)

        order = None
        if data.get("order_id"):
            try:
                order = CustomerOrder.objects.get(id=data["order_id"], tenant=tenant, deleted_at__isnull=True)
            except CustomerOrder.DoesNotExist:
                return Response({"detail": "Order not found."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            metal = Metal.objects.get(id=data["metal_id"], tenant=tenant, deleted_at__isnull=True)
        except Metal.DoesNotExist:
            return Response({"detail": "Metal not found."}, status=status.HTTP_400_BAD_REQUEST)

        issue_data = {
            "gross_wt_issued": data["gross_wt_issued"],
            "tunch_pct": data["tunch_pct"],
            "metal": metal,
            "date": data.get("date"),
            "items_json": data.get("items_json", []),
            "notes": data.get("notes", ""),
        }
        issue = create_karigar_issue(
            tenant=tenant,
            branch_name=request.user.branch_name or "",
            karigar=karigar,
            order=order,
            data=issue_data,
            created_by=request.user,
        )
        return Response(KarigarIssueSerializer(issue).data, status=status.HTTP_201_CREATED)


class KarigarReceiptViewSet(viewsets.GenericViewSet,
                             viewsets.mixins.ListModelMixin,
                             viewsets.mixins.RetrieveModelMixin,
                             viewsets.mixins.CreateModelMixin):
    """List/create/retrieve karigar receipts."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateKarigarReceiptSerializer
        return KarigarReceiptSerializer

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = KarigarReceipt.objects.filter(tenant=tenant, deleted_at__isnull=True)
        karigar_id = self.request.query_params.get("karigar_id")
        if karigar_id:
            qs = qs.filter(karigar_id=karigar_id)
        issue_id = self.request.query_params.get("issue_id")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateKarigarReceiptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tenant = get_effective_tenant(request.user)
        try:
            issue = KarigarIssue.objects.select_related("karigar").get(
                id=data["issue_id"], tenant=tenant, deleted_at__isnull=True
            )
        except KarigarIssue.DoesNotExist:
            return Response({"detail": "KarigarIssue not found."}, status=status.HTTP_400_BAD_REQUEST)

        receipt, reconcile = create_karigar_receipt(
            tenant=tenant,
            branch_name=request.user.branch_name or "",
            issue=issue,
            data=data,
            created_by=request.user,
        )
        response_data = KarigarReceiptSerializer(receipt).data
        response_data["reconcile"] = {k: str(v) for k, v in reconcile.items()}
        return Response(response_data, status=status.HTTP_201_CREATED)
