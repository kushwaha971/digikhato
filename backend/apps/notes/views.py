from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.users.views import get_effective_tenant
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["title", "body"]
    ordering_fields = ["updated_at", "pinned"]

    def get_queryset(self):
        tenant = get_effective_tenant(self.request.user)
        if not tenant:
            return Note.objects.none()
        qs = Note.objects.filter(tenant=tenant)
        pinned = self.request.query_params.get("pinned")
        if pinned is not None:
            qs = qs.filter(pinned=pinned.lower() == "true")
        return qs

    def perform_create(self, serializer):
        tenant = get_effective_tenant(self.request.user)
        serializer.save(tenant=tenant)
