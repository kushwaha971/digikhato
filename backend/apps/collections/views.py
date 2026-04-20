import uuid as _uuid_lib
from datetime import date
from decimal import Decimal

from django.core.cache import cache
from django.db.models import F
from django.shortcuts import get_object_or_404
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.collections.models import Collection, DailyCollection
from apps.collections.serializers import CollectionSerializer, DailyCollectionSerializer
from apps.collections.services import delete_collection
from apps.common.audit import log_action
from apps.common.constants import RoleChoices
from apps.loans.alerts import upcoming_due_loans_queryset
from apps.loans.models import Loan
from apps.loans.serializers import LoanSerializer
from apps.users.views import get_effective_tenant


def _invalidate_dashboard_cache(user, tenant):
    """Bust the 60s dashboard cache for this tenant after a write."""
    tenant_part = tenant.pk if tenant else "none"
    # Wipe all possible agent variants for this tenant
    cache.delete_many([
        f"dashboard_summary:admin:{tenant_part}:all",
        f"dashboard_summary:collector:{tenant_part}:{user.pk}",
    ])


class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = {
        "status": ["exact"],
        "payment_mode": ["exact"],
        "date": ["exact", "gte", "lte"],
        "loan": ["exact"],
        "borrower": ["exact"],
        "sync_status": ["exact"],
        "collected_by": ["exact"],
        "amount_paid": ["exact", "gte", "lte"],
    }
    search_fields = ["borrower__name", "loan__id", "collection_code", "reference_id"]
    ordering_fields = ["date", "updated_at", "amount_paid", "payment_mode"]

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

    def get_queryset(self):
        user = self.request.user
        tenant = get_effective_tenant(user)
        qs = Collection.objects.select_related(
            "loan", "borrower", "collected_by", "borrower__assigned_agent"
        ).order_by("-date", "-updated_at")
        if tenant:
            qs = qs.filter(borrower__tenant=tenant)
        if user.role == RoleChoices.COLLECTOR:
            qs = qs.filter(borrower__assigned_agent_id=user.id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(collected_by=self.request.user)
        tenant = get_effective_tenant(self.request.user)
        _invalidate_dashboard_cache(self.request.user, tenant)
        log_action(self.request, "create_collection", model_name="Collection",
                   object_id=instance.pk, detail=f"Amount: {instance.amount_paid}")

    def perform_update(self, serializer):
        instance = serializer.save()
        tenant = get_effective_tenant(self.request.user)
        _invalidate_dashboard_cache(self.request.user, tenant)
        log_action(self.request, "update_collection", model_name="Collection",
                   object_id=instance.pk, detail=f"Amount: {instance.amount_paid}")

    def perform_destroy(self, instance):
        delete_collection(collection=instance)
        tenant = get_effective_tenant(self.request.user)
        _invalidate_dashboard_cache(self.request.user, tenant)
        log_action(self.request, "delete_collection", model_name="Collection",
                   object_id=instance.pk, detail="Collection deleted")


class TodayDueListView(ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = get_effective_tenant(user)
        qs = Loan.objects.select_related("borrower", "borrower__assigned_agent")
        if tenant:
            qs = qs.filter(borrower__tenant=tenant)
        if user.role == RoleChoices.COLLECTOR:
            qs = qs.filter(borrower__assigned_agent_id=user.id)
        return upcoming_due_loans_queryset(qs, days=0, today=date.today()).order_by("borrower__name")


class DailyCollectionFilter(django_filters.FilterSet):
    account = django_filters.CharFilter(method="filter_account")

    class Meta:
        model = DailyCollection
        fields = ["account", "date"]

    def filter_account(self, queryset, name, value):
        try:
            _uuid_lib.UUID(str(value))
            return queryset.filter(account__uuid=value)
        except (ValueError, AttributeError):
            return queryset.filter(account_id=value)


class DailyCollectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = DailyCollectionFilter
    ordering = ["-date"]

    def get_queryset(self):
        user = self.request.user
        tenant = get_effective_tenant(user)
        qs = DailyCollection.objects.select_related("account__borrower", "collected_by")
        if tenant:
            qs = qs.filter(account__borrower__tenant=tenant)
        if user.role == RoleChoices.BORROWER:
            borrower_profile = getattr(user, "borrower_profile", None)
            return qs.filter(account__borrower=borrower_profile) if borrower_profile else qs.none()
        if user.role == RoleChoices.COLLECTOR:
            qs = qs.filter(account__borrower__assigned_agent=user)
        return qs

    def get_serializer_class(self):
        return DailyCollectionSerializer

    def perform_create(self, serializer):
        instance = serializer.save(collected_by=self.request.user)
        tenant = get_effective_tenant(self.request.user)
        _invalidate_dashboard_cache(self.request.user, tenant)
        log_action(self.request, "create_daily_collection", model_name="DailyCollection",
                   object_id=instance.pk, detail=f"Payment: {instance.payment}")

    def perform_update(self, serializer):
        instance = serializer.save()
        tenant = get_effective_tenant(self.request.user)
        _invalidate_dashboard_cache(self.request.user, tenant)
        log_action(self.request, "update_daily_collection", model_name="DailyCollection",
                   object_id=instance.pk, detail=f"Payment: {instance.payment}")

    def perform_destroy(self, instance):
        instance.delete()
        tenant = get_effective_tenant(self.request.user)
        _invalidate_dashboard_cache(self.request.user, tenant)
        log_action(self.request, "delete_daily_collection", model_name="DailyCollection",
                   object_id=instance.pk, detail="Daily collection deleted")

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        qs = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
