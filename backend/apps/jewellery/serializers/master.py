from rest_framework import serializers

from apps.jewellery.models.master import Category, Design, Metal, NumberSeries, Purity, TaxSlab


class MetalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metal
        fields = ["id", "code", "name", "default_unit"]


class PuritySerializer(serializers.ModelSerializer):
    metal_code = serializers.CharField(source="metal.code", read_only=True)

    class Meta:
        model = Purity
        fields = ["id", "metal", "metal_code", "code", "pct"]


class CategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "parent",
            "name",
            "hsn_code",
            "default_making_charge_formula",
            "default_wastage_pct",
            "children",
        ]

    def get_children(self, obj):
        child_qs = obj.children.filter(deleted_at__isnull=True).order_by("name")
        return CategoryTreeSerializer(child_qs, many=True, context=self.context).data


class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "parent",
            "name",
            "hsn_code",
            "default_making_charge_formula",
            "default_wastage_pct",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DesignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Design
        fields = [
            "id",
            "category",
            "code",
            "name",
            "image_urls",
            "default_weight",
            "default_stones",
            "default_labour",
            "bom",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TaxSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxSlab
        fields = [
            "id",
            "name",
            "rate_pct",
            "applies_to",
            "effective_from",
            "effective_to",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class NumberSeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumberSeries
        fields = [
            "id",
            "voucher_type",
            "prefix",
            "next_number",
            "padding",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
