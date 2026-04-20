from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.onboarding.models import BusinessProfile
from apps.onboarding.serializers import BusinessProfileSerializer


class BusinessProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = BusinessProfile.objects.get_or_create(owner=self.request.user)
        return profile
