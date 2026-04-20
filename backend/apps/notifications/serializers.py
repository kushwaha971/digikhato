from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    borrower_name = serializers.CharField(source="borrower.name", read_only=True)
    borrower_uuid = serializers.UUIDField(source="borrower.uuid", read_only=True)
    loan_code = serializers.CharField(source="loan.loan_code", read_only=True)
    loan_uuid = serializers.UUIDField(source="loan.uuid", read_only=True)
    loan_amount = serializers.DecimalField(source="loan.total_amount", max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "user_id",
            "role",
            "loan",
            "loan_uuid",
            "loan_code",
            "loan_amount",
            "borrower",
            "borrower_uuid",
            "borrower_name",
            "type",
            "message",
            "redirect_target",
            "due_date",
            "is_read",
            "is_active",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
