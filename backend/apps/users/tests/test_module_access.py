"""Tests for module access: /api/auth/me/ fields + module team-role endpoints."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.common.constants import JwlRoleCode, ModuleCode
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole


def _make_admin(mobile, name="Admin"):
    user = User.objects.create_user(
        mobile_number=mobile,
        password="Test@1234",
        full_name=name,
        role="admin",
        is_active=True,
    )
    BusinessProfile.objects.create(
        owner=user,
        business_name=name,
        feature_flags={"jewellery": True},
    )
    return user


def _make_collector(mobile, tenant, name="Collector"):
    user = User.objects.create_user(
        mobile_number=mobile,
        password="Test@1234",
        full_name=name,
        role="collector",
        is_active=True,
        tenant=tenant,
    )
    return user


def _grant_jwl_role(user, role_code=JwlRoleCode.ADMIN):
    return UserModuleRole.objects.create(
        user=user,
        module=ModuleCode.JEWELLERY,
        role_code=role_code,
        branch_name="",
        granted_by=user,
        is_active=True,
    )


class MeAccessibleModulesTests(APITestCase):
    """GET /api/auth/me/ returns correct accessible_modules, default_module, module_admin."""

    def setUp(self):
        self.admin = _make_admin("9100000001", "Tenant Admin")

    def _me(self, user):
        self.client.force_authenticate(user=user)
        return self.client.get(reverse("me"))

    def test_admin_with_jewellery_flag_gets_jewellery_in_accessible_modules(self):
        response = self._me(self.admin)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(ModuleCode.JEWELLERY, response.data["accessible_modules"])

    def test_admin_has_udhaar_in_accessible_modules(self):
        response = self._me(self.admin)
        self.assertIn(ModuleCode.UDHAAR, response.data["accessible_modules"])

    def test_default_module_is_first_accessible_module(self):
        response = self._me(self.admin)
        accessible = response.data["accessible_modules"]
        self.assertEqual(response.data["default_module"], accessible[0])

    def test_collector_without_jewellery_role_has_no_jewellery_module(self):
        collector = _make_collector("9100000002", self.admin, "No-JWL Collector")
        BusinessProfile.objects.filter(owner=self.admin).update(
            feature_flags={"jewellery": False}
        )
        response = self._me(collector)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(ModuleCode.JEWELLERY, response.data.get("accessible_modules", []))

    def test_user_with_zero_module_roles_gets_empty_accessible_modules(self):
        """User with no module roles and no feature flags gets zero accessible modules."""
        bare_user = User.objects.create_user(
            mobile_number="9100000003",
            password="Test@1234",
            full_name="Bare User",
            role="collector",
            is_active=True,
        )
        response = self._me(bare_user)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        accessible = response.data.get("accessible_modules", [])
        self.assertNotIn(ModuleCode.JEWELLERY, accessible)
        self.assertIsNone(response.data.get("default_module"))

    def test_admin_with_jewellery_role_is_module_admin(self):
        _grant_jwl_role(self.admin, JwlRoleCode.ADMIN)
        response = self._me(self.admin)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        module_admin = response.data.get("module_admin", {})
        jwl_entry = module_admin.get(ModuleCode.JEWELLERY, {})
        self.assertTrue(jwl_entry.get("can_manage_users"))
        self.assertTrue(jwl_entry.get("can_assign_roles"))

    def test_collector_with_jewellery_role_gets_jewellery_accessible(self):
        collector = _make_collector("9100000004", self.admin, "JWL Collector")
        _grant_jwl_role(collector, JwlRoleCode.CASHIER)
        response = self._me(collector)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(ModuleCode.JEWELLERY, response.data["accessible_modules"])


class ModuleTeamRoleListTests(APITestCase):
    """GET /api/users/modules/jewellery/team-roles/ — admin-only, tenant-scoped."""

    def setUp(self):
        self.admin = _make_admin("9200000001", "Tenant Admin")
        _grant_jwl_role(self.admin, JwlRoleCode.ADMIN)
        self.url = reverse("module-team-roles", kwargs={"module": ModuleCode.JEWELLERY})

    def test_admin_can_list_module_team_roles(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_unauthenticated_blocked(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_collector_blocked(self):
        collector = _make_collector("9200000002", self.admin, "Non-Admin Collector")
        self.client.force_authenticate(user=collector)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_module_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("module-team-roles", kwargs={"module": "nonexistent"})
        response = self.client.get(url)
        self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN))

    def test_unsupported_module_loans_returns_400(self):
        """Only jewellery module team-role management is supported in MVP."""
        self.client.force_authenticate(user=self.admin)
        url = reverse("module-team-roles", kwargs={"module": ModuleCode.LOANS})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ModuleTeamRoleAssignTests(APITestCase):
    """POST /api/users/modules/jewellery/team-roles/ — module admin can assign roles."""

    def setUp(self):
        self.admin = _make_admin("9300000001", "Tenant Admin")
        _grant_jwl_role(self.admin, JwlRoleCode.ADMIN)
        self.member = _make_collector("9300000002", self.admin, "Team Member")
        self.url = reverse("module-team-roles", kwargs={"module": ModuleCode.JEWELLERY})

    def test_admin_can_assign_role_to_team_member(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.url,
            {"user_id": self.member.pk, "role_code": JwlRoleCode.CASHIER, "branch_name": ""},
            format="json",
        )
        self.assertIn(response.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK))
        self.assertEqual(response.data["role_code"], JwlRoleCode.CASHIER)

    def test_non_admin_cannot_assign_role(self):
        non_admin = _make_collector("9300000003", self.admin, "Non Admin")
        self.client.force_authenticate(user=non_admin)
        response = self.client.post(
            self.url,
            {"user_id": self.member.pk, "role_code": JwlRoleCode.CASHIER},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_assign_without_user_id_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.url,
            {"role_code": JwlRoleCode.CASHIER},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cross_tenant_user_cannot_be_assigned(self):
        """Admin from another tenant cannot assign roles to users outside their tenant."""
        other_admin = _make_admin("9300000004", "Other Tenant Admin")
        _grant_jwl_role(other_admin, JwlRoleCode.ADMIN)

        self.client.force_authenticate(user=other_admin)
        response = self.client.post(
            self.url,
            {"user_id": self.member.pk, "role_code": JwlRoleCode.CASHIER},
            format="json",
        )
        self.assertIn(response.status_code, (status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN))


class ModuleTeamRoleRevokeTests(APITestCase):
    """DELETE /api/users/modules/jewellery/team-roles/<role_id>/ — module admin revokes."""

    def setUp(self):
        self.admin = _make_admin("9400000001", "Tenant Admin")
        _grant_jwl_role(self.admin, JwlRoleCode.ADMIN)
        self.member = _make_collector("9400000002", self.admin, "Member")
        self.role = _grant_jwl_role(self.member, JwlRoleCode.CASHIER)

    def _url(self, role_id):
        return reverse(
            "module-team-role-detail",
            kwargs={"module": ModuleCode.JEWELLERY, "role_id": role_id},
        )

    def test_admin_can_revoke_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(self._url(self.role.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_non_admin_cannot_revoke_role(self):
        non_admin = _make_collector("9400000003", self.admin, "Non Admin")
        self.client.force_authenticate(user=non_admin)
        response = self.client.delete(self._url(self.role.pk))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
