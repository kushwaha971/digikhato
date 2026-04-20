from rest_framework import serializers


class ReportFilterSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    from_date = serializers.DateField(required=False)
    to_date = serializers.DateField(required=False)
    borrower = serializers.IntegerField(required=False)
    agent = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)
    payment_mode = serializers.CharField(required=False)

    def validate(self, attrs):
        from_date = attrs.get("from_date")
        to_date = attrs.get("to_date")
        if from_date and to_date and to_date < from_date:
            raise serializers.ValidationError("to_date must be on or after from_date")
        return attrs
