from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.onboarding.models import BusinessProfile
from apps.users.models import User


class JewelleryBootstrapApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            mobile_number="9666600001",
            password="Admin@1234",
            full_name="Jewellery Admin",
            role="admin",
        )
        BusinessProfile.objects.create(
            owner=self.admin,
            business_name="Jewellery Test Tenant",
            feature_flags={"jewellery": True},
        )
        self.client.force_authenticate(user=self.admin)

    def test_bootstrap_endpoint_returns_module_payload(self):
        resp = self.client.get(reverse("jewellery:jwl-system-bootstrap"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["module"], "jewellery")
        self.assertEqual(resp.data["api_namespace"], "/api/jwl/v1/")

    def test_bootstrap_endpoint_denies_when_feature_disabled(self):
        profile = self.admin.business_profile
        profile.feature_flags = {"jewellery": False}
        profile.save(update_fields=["feature_flags"])

        resp = self.client.get(reverse("jewellery:jwl-system-bootstrap"))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
