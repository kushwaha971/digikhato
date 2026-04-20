import uuid as _uuid_lib
from datetime import date

from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.common.constants import RoleChoices
from apps.loans.alerts import overdue_loans_queryset, upcoming_due_loans_queryset
from apps.loans.models import Loan
from apps.loans.serializers import LoanSerializer
from apps.users.views import get_effective_tenant


class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "borrower", "borrower__assigned_agent"]
    search_fields = ["borrower__name", "borrower__mobile_number"]
    ordering_fields = ["updated_at", "start_date", "outstanding_balance"]

    def get_queryset(self):
        user = self.request.user
        tenant = get_effective_tenant(user)

        qs = Loan.objects.select_related(
            "borrower", "borrower__assigned_agent", "borrower__tenant"
        ).order_by("-updated_at")

        if tenant:
            qs = qs.filter(borrower__tenant=tenant)

        if user.role == RoleChoices.COLLECTOR:
            qs = qs.filter(borrower__assigned_agent_id=user.id)

        # Borrower sees only their own loans
        if user.role == RoleChoices.BORROWER:
            qs = qs.filter(borrower__user=user)

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
        if self.request.user.role == RoleChoices.COLLECTOR:
            raise PermissionDenied("Collectors cannot create loans.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role == RoleChoices.COLLECTOR:
            raise PermissionDenied("Collectors cannot edit loans.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role == RoleChoices.COLLECTOR:
            raise PermissionDenied("Collectors cannot delete loans.")
        instance.delete()


class OverdueLoanListView(ListAPIView):
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

        return overdue_loans_queryset(qs, today=date.today()).order_by("-updated_at")


class UpcomingDueLoanListView(ListAPIView):
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
        if user.role == RoleChoices.BORROWER:
            qs = qs.filter(borrower__user=user)

        window_days = int(self.request.query_params.get("days", "5"))
        window_days = max(1, min(window_days, 30))
        return upcoming_due_loans_queryset(qs, days=window_days, today=date.today()).order_by("due_date", "borrower__name")
