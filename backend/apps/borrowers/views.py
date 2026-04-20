import uuid as _uuid_lib

from django.db.models import BooleanField, Exists, OuterRef, Value
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.borrowers.models import Borrower
from apps.borrowers.serializers import BorrowerSerializer
from apps.common.constants import RoleChoices
from apps.common.permissions import IsAdminOrCollector
from apps.loans.models import Loan
from apps.users.views import get_effective_tenant


class BorrowerViewSet(viewsets.ModelViewSet):
    serializer_class = BorrowerSerializer
    permission_classes = [IsAdminOrCollector]
    search_fields = ["name", "mobile_number", "guarantor_name"]
    filterset_fields = ["status", "assigned_agent"]
    ordering_fields = ["updated_at", "name", "created_at"]

    def get_queryset(self):
        user = self.request.user
        tenant = get_effective_tenant(user)

        alert_subquery = Loan.objects.filter(borrower=OuterRef("pk"), alert_active=True)
        qs = (
            Borrower.objects
            .select_related("assigned_agent", "tenant")
            .annotate(has_alert=Exists(alert_subquery))
            .order_by("-updated_at")
        )

        if tenant:
            qs = qs.filter(tenant=tenant)

        # Collector only sees borrowers assigned to them
        if user.role == RoleChoices.COLLECTOR:
            qs = qs.filter(assigned_agent_id=user.id)

        return qs

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        pk = self.kwargs.get("pk", "")
        try:
            _uuid_lib.UUID(str(pk))
            obj = get_object_or_404(queryset, uuid=pk)
        except (ValueError, AttributeError):
            obj = get_object_or_404(queryset, pk=pk)
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == RoleChoices.COLLECTOR:
            raise PermissionDenied("Collectors cannot create borrowers.")
        tenant = get_effective_tenant(user)
        serializer.save(tenant=tenant)

    def perform_update(self, serializer):
        if self.request.user.role == RoleChoices.COLLECTOR:
            raise PermissionDenied("Collectors cannot edit borrowers.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role == RoleChoices.COLLECTOR:
            raise PermissionDenied("Collectors cannot delete borrowers.")
        instance.delete()
