from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.common.constants import JWL_ROLE_PERMISSIONS, JwlRoleCode, ModuleCode, RoleChoices
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

    class Meta:
        model = UserModuleRole
        fields = ["id", "module", "role_code", "branch_name", "is_active", "jwl_permissions", "granted_by"]
        read_only_fields = ["id", "granted_by", "jwl_permissions"]

    def get_jwl_permissions(self, obj):
        return JWL_ROLE_PERMISSIONS.get(obj.role_code, [])


class UserModuleRoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModuleRole
        fields = ["module", "role_code", "branch_name"]

    def validate_module(self, value):
        if value not in ModuleCode.values:
            raise serializers.ValidationError(f"Invalid module. Choices: {ModuleCode.values}")
        return value

    def validate_role_code(self, value):
        if value not in JwlRoleCode.values:
            raise serializers.ValidationError(f"Invalid role. Choices: {JwlRoleCode.values}")
        return value


class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    capabilities = serializers.SerializerMethodField()
    module_roles = serializers.SerializerMethodField()
    feature_flags = serializers.SerializerMethodField()

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
        ]

    def get_permissions(self, obj):
        return ROLE_PERMISSIONS.get(obj.role, [])

    def get_capabilities(self, obj):
        return {
            "can_approve_tenants": obj.role == RoleChoices.SUPER_ADMIN,
            "can_manage_tenants": obj.role == RoleChoices.SUPER_ADMIN,
            "can_manage_team": obj.role in (RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN),
        }

    def get_module_roles(self, obj):
        roles = UserModuleRole.objects.filter(user=obj, is_active=True).select_related()
        return UserModuleRoleSerializer(roles, many=True).data

    def get_feature_flags(self, obj):
        # Resolve the tenant root (admin user) whose BusinessProfile holds the flags.
        tenant_user = obj if obj.role == RoleChoices.ADMIN else obj.tenant
        if not tenant_user:
            return {}
        try:
            return tenant_user.business_profile.feature_flags or {}
        except Exception:
            return {}


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
