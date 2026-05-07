"""Jewellery inventory serializers (Phase B-1.3)."""

import re

from rest_framework import serializers

from apps.jewellery.models.inventory import (
    Diamond,
    Item,
    Stone,
    StockMovement,
    StockTake,
    StockTakeLine,
    Transfer,
    TransferLine,
)


class DiamondSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diamond
        fields = ["id", "cut", "color", "clarity", "carat", "certificate_no", "certificate_lab"]
        read_only_fields = ["id"]


class StoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stone
        fields = ["id", "stone_type", "count", "weight_carat", "description"]
        read_only_fields = ["id"]


class ItemListSerializer(serializers.ModelSerializer):
    metal_code = serializers.CharField(source="metal.code", read_only=True)
    purity_code = serializers.CharField(source="purity.code", read_only=True)
    design_name = serializers.CharField(source="design.name", read_only=True)
    category_name = serializers.CharField(source="design.category.name", read_only=True)

    class Meta:
        model = Item
        fields = [
            "id",
            "sku",
            "barcode",
            "huid",
            "hallmark_status",
            "design",
            "design_name",
            "category_name",
            "metal",
            "metal_code",
            "purity",
            "purity_code",
            "gross_wt",
            "net_wt",
            "stone_wt",
            "charge_wt",
            "status",
            "location_bin",
            "branch_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ItemDetailSerializer(serializers.ModelSerializer):
    diamonds = DiamondSerializer(many=True, read_only=True)
    stones = StoneSerializer(many=True, read_only=True)
    metal_code = serializers.CharField(source="metal.code", read_only=True)
    purity_code = serializers.CharField(source="purity.code", read_only=True)
    design_name = serializers.CharField(source="design.name", read_only=True)

    class Meta:
        model = Item
        fields = [
            "id",
            "sku",
            "barcode",
            "huid",
            "hallmark_status",
            "design",
            "design_name",
            "metal",
            "metal_code",
            "purity",
            "purity_code",
            "gross_wt",
            "net_wt",
            "stone_wt",
            "less_wt",
            "charge_wt",
            "status",
            "location_bin",
            "image_urls",
            "cost_price",
            "mrp",
            "branch_name",
            "diamonds",
            "stones",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ItemWriteSerializer(serializers.ModelSerializer):
    diamonds = DiamondSerializer(many=True, required=False)
    stones = StoneSerializer(many=True, required=False)

    class Meta:
        model = Item
        fields = [
            "id",
            "sku",
            "barcode",
            "huid",
            "hallmark_status",
            "design",
            "metal",
            "purity",
            "gross_wt",
            "net_wt",
            "stone_wt",
            "less_wt",
            "charge_wt",
            "location_bin",
            "image_urls",
            "cost_price",
            "mrp",
            "diamonds",
            "stones",
        ]
        read_only_fields = ["id"]

    def validate_huid(self, value):
        huid = (value or "").strip().upper()
        if not huid:
            return ""
        if not re.fullmatch(r"[A-Z0-9]{6}", huid):
            raise serializers.ValidationError("HUID must be 6 uppercase alphanumeric characters.")
        return huid

    def create(self, validated_data):
        diamonds_data = validated_data.pop("diamonds", [])
        stones_data = validated_data.pop("stones", [])
        item = Item.objects.create(**validated_data)
        for d in diamonds_data:
            Diamond.objects.create(
                item=item,
                tenant=item.tenant,
                branch_name=item.branch_name,
                created_by=item.created_by,
                updated_by=item.updated_by,
                **d,
            )
        for s in stones_data:
            Stone.objects.create(
                item=item,
                tenant=item.tenant,
                branch_name=item.branch_name,
                created_by=item.created_by,
                updated_by=item.updated_by,
                **s,
            )
        return item

    def update(self, instance, validated_data):
        validated_data.pop("diamonds", None)
        validated_data.pop("stones", None)
        return super().update(instance, validated_data)


class StockMovementSerializer(serializers.ModelSerializer):
    item_sku = serializers.CharField(source="item.sku", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "item",
            "item_sku",
            "movement_type",
            "reference_type",
            "reference_id",
            "qty",
            "weight",
            "rate",
            "value",
            "ts",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TransferLineSerializer(serializers.ModelSerializer):
    item_sku = serializers.CharField(source="item.sku", read_only=True)
    item_status = serializers.CharField(source="item.status", read_only=True)

    class Meta:
        model = TransferLine
        fields = ["id", "item", "item_sku", "item_status", "qty", "weight"]
        read_only_fields = ["id"]


class TransferSerializer(serializers.ModelSerializer):
    lines = TransferLineSerializer(many=True, read_only=True)

    class Meta:
        model = Transfer
        fields = [
            "id",
            "from_branch",
            "to_branch",
            "status",
            "dispatched_at",
            "received_at",
            "notes",
            "lines",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "dispatched_at", "received_at", "created_at", "updated_at"]


class TransferWriteSerializer(serializers.ModelSerializer):
    lines = TransferLineSerializer(many=True)

    class Meta:
        model = Transfer
        fields = ["id", "from_branch", "to_branch", "notes", "lines"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        transfer = Transfer.objects.create(**validated_data)
        for line in lines_data:
            TransferLine.objects.create(transfer=transfer, **line)
        return transfer


class StockTakeLineSerializer(serializers.ModelSerializer):
    item_sku = serializers.CharField(source="item.sku", read_only=True)

    class Meta:
        model = StockTakeLine
        fields = [
            "id",
            "item",
            "item_sku",
            "system_qty",
            "system_wt",
            "counted_qty",
            "counted_wt",
            "variance",
        ]
        read_only_fields = ["id", "system_qty", "system_wt", "variance"]


class StockTakeSerializer(serializers.ModelSerializer):
    lines = StockTakeLineSerializer(many=True, read_only=True)

    class Meta:
        model = StockTake
        fields = [
            "id",
            "started_at",
            "completed_at",
            "status",
            "conducted_by",
            "notes",
            "lines",
            "branch_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "completed_at", "created_at", "updated_at"]
