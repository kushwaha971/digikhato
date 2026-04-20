from datetime import date
from decimal import Decimal

from rest_framework import serializers

from apps.common.id_generator import generate_document_code
from apps.loans.alerts import derive_payment_status, getLoanAlertStatus, sync_loan_due_fields
from apps.loans.models import Loan, LoanStatus
from apps.loans.services import calculate_loan_amounts, quantize_amount
from apps.users.views import get_effective_tenant


class LoanSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source="borrower.name", read_only=True)
    missed_days = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    days_to_due = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            "id",
            "uuid",
            "loan_code",
            "borrower",
            "borrower_name",
            "principal",
            "interest_rate",
            "interest_type",
            "tenure_days",
            "start_date",
            "due_date",
            "alert_active",
            "notes",
            "total_amount",
            "daily_emi",
            "paid_amount",
            "outstanding_balance",
            "status",
            "payment_status",
            "missed_days",
            "days_to_due",
            "is_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "total_amount",
            "daily_emi",
            "paid_amount",
            "outstanding_balance",
            "alert_active",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "interest_rate": {"required": False, "allow_null": True},
            "tenure_days": {"required": False, "allow_null": True},
            "due_date": {"required": False, "allow_null": True},
            "notes": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        validated_data.setdefault("interest_rate", Decimal("0"))
        validated_data.setdefault("tenure_days", None)
        validated_data.setdefault("notes", "")
        borrower = validated_data["borrower"]
        tenant = borrower.tenant or get_effective_tenant(self.context["request"].user)
        if tenant and not validated_data.get("loan_code"):
            validated_data["loan_code"] = generate_document_code(doc_type="LN", tenant=tenant)
        amounts = calculate_loan_amounts(
            principal=validated_data["principal"],
            interest_rate=validated_data["interest_rate"],
            tenure_days=validated_data["tenure_days"],
        )
        validated_data["total_amount"] = amounts.total_amount
        validated_data["daily_emi"] = amounts.daily_emi
        validated_data["outstanding_balance"] = amounts.outstanding_balance
        loan = super().create(validated_data)
        sync_loan_due_fields(loan)
        self._sync_due_alert_notifications(loan)
        return loan

    def update(self, instance, validated_data):
        for key in ["principal", "interest_rate", "tenure_days", "start_date", "borrower", "interest_type", "notes"]:
            if key in validated_data:
                setattr(instance, key, validated_data[key])
        if "due_date" in validated_data:
            instance.due_date = validated_data["due_date"]
        amounts = calculate_loan_amounts(instance.principal, instance.interest_rate, instance.tenure_days)
        instance.total_amount = amounts.total_amount
        instance.daily_emi = amounts.daily_emi
        instance.outstanding_balance = quantize_amount(max(instance.total_amount - instance.paid_amount, Decimal("0")))
        instance.status = LoanStatus.CLOSED if instance.outstanding_balance <= Decimal("0") else LoanStatus.ACTIVE
        sync_loan_due_fields(instance, persist=False)
        instance.save()
        self._sync_due_alert_notifications(instance)
        return instance

    def get_missed_days(self, obj):
        elapsed_days = max((date.today() - obj.start_date).days + 1, 0)
        expected_paid = min(obj.total_amount, obj.daily_emi * Decimal(elapsed_days))
        shortfall = max(expected_paid - obj.paid_amount, Decimal("0"))
        if obj.daily_emi <= Decimal("0"):
            return 0
        return int(shortfall // obj.daily_emi)

    def get_payment_status(self, obj):
        return derive_payment_status(total_amount=obj.total_amount, paid_amount=obj.paid_amount)

    def get_days_to_due(self, obj):
        return getLoanAlertStatus(obj).days_to_due

    def get_is_overdue(self, obj):
        return getLoanAlertStatus(obj).is_overdue

    @staticmethod
    def _sync_due_alert_notifications(loan):
        try:
            from apps.notifications.services import sync_due_alert_notifications_for_loan
        except Exception:
            return
        sync_due_alert_notifications_for_loan(loan)
