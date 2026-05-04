from rest_framework import serializers


class JewelleryBootstrapSerializer(serializers.Serializer):
    module = serializers.CharField()
    api_namespace = serializers.CharField()
    feature_enabled = serializers.BooleanField()
    kpis = serializers.DictField()
