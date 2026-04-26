from rest_framework import viewsets

from apps.common.permissions import IsAdminOrCollector
from apps.locations.models import Location
from apps.locations.serializers import LocationSerializer
from apps.users.views import get_effective_tenant


class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    permission_classes = [IsAdminOrCollector]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at", "updated_at"]

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        qs = Location.objects.prefetch_related("location_borrowers")
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs

    def perform_create(self, serializer):
        tenant = get_effective_tenant(self.request.user)
        serializer.save(tenant=tenant)
