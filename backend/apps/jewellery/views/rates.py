"""Jewellery rate views (Phase B-1.4)."""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets

from apps.jewellery.models.rates import RateHistory, TenantRate
from apps.jewellery.permissions import JewelleryFeatureGuard
from apps.jewellery.serializers.rates import (
    LiveRateSerializer,
    RateHistorySerializer,
    RateOverrideSerializer,
    TenantRateSerializer,
)
from apps.jewellery.services.rates import get_live_rates, record_rate_override
from apps.users.views import get_effective_tenant


class LiveRatesView(APIView):
    """GET /api/jwl/v1/rates/live/ — current rate per metal/purity."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get(self, request):
        tenant = get_effective_tenant(request.user)
        rates = get_live_rates(tenant)
        serializer = LiveRateSerializer(rates, many=True)
        return Response(serializer.data)


class RateHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/jwl/v1/rates/history/ — filterable rate history."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]
    serializer_class = RateHistorySerializer
    queryset = RateHistory.objects.select_related("metal", "purity")

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if metal := params.get("metal"):
            qs = qs.filter(metal__code__iexact=metal)
        if purity := params.get("purity"):
            qs = qs.filter(purity__code__iexact=purity)
        if from_ts := params.get("from"):
            qs = qs.filter(ts__gte=from_ts)
        if to_ts := params.get("to"):
            qs = qs.filter(ts__lte=to_ts)
        return qs.order_by("-ts")


class RateOverrideView(APIView):
    """POST /api/jwl/v1/rates/override/ — set tenant rate override (Admin only)."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def post(self, request):
        serializer = RateOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tenant = get_effective_tenant(request.user)
        tenant_rate = record_rate_override(
            tenant=tenant,
            metal=data["metal"],
            purity=data["purity"],
            buy_rate=data["buy_rate"],
            sell_rate=data["sell_rate"],
            reason=data.get("reason", ""),
            overridden_by=request.user,
        )
        return Response(TenantRateSerializer(tenant_rate).data, status=status.HTTP_200_OK)
