import uuid as _uuid_lib
from decimal import Decimal

from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import Account
from .serializers import AccountSerializer, AccountCreateSerializer
from apps.common.constants import RoleChoices
from apps.users.views import get_effective_tenant


class AccountViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'borrower']
    search_fields = ['borrower__name', 'borrower__mobile_number']
    ordering_fields = ['created_at', 'amount_given', 'outstanding_amount']
    ordering = ['-created_at']

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
        qs = Account.objects.select_related('borrower', 'created_by')
        if tenant:
            qs = qs.filter(borrower__tenant=tenant)
        if user.role == RoleChoices.BORROWER:
            borrower_profile = getattr(user, 'borrower_profile', None)
            return qs.filter(borrower=borrower_profile) if borrower_profile else qs.none()
        if user.role == RoleChoices.COLLECTOR:
            qs = qs.filter(borrower__assigned_agent=user)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return AccountCreateSerializer
        return AccountSerializer

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            if request.user.role not in (RoleChoices.ADMIN,):
                raise PermissionDenied("Only admins can modify accounts.")

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        qs = self.get_queryset().filter(status='overdue')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = self.get_queryset()
        data = qs.aggregate(
            total_given=Sum('amount_given'),
            total_paid=Sum('amount_paid'),
            total_outstanding=Sum('outstanding_amount'),
        )
        return Response({
            'total_given': data['total_given'] or Decimal('0.00'),
            'total_paid': data['total_paid'] or Decimal('0.00'),
            'total_outstanding': data['total_outstanding'] or Decimal('0.00'),
            'active_count': qs.filter(status='active').count(),
            'closed_count': qs.filter(status='closed').count(),
            'overdue_count': qs.filter(status='overdue').count(),
        })
