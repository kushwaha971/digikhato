from django.db.models import Q
from rest_framework.permissions import BasePermission

from apps.common.constants import JWL_ROLE_PERMISSIONS, ModuleCode
from apps.users.models import UserModuleRole
from apps.users.views import get_effective_tenant


class JewelleryFeatureGuard(BasePermission):
    """Allow access only when the tenant has Jewellery ERP feature enabled."""

    message = "Jewellery ERP is not enabled for this tenant."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False

        tenant = get_effective_tenant(user)
        if not tenant:
            return False

        profile = getattr(tenant, "business_profile", None)
        feature_flags = getattr(profile, "feature_flags", {}) if profile else {}
        return bool(feature_flags.get(ModuleCode.JEWELLERY, False))


class HasJewelleryPermission(BasePermission):
    """Module-role permission check for Jewellery ERP actions."""

    message = "You do not have permission to perform this jewellery action."

    permission_code = ""

    def __init__(self, permission_code: str = ""):
        self.permission_code = permission_code or self.permission_code

    def __call__(self):
        # Lets this class be used as HasJewelleryPermission("code") inside
        # DRF permission_classes lists, matching existing project style.
        return self

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False
        if not self.permission_code:
            return False

        branch_name = (request.headers.get("X-Branch-Name") or user.branch_name or "").strip()
        roles = UserModuleRole.objects.filter(
            user=user,
            module=ModuleCode.JEWELLERY,
            is_active=True,
        ).filter(Q(branch_name=branch_name) | Q(branch_name=""))

        for role in roles:
            if self.permission_code in JWL_ROLE_PERMISSIONS.get(role.role_code, []):
                return True

        return False
