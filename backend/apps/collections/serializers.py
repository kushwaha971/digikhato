from rest_framework import serializers

from apps.common.constants import RoleChoices
from apps.collections.models import Collection, DailyCollection, PaymentMode
from apps.collections.services import create_collection, update_collection
from apps.loans.alerts import derive_payment_status


class CollectionSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            "id",
            "uuid",
            "collection_code",
            "loan",
            "borrower",
            "date",
            "amount_paid",
            "status",
            "payment_mode",
            "reference_id",
            "payment_status",
            "notes",
            "collected_by",
            "gps_lat",
            "gps_lng",
            "sync_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "collection_code", "collected_by", "created_at", "updated_at"]
        extra_kwargs = {
            "status": {"required": False},
            "payment_mode": {"required": True},
            "reference_id": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        loan = attrs.get("loan") or getattr(self.instance, "loan", None)
        borrower = attrs.get("borrower") or getattr(self.instance, "borrower", None)
        user = self.context["request"].user

        if loan and borrower and loan.borrower_id != borrower.id:
            raise serializers.ValidationError("Loan and borrower mismatch")
        if user.role == RoleChoices.COLLECTOR and borrower and borrower.assigned_agent_id != user.id:
            raise serializers.ValidationError("Collector can only collect for assigned borrowers.")
        return attrs

    def create(self, validated_data):
        return create_collection(
            loan_id=validated_data["loan"].id,
            borrower_id=validated_data["borrower"].id,
            amount_paid=validated_data["amount_paid"],
            status=validated_data.get("status"),
            payment_mode=validated_data.get("payment_mode", PaymentMode.CASH),
            reference_id=validated_data.get("reference_id", ""),
            notes=validated_data.get("notes", ""),
            collected_by_id=self.context["request"].user.id,
            date=validated_data["date"],
            gps_lat=validated_data.get("gps_lat"),
            gps_lng=validated_data.get("gps_lng"),
            sync_status=validated_data.get("sync_status", "pending"),
        )

    def update(self, instance, validated_data):
        return update_collection(
            collection=instance,
            amount_paid=validated_data.get("amount_paid", instance.amount_paid),
            status=validated_data.get("status", instance.status),
            payment_mode=validated_data.get("payment_mode", instance.payment_mode),
            reference_id=validated_data.get("reference_id", instance.reference_id),
            notes=validated_data.get("notes", instance.notes),
            date=validated_data.get("date", instance.date),
            gps_lat=validated_data.get("gps_lat", instance.gps_lat),
            gps_lng=validated_data.get("gps_lng", instance.gps_lng),
        )

    def get_payment_status(self, obj):
        return derive_payment_status(total_amount=obj.loan.total_amount, paid_amount=obj.loan.paid_amount)


class DailyCollectionSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source='account.borrower.name', read_only=True)
    borrower_mobile = serializers.CharField(source='account.borrower.mobile_number', read_only=True)

    class Meta:
        model = DailyCollection
        fields = ['id', 'account', 'borrower_name', 'borrower_mobile', 'payment', 'date', 'collected_by', 'created_at']
        read_only_fields = ['id', 'collected_by', 'created_at']

    def create(self, validated_data):
        validated_data['collected_by'] = self.context['request'].user
        return super().create(validated_data)
