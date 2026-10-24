from rest_framework import serializers

from . import services


class AddItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False, min_value=1)
    spare_part_id = serializers.IntegerField(required=False, min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=100, default=1)

    def validate(self, attrs):
        if bool(attrs.get("product_id")) == bool(attrs.get("spare_part_id")):
            raise serializers.ValidationError("Provide exactly one of product_id or spare_part_id.")
        return attrs


class UpdateQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=100)


class CartItemSerializer(serializers.Serializer):
    """Read-only view of one cart line."""

    id = serializers.IntegerField()
    quantity = serializers.IntegerField()
    item_type = serializers.SerializerMethodField()
    item_id = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    subtitle = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()
    available = serializers.SerializerMethodField()

    def get_item_type(self, obj):
        return "product" if obj.product_id else "spare_part"

    def get_item_id(self, obj):
        return services.item_target(obj).pk

    def get_name(self, obj):
        return services.item_target(obj).name

    def get_subtitle(self, obj):
        if obj.product_id:
            return obj.product.model_code
        return f"Spare part for {obj.spare_part.product.name}"

    def get_image(self, obj):
        target = services.item_target(obj)
        image = target.image if obj.spare_part_id and target.image else None
        if image is None:
            product = obj.product if obj.product_id else obj.spare_part.product
            first = next(iter(product.images.all()), None)  # prefetched, primary first
            image = first.image if first else None
        if not image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(image.url) if request else image.url

    def get_unit_price(self, obj):
        return str(services.unit_price(obj))

    def get_line_total(self, obj):
        return str(services.unit_price(obj) * obj.quantity)

    def get_stock(self, obj):
        return services.item_target(obj).stock

    def get_available(self, obj):
        target = services.item_target(obj)
        return services.item_is_active(obj) and 0 < obj.quantity <= target.stock


class CartSerializer(serializers.Serializer):
    """Builds the whole cart response (lines and totals) from a Cart instance."""

    def to_representation(self, cart):
        items = services.cart_items(cart)
        lines = CartItemSerializer(items, many=True, context=self.context).data
        totals = services.calculate_totals(items)
        return {
            "items": lines,
            "total_quantity": totals["total_quantity"],
            "subtotal": str(totals["subtotal"]),
            "gst_percent": str(totals["gst_percent"]),
            "tax_amount": str(totals["tax_amount"]),
            "total": str(totals["total"]),
            "has_issues": any(not line["available"] for line in lines),
        }