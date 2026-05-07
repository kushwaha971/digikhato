from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.common.constants import JwlRoleCode, ModuleCode, RoleChoices
from apps.common.models import TimeStampedModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, mobile_number, password, **extra_fields):
        if not mobile_number:
            raise ValueError("Mobile number is required")
        user = self.model(mobile_number=mobile_number, username=mobile_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, mobile_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(mobile_number, password, **extra_fields)

    def create_superuser(self, mobile_number, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", RoleChoices.SUPER_ADMIN)
        return self._create_user(mobile_number, password, **extra_fields)


class User(AbstractUser, TimeStampedModel):
    class ThemePreference(models.TextChoices):
        SYSTEM = "system", "System"
        LIGHT = "light", "Light"
        DARK = "dark", "Dark"

    username = models.CharField(max_length=20, unique=True)
    mobile_number = models.CharField(max_length=15, unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.ADMIN)
    full_name = models.CharField(max_length=120)
    branch_name = models.CharField(max_length=120, blank=True)
    theme_preference = models.CharField(max_length=20, choices=ThemePreference.choices, default=ThemePreference.SYSTEM)
    onboarding_completed = models.BooleanField(default=False)
    must_reset_password = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_users",
    )
    # Tenant ownership: null for super_admin and admin (they ARE the tenant root).
    # Collectors and borrowers point to the admin user who owns them.
    tenant = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tenant_users",
    )

    @property
    def effective_tenant(self):
        """Returns the admin User who is the root of this user's tenant."""
        if self.role == RoleChoices.ADMIN:
            return self
        return self.tenant

    USERNAME_FIELD = "mobile_number"

    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self) -> str:
        return f"{self.full_name} ({self.mobile_number})"


class ModuleAccessRequest(TimeStampedModel):
    """Tracks tenant/user requests for module access submitted to super admin."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="module_access_requests",
    )
    module = models.CharField(max_length=50, choices=ModuleCode.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    rejection_reason = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_module_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "module", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} → {self.module} [{self.status}]"


class UserModuleRole(TimeStampedModel):
    """Maps a user to a role within a specific module (and optionally a branch).

    A single user can hold different roles in different modules:
      - User A → Loan Module: admin
      - User A → Jewellery ERP: cashier (branch B only)
    """

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="module_roles",
    )
    module = models.CharField(max_length=50, choices=ModuleCode.choices, db_index=True)
    # For jewellery: one of JwlRoleCode values. For future modules, extend similarly.
    role_code = models.CharField(max_length=50, choices=JwlRoleCode.choices)
    # null = access to all branches within this module for this tenant
    branch_name = models.CharField(max_length=120, blank=True, default="")
    granted_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_module_roles",
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "module", "role_code", "branch_name")
        indexes = [models.Index(fields=["user", "module"])]

    def __str__(self) -> str:
        branch = f" ({self.branch_name})" if self.branch_name else ""
        return f"{self.user} → {self.module}:{self.role_code}{branch}"
