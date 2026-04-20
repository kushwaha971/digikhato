from rest_framework import serializers
from .models import Account


class AccountSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source='borrower.name', read_only=True)
    borrower_mobile = serializers.CharField(source='borrower.mobile_number', read_only=True)
    collections_count = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            'id', 'uuid', 'borrower', 'borrower_name', 'borrower_mobile',
            'amount_given', 'daily_interest_rate', 'duration_days',
            'start_date', 'status', 'amount_paid', 'outstanding_amount',
            'collections_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uuid', 'start_date', 'amount_paid', 'outstanding_amount', 'created_at', 'updated_at']

    def get_collections_count(self, obj):
        return obj.daily_collections.count()


class AccountCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'uuid', 'borrower', 'amount_given', 'daily_interest_rate', 'duration_days']
        read_only_fields = ['id', 'uuid']

    def validate_amount_given(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate_daily_interest_rate(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Rate must be between 0 and 100.")
        return value

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        validated_data['outstanding_amount'] = validated_data['amount_given']
        return super().create(validated_data)
