from rest_framework import serializers

from .models import LedgerCustomer, LedgerTransaction


class LedgerTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerTransaction
        fields = ["id", "tx_type", "amount", "date", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class LedgerCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerCustomer
        fields = ["id", "name", "mobile", "notes", "credit_total", "payment_total", "balance", "updated_at"]
        read_only_fields = ["id", "credit_total", "payment_total", "balance", "updated_at"]


class LedgerTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerTransaction
        fields = ["id", "tx_type", "amount", "date", "notes"]
        read_only_fields = ["id"]
