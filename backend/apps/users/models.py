from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.common.constants import RoleChoices
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
