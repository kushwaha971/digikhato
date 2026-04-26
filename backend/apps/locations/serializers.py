from rest_framework import serializers

from apps.locations.models import Location


class LocationSerializer(serializers.ModelSerializer):
    borrower_count = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ["id", "uuid", "name", "description", "borrower_count", "created_at", "updated_at"]
        read_only_fields = ["uuid", "created_at", "updated_at"]
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
        }

    def get_borrower_count(self, obj):
        return obj.location_borrowers.count()
