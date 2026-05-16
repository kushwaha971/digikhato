import uuid

from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.constants import P_MASTER_EDIT, P_MASTER_VIEW
from apps.jewellery.models.master import Category, Design, Metal, NumberSeries, Purity, TaxSlab
from apps.jewellery.permissions import HasJewelleryPermission, JewelleryFeatureGuard
from apps.jewellery.serializers.master import (
    CategoryTreeSerializer,
    CategoryWriteSerializer,
    DesignSerializer,
    MetalSerializer,
    NumberSeriesSerializer,
    PuritySerializer,
    TaxSlabSerializer,
)
from apps.users.views import get_effective_tenant


class JewelleryTenantScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get_tenant(self):
        return get_effective_tenant(self.request.user)

    def get_queryset(self):
        tenant = self.get_tenant()
        if not tenant:
            return self.queryset.none()
        return self.queryset.filter(tenant=tenant, deleted_at__isnull=True)

    def _branch_name(self):
        return (self.request.headers.get("X-Branch-Name") or self.request.user.branch_name or "").strip()

    @transaction.atomic
    def perform_create(self, serializer):
        tenant = self.get_tenant()
        serializer.save(
            tenant=tenant,
            branch_name=self._branch_name(),
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.updated_by = request.user
        instance.save(update_fields=["deleted_at", "updated_by", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class MetalViewSet(JewelleryTenantScopedViewSet):
    serializer_class = MetalSerializer
    queryset = Metal.objects.select_related("tenant")

    def get_permissions(self):
        base = [IsAuthenticated(), JewelleryFeatureGuard()]
        if self.action in {"create", "update", "partial_update", "destroy"}:
            base.append(HasJewelleryPermission(P_MASTER_EDIT))
        else:
            base.append(HasJewelleryPermission(P_MASTER_VIEW))
        return base

    def get_queryset(self):
        tenant = self.get_tenant()
        if not tenant:
            return self.queryset.none()
        return super().get_queryset().filter(tenant=tenant, deleted_at__isnull=True)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        has_active_purities = Purity.objects.filter(
            tenant=self.get_tenant(),
            metal=instance,
            deleted_at__isnull=True,
        ).exists()
        if has_active_purities:
            raise ValidationError({"detail": "Cannot delete metal while active purities exist for it."})
        return super().destroy(request, *args, **kwargs)


class PurityViewSet(JewelleryTenantScopedViewSet):
    serializer_class = PuritySerializer
    queryset = Purity.objects.select_related("metal", "tenant")
    filterset_fields = ["metal"]

    def get_permissions(self):
        base = [IsAuthenticated(), JewelleryFeatureGuard()]
        if self.action in {"create", "update", "partial_update", "destroy"}:
            base.append(HasJewelleryPermission(P_MASTER_EDIT))
        else:
            base.append(HasJewelleryPermission(P_MASTER_VIEW))
        return base

    def get_queryset(self):
        tenant = self.get_tenant()
        if not tenant:
            return self.queryset.none()

        qs = super().get_queryset().filter(tenant=tenant, deleted_at__isnull=True)
        metal_param = self.request.query_params.get("metal")
        if metal_param:
            try:
                metal_uuid = uuid.UUID(str(metal_param))
            except (TypeError, ValueError, AttributeError):
                qs = qs.filter(metal__code__iexact=metal_param)
            else:
                qs = qs.filter(metal_id=metal_uuid)
        return qs


class CategoryViewSet(JewelleryTenantScopedViewSet):
    queryset = Category.objects.select_related("parent", "tenant")
    filterset_fields = ["parent"]
    search_fields = ["name", "hsn_code"]
    ordering_fields = ["name", "created_at", "updated_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return CategoryTreeSerializer
        return CategoryWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            return qs.filter(parent__isnull=True).order_by("name")
        return qs


class DesignViewSet(JewelleryTenantScopedViewSet):
    queryset = Design.objects.select_related("category", "tenant")
    serializer_class = DesignSerializer
    filterset_fields = ["category"]
    search_fields = ["code", "name"]
    ordering_fields = ["name", "created_at", "updated_at"]


class TaxSlabViewSet(JewelleryTenantScopedViewSet):
    queryset = TaxSlab.objects.select_related("tenant")
    serializer_class = TaxSlabSerializer
    filterset_fields = ["applies_to", "effective_from", "effective_to"]
    ordering_fields = ["effective_from", "effective_to", "created_at"]


class NumberSeriesViewSet(JewelleryTenantScopedViewSet):
    queryset = NumberSeries.objects.select_related("tenant")
    serializer_class = NumberSeriesSerializer
    filterset_fields = ["voucher_type"]
    ordering_fields = ["voucher_type", "created_at", "updated_at"]
