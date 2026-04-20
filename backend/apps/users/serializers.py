from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.common.constants import RoleChoices
from apps.users.models import User


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
    ],
    RoleChoices.BORROWER: [
        "view:portal",
        "view:settings",
    ],
}


class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    capabilities = serializers.SerializerMethodField()

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
        ]

    def get_permissions(self, obj):
        return ROLE_PERMISSIONS.get(obj.role, [])

    def get_capabilities(self, obj):
        return {
            "can_approve_tenants": obj.role == RoleChoices.SUPER_ADMIN,
            "can_manage_tenants": obj.role == RoleChoices.SUPER_ADMIN,
            "can_manage_team": obj.role in (RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN),
        }


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

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["name"] = user.full_name
        return token


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "full_name", "mobile_number", "password", "role", "branch_name"]
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
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)
