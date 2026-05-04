from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jewellery.permissions import JewelleryFeatureGuard


class JewelleryBootstrapView(APIView):
    """Bootstrap endpoint for end-to-end Jewellery module handshake."""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard]

    def get(self, request):
        return Response(
            {
                "module": "jewellery",
                "api_namespace": "/api/jwl/v1/",
                "feature_enabled": True,
                "kpis": {
                    "today_sales": "0.00",
                    "active_items": 0,
                    "open_transfers": 0,
                    "pending_orders": 0,
                },
            }
        )
