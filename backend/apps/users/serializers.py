from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.common.constants import (
    JWL_ROLE_FEATURES,
    JWL_ROLE_PERMISSIONS,
    LOANS_ROLE_FEATURES,
    JwlRoleCode,
    ModuleCode,
    RoleChoices,
)
from apps.users.models import User, UserModuleRole


ROLE_PERMISSIONS = {
    RoleChoices.SUPER_ADMIN: [
        "view:platform",
        "manage:tenants",
        "view:dashboard",
        "view:settings",
    ],
    RoleChoices.ADMIN: [
        "view:dashboard",
        "view:borrowers",
        "view:loans",
        "add:collection",
        "view:settings",
        "view:customer-ledger",
        "view:notes",
        "view:modules",
        "create:loan",
        "add:borrower",
        "edit:borrower",
        "delete:borrower",
        "toggle:borrower-status",
        "edit:loan",
        "delete:loan",
        "edit:collection",
        "delete:collection",
        "view:reports",
        "view:team",
        "manage:team",
    ],
    RoleChoices.COLLECTOR: [
        "view:dashboard",
        "view:borrowers",
        "view:loans",
        "add:collection",
        "view:settings",
        "view:customer-ledger",
        "view:notes",
        "view:modules",
    ],
    RoleChoices.BORROWER: [
        "view:portal",
        "view:settings",
    ],
}


class UserModuleRoleSerializer(serializers.ModelSerializer):
    jwl_permissions = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()

    class Meta:
        model = UserModuleRole
        fields = [
            "id",
            "module",
            "role_code",
            "branch_name",
            "is_active",
            "expires_at",
            "jwl_permissions",
            "features",
            "granted_by",
        ]
        read_only_fields = ["id", "granted_by", "jwl_permissions", "features"]

    def get_jwl_permissions(self, obj):
        return JWL_ROLE_PERMISSIONS.get(obj.role_code, [])

    def get_features(self, obj):
        if obj.module == ModuleCode.JEWELLERY:
            return JWL_ROLE_FEATURES.get(obj.role_code, {})
        return {}


class UserModuleRoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModuleRole
        fields = ["module", "role_code", "branch_name", "expires_at"]

    def validate_module(self, value):
        if value not in ModuleCode.values:
            raise serializers.ValidationError(f"Invalid module. Choices: {ModuleCode.values}")
        return value

    def validate_role_code(self, value):
        if value not in JwlRoleCode.values:
            raise serializers.ValidationError(f"Invalid role. Choices: {JwlRoleCode.values}")
        return value

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("expires_at must be in the future.")
        return value


class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    capabilities = serializers.SerializerMethodField()
    module_roles = serializers.SerializerMethodField()
    feature_flags = serializers.SerializerMethodField()
    accessible_modules = serializers.SerializerMethodField()
    default_module = serializers.SerializerMethodField()
    module_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "mobile_number",
            "full_name",
            "role",
            "branch_name",
            "theme_preference",
            "onboarding_completed",
            "must_reset_password",
            "is_active",
            "tenant",
            "permissions",
            "capabilities",
            "module_roles",
            "feature_flags",
            "accessible_modules",
            "default_module",
            "module_admin",
        ]

    def get_permissions(self, obj):
        return ROLE_PERMISSIONS.get(obj.role, [])

    def get_capabilities(self, obj):
        return {
            "can_approve_tenants": obj.role == RoleChoices.SUPER_ADMIN,
            "can_manage_tenants": obj.role == RoleChoices.SUPER_ADMIN,
            "can_manage_team": obj.role in (RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN),
        }

    def _resolve_module_roles(self, obj):
        cache_key = f"user_module_roles:{obj.pk}"
        cached = self.context.get(cache_key)
        if cached is not None:
            return cached

        roles = UserModuleRole.objects.filter(
            user=obj,
            is_active=True,
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).select_related()
        serialized = UserModuleRoleSerializer(roles, many=True).data

        # Inject a synthetic loans module role derived from the user's system role.
        # Loans access is governed by user.role (admin/collector/borrower), not by a
        # UserModuleRole record — we surface it here so the frontend treats all modules
        # identically.
        if obj.role != RoleChoices.SUPER_ADMIN:
            loans_features = LOANS_ROLE_FEATURES.get(obj.role, {})
            loans_role = {
                "id": None,
                "module": ModuleCode.LOANS,
                "role_code": obj.role,
                "branch_name": "",
                "is_active": True,
                "jwl_permissions": [],
                "features": loans_features,
                "granted_by": None,
            }
            serialized = [loans_role] + list(serialized)

        self.context[cache_key] = serialized
        return serialized

    def get_module_roles(self, obj):
        return self._resolve_module_roles(obj)

    def get_feature_flags(self, obj):
        # Resolve the tenant root (admin user) whose BusinessProfile holds the flags.
        tenant_user = obj if obj.role == RoleChoices.ADMIN else obj.tenant
        if not tenant_user:
            return {}
        try:
            return tenant_user.business_profile.feature_flags or {}
        except Exception:
            return {}

    @staticmethod
    def _module_has_access(features: dict) -> bool:
        for access in (features or {}).values():
            if access.get("read") or access.get("write"):
                return True
        return False

    def get_accessible_modules(self, obj):
        if obj.role == RoleChoices.SUPER_ADMIN:
            return list(ModuleCode.values)

        modules = set()
        if obj.role in (RoleChoices.ADMIN, RoleChoices.COLLECTOR):
            modules.add(ModuleCode.UDHAAR)

        for role in self._resolve_module_roles(obj):
            if self._module_has_access(role.get("features", {})):
                modules.add(role.get("module"))

        for module, enabled in (self.get_feature_flags(obj) or {}).items():
            if enabled and module in ModuleCode.values:
                modules.add(module)

        preferred_order = [ModuleCode.UDHAAR, ModuleCode.LOANS, ModuleCode.JEWELLERY]
        ordered = [module for module in preferred_order if module in modules]
        for module in sorted(modules):
            if module not in ordered:
                ordered.append(module)
        return ordered

    def get_default_module(self, obj):
        accessible = self.get_accessible_modules(obj)
        if not accessible:
            return None
        return accessible[0]

    def get_module_admin(self, obj):
        roles = self._resolve_module_roles(obj)
        role_by_module = {role.get("module"): role for role in roles}
        response = {}

        for module in ModuleCode.values:
            role_data = role_by_module.get(module) or {}
            features = role_data.get("features", {})
            can_manage = bool(
                features.get("team", {}).get("write")
                or features.get("users_roles", {}).get("write")
                or features.get("admin", {}).get("write")
            )
            can_self_onboard = obj.role in (RoleChoices.ADMIN, RoleChoices.COLLECTOR)
            if obj.role == RoleChoices.SUPER_ADMIN:
                can_manage = True
                can_self_onboard = False

            response[module] = {
                "can_manage_users": can_manage,
                "can_assign_roles": can_manage,
                "can_self_onboard": can_self_onboard,
            }

        return response


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "mobile_number", "branch_name", "theme_preference", "onboarding_completed"]

    def validate_mobile_number(self, value):
        qs = User.objects.filter(mobile_number=value).exclude(pk=self.instance.pk if self.instance else None)
        if qs.exists():
            raise serializers.ValidationError("This mobile number is already in use.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        password = attrs.get("current_password") or attrs.get("old_password")
        if not password:
            raise serializers.ValidationError({"current_password": "Current password is required."})

        user = self.context["request"].user
        if not user.check_password(password):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})

        attrs["current_password"] = password
        return attrs


class ResetPasswordRequiredSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        current_password = attrs["current_password"]
        new_password = attrs["new_password"]
        confirm = attrs["confirm"]

        if not user.check_password(current_password):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})

        if new_password != confirm:
            raise serializers.ValidationError({"confirm": "Password confirmation does not match."})

        return attrs


class MobileTokenObtainSerializer(TokenObtainPairSerializer):
    username_field = "mobile_number"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove password field — mobile number is the sole identifier
        self.fields.pop("password", None)

    def validate(self, attrs):
        mobile_number = attrs.get("mobile_number", "").strip()
        try:
            user = User.objects.get(mobile_number=mobile_number, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"mobile_number": "No active account found with this mobile number."}
            )
        self.user = user
        return {}

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["name"] = user.full_name
        return token


class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "mobile_number", "role", "branch_name"]
        read_only_fields = ["id"]

    def validate_role(self, value):
        allowed = [RoleChoices.ADMIN, RoleChoices.COLLECTOR, RoleChoices.BORROWER, RoleChoices.SUPER_ADMIN]
        if value not in allowed:
            raise serializers.ValidationError("Invalid role.")

        request = self.context.get("request")
        if value == RoleChoices.SUPER_ADMIN:
            if not request or not request.user.is_authenticated or request.user.role != RoleChoices.SUPER_ADMIN:
                raise serializers.ValidationError("Super admin role cannot be created from public signup.")
        return value

    def create(self, validated_data):
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        password = "".join(secrets.choice(alphabet) for _ in range(16))
        return User.objects.create_user(password=password, must_reset_password=True, **validated_data)
