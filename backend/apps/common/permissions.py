from rest_framework.permissions import SAFE_METHODS, BasePermission


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
    """
    Allow authenticated users to read, but block borrower write operations.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.role != "borrower"
