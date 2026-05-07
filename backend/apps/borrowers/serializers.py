import secrets
import string

from rest_framework import serializers

from apps.common.constants import RoleChoices
from apps.borrowers.models import Borrower
from apps.users.models import User


class BorrowerSerializer(serializers.ModelSerializer):
    accounts_count = serializers.SerializerMethodField()
    must_reset_password = serializers.SerializerMethodField(read_only=True)
    temporary_password = serializers.SerializerMethodField(read_only=True)
    has_alert = serializers.BooleanField(read_only=True, default=False)
    location_name = serializers.CharField(source="location.name", read_only=True, default=None)

    class Meta:
        model = Borrower
        fields = [
            "id",
            "uuid",
            "name",
            "mobile_number",
            "address",
            "photo",
            "id_type",
            "id_number",
            "guarantor_name",
            "guarantor_mobile",
            "assigned_agent",
            "user",
            "location",
            "location_name",
            "status",
            "accounts_count",
            "has_alert",
            "must_reset_password",
            "temporary_password",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]
        extra_kwargs = {
            "address": {"required": False, "allow_blank": True},
        }

    def get_accounts_count(self, obj):
        return obj.accounts.count()

    def get_must_reset_password(self, obj):
        return bool(getattr(obj.user, "must_reset_password", False))

    def get_temporary_password(self, obj):
        # Return only the one-time generated password in the immediate create response.
        return getattr(obj, "_temporary_password", None)

    def validate_user(self, value):
        request = self.context.get("request")
        tenant = None
        if request and request.user and request.user.is_authenticated:
            if request.user.role == RoleChoices.ADMIN:
                tenant = request.user
            elif request.user.role in (RoleChoices.COLLECTOR, RoleChoices.BORROWER):
                tenant = request.user.tenant

        if value.role != RoleChoices.BORROWER:
            raise serializers.ValidationError("Linked user must have borrower role.")
        if tenant and value.tenant_id and value.tenant_id != tenant.id:
            raise serializers.ValidationError("Borrower user belongs to another tenant.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        tenant = validated_data.get("tenant")
        mobile_number = validated_data["mobile_number"]
        name = validated_data["name"]
        linked_user = validated_data.get("user")

        if not linked_user:
            linked_user = User.objects.filter(mobile_number=mobile_number).first()

            if linked_user:
                if linked_user.role != RoleChoices.BORROWER:
                    raise serializers.ValidationError(
                        {"mobile_number": "A non-borrower user already exists with this mobile number."}
                    )
                if tenant and linked_user.tenant_id and linked_user.tenant_id != tenant.id:
                    raise serializers.ValidationError(
                        {"mobile_number": "Borrower user with this mobile belongs to another tenant."}
                    )
                if tenant and not linked_user.tenant_id:
                    linked_user.tenant = tenant
                    linked_user.save(update_fields=["tenant"])
            else:
                alphabet = string.ascii_letters + string.digits
                auto_password = "".join(secrets.choice(alphabet) for _ in range(12))
                linked_user = User.objects.create_user(
                    mobile_number=mobile_number,
                    password=auto_password,
                    full_name=name,
                    role=RoleChoices.BORROWER,
                    tenant=tenant,
                    created_by=request.user if request and request.user.is_authenticated else None,
                    must_reset_password=True,
                )
                validated_data["_temporary_password"] = auto_password

        validated_data["user"] = linked_user
        temporary_password = validated_data.pop("_temporary_password", None)
        borrower = super().create(validated_data)
        if temporary_password:
            setattr(borrower, "_temporary_password", temporary_password)
        return borrower

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
