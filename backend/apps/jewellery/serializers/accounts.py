"""Serializers for Accounts & Ledger module (Module 5)."""

from decimal import Decimal

from rest_framework import serializers

from apps.jewellery.models.accounts import Account, Voucher, VoucherEntry


class AccountSerializer(serializers.ModelSerializer):
    parent_id = serializers.UUIDField(source="parent.id", read_only=True, allow_null=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = ["id", "code", "name", "account_type", "parent_id", "is_system", "children"]

    def get_children(self, obj):
        active_children = obj.children.filter(deleted_at__isnull=True).order_by("code")
        return AccountSerializer(active_children, many=True).data


class VoucherEntrySerializer(serializers.ModelSerializer):
    account_id = serializers.UUIDField(source="account.id")
    account_name = serializers.CharField(source="account.name", read_only=True)

    class Meta:
        model = VoucherEntry
        fields = ["id", "account_id", "account_name", "debit", "credit", "narration"]

    def validate(self, data):
        debit = data.get("debit", Decimal("0"))
        credit = data.get("credit", Decimal("0"))
        if debit < 0 or credit < 0:
            raise serializers.ValidationError("Debit and credit must be non-negative.")
        return data


class VoucherSerializer(serializers.ModelSerializer):
    entries = VoucherEntrySerializer(many=True)

    class Meta:
        model = Voucher
        fields = [
            "id", "voucher_no", "voucher_date", "voucher_type",
            "narration", "total_amount", "status", "entries",
        ]
        read_only_fields = ["id", "status"]

    def create(self, validated_data):
        entries_data = validated_data.pop("entries", [])
        voucher = Voucher.objects.create(**validated_data)
        tenant = validated_data.get("tenant") or voucher.tenant
        created_by = self.context["request"].user

        for entry_data in entries_data:
            account_data = entry_data.pop("account")
            account = Account.objects.get(id=account_data["id"], tenant=tenant, deleted_at__isnull=True)
            VoucherEntry.objects.create(
                voucher=voucher,
                account=account,
                tenant=tenant,
                branch_name=voucher.branch_name,
                created_by=created_by,
                updated_by=created_by,
                **entry_data,
            )
        return voucher


class TrialBalanceRowSerializer(serializers.Serializer):
    account_id = serializers.UUIDField()
    account_code = serializers.CharField()
    account_name = serializers.CharField()
    debit_total = serializers.DecimalField(max_digits=18, decimal_places=2)
    credit_total = serializers.DecimalField(max_digits=18, decimal_places=2)
    balance = serializers.DecimalField(max_digits=18, decimal_places=2)
