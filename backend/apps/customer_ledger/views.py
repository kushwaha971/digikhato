from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.views import get_effective_tenant
from .models import LedgerCustomer, LedgerTransaction
from .serializers import (
    LedgerCustomerSerializer,
    LedgerTransactionSerializer,
    LedgerTransactionCreateSerializer,
)


class LedgerCustomerViewSet(viewsets.ModelViewSet):
    serializer_class = LedgerCustomerSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "mobile"]
    ordering_fields = ["updated_at", "balance", "name"]

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        if not tenant:
            return LedgerCustomer.objects.none()
        return LedgerCustomer.objects.filter(tenant=tenant).order_by("-updated_at")

    def perform_create(self, serializer):
        tenant = get_effective_tenant(self.request.user)
        serializer.save(tenant=tenant)

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        customer = self.get_object()
        txs = customer.transactions.order_by("-date", "-created_at")
        serializer = LedgerTransactionSerializer(txs, many=True)
        return Response({"count": txs.count(), "results": serializer.data})

    @action(detail=True, methods=["post"])
    def credit(self, request, pk=None):
        customer = self.get_object()
        serializer = LedgerTransactionCreateSerializer(data={**request.data, "tx_type": "credit"})
        serializer.is_valid(raise_exception=True)
        serializer.save(customer=customer)
        customer.recalculate()
        return Response(LedgerCustomerSerializer(customer).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def payment(self, request, pk=None):
        customer = self.get_object()
        serializer = LedgerTransactionCreateSerializer(data={**request.data, "tx_type": "payment"})
        serializer.is_valid(raise_exception=True)
        serializer.save(customer=customer)
        customer.recalculate()
        return Response(LedgerCustomerSerializer(customer).data, status=status.HTTP_201_CREATED)
