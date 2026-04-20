from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source="borrower.name", read_only=True)
    loan_code = serializers.CharField(source="loan.loan_code", read_only=True)
    loan_amount = serializers.DecimalField(source="loan.total_amount", max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "loan",
            "loan_code",
            "loan_amount",
            "borrower",
            "borrower_name",
            "type",
            "message",
            "due_date",
            "is_read",
            "is_active",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
