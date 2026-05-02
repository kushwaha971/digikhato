from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.common.constants import JWL_ROLE_PERMISSIONS


class IsAdminOrCollector(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False
        # Borrowers and super_admins cannot access tenant operational data
        return request.user.role in ("admin", "collector")


class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.role == "admin"
        )


class IsAuthenticatedNonBorrowerWrite(BasePermission):
    """Allow authenticated users to read, but block borrower write operations."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.role != "borrower"


class HasModulePermission(BasePermission):
    """Check that the authenticated user holds a jewellery module role that
    carries the given permission code.

    Usage inside a view:
        permission_classes = [IsAuthenticated, HasModulePermission("jwl.billing.create")]
    """

    def __init__(self, permission_code: str, module: str = "jewellery"):
        self.permission_code = permission_code
        self.module = module

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False

        # Lazy import avoids circular dependency at module load time.
        from apps.users.models import UserModuleRole

        from django.db.models import Q  # noqa: PLC0415

        branch = request.headers.get("X-Branch-Name", "")
        roles = UserModuleRole.objects.filter(
            user=user,
            module=self.module,
            is_active=True,
        ).filter(
            # Match explicit branch assignment OR tenant-wide (blank branch)
            Q(branch_name=branch) | Q(branch_name="")
        )

        for role in roles:
            if self.permission_code in JWL_ROLE_PERMISSIONS.get(role.role_code, []):
                return True
        return False
