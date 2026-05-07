"""Jewellery gold pledge loan views (Phase B-2.5)."""

from decimal import Decimal

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.jewellery.models.billing import Customer
from apps.jewellery.models.pledge import GoldPledgeLoan, LoanRepayment, LoanScheme
from apps.jewellery.permissions import JewelleryFeatureGuard
from apps.jewellery.serializers.pledge import (
    CreateLoanSerializer,
    CreateRepaymentSerializer,
    GoldPledgeLoanSerializer,
    LoanRepaymentSerializer,
    LoanSchemeSerializer,
)
from apps.jewellery.services.pledge import calc_interest, create_loan, record_repayment
from apps.users.views import get_effective_tenant


class LoanSchemeViewSet(viewsets.ModelViewSet):
    """CRUD for loan schemes, gated by JewelleryFeatureGuard."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]
    serializer_class = LoanSchemeSerializer

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        return LoanScheme.objects.filter(tenant=tenant, deleted_at__isnull=True)

    def perform_create(self, serializer):
        tenant = get_effective_tenant(self.request.user)
        serializer.save(
            tenant=tenant,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.updated_by = self.request.user
        instance.save(update_fields=["deleted_at", "updated_by", "updated_at"])


class GoldPledgeLoanViewSet(viewsets.GenericViewSet):
    """
    List, create, retrieve pledge loans.
    Extra actions:
      POST  /pledge-loans/{id}/repay/
      GET   /pledge-loans/{id}/interest/?days=30
    """

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = GoldPledgeLoan.objects.filter(tenant=tenant, deleted_at__isnull=True)
        loan_status = self.request.query_params.get("status")
        if loan_status:
            qs = qs.filter(status=loan_status)
        return qs.select_related("customer", "scheme").prefetch_related("pledge_items", "repayments")

    def list(self, request):
        qs = self.get_queryset()
        serializer = GoldPledgeLoanSerializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        loan = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = GoldPledgeLoanSerializer(loan)
        return Response(serializer.data)

    def create(self, request):
        serializer = CreateLoanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tenant = get_effective_tenant(request.user)

        try:
            customer = Customer.objects.get(id=data["customer"], tenant=tenant, deleted_at__isnull=True)
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            scheme = LoanScheme.objects.get(id=data["scheme"], tenant=tenant, deleted_at__isnull=True)
        except LoanScheme.DoesNotExist:
            return Response({"detail": "Scheme not found."}, status=status.HTTP_400_BAD_REQUEST)

        branch_name = (request.headers.get("X-Branch-Name") or request.user.branch_name or "").strip()

        # Convert UUIDs in pledge_items to strings for service
        pledge_items_data = []
        for item in data["pledge_items"]:
            pledge_items_data.append({
                "description": item.get("description", ""),
                "metal": str(item["metal"]),
                "purity": str(item["purity"]),
                "gross_wt": item["gross_wt"],
                "net_wt": item["net_wt"],
                "stone_wt": item.get("stone_wt", 0),
                "valuation_rate": item["valuation_rate"],
            })

        loan = create_loan(
            tenant=tenant,
            branch_name=branch_name,
            customer=customer,
            scheme=scheme,
            data={
                "principal": data["principal"],
                "tenure_months": data["tenure_months"],
                "loan_date": data.get("loan_date"),
            },
            pledge_items_data=pledge_items_data,
            created_by=request.user,
        )

        out = GoldPledgeLoanSerializer(loan)
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="repay")
    def repay(self, request, pk=None):
        loan = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = CreateRepaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        repayment, balance_after = record_repayment(
            loan=loan,
            data=serializer.validated_data,
            created_by=request.user,
        )

        out = LoanRepaymentSerializer(repayment)
        return Response({"repayment": out.data, "balance_after": str(balance_after)})

    @action(detail=True, methods=["get"], url_path="interest")
    def interest_preview(self, request, pk=None):
        loan = get_object_or_404(self.get_queryset(), pk=pk)
        days = int(request.query_params.get("days", 30))
        months = Decimal(days) / Decimal("30")

        result = calc_interest(
            principal=loan.principal,
            rate_pct=loan.interest_rate_pct,
            method=loan.interest_method,
            months=months,
            days=days,
        )
        return Response(result)


class LoanRepaymentViewSet(viewsets.GenericViewSet):
    """List and retrieve repayments, filtered by loan."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]
    serializer_class = LoanRepaymentSerializer

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = LoanRepayment.objects.filter(loan__tenant=tenant, deleted_at__isnull=True)
        loan_id = self.request.query_params.get("loan")
        if loan_id:
            qs = qs.filter(loan_id=loan_id)
        return qs

    def list(self, request):
        qs = self.get_queryset()
        serializer = LoanRepaymentSerializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        repayment = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = LoanRepaymentSerializer(repayment)
        return Response(serializer.data)
