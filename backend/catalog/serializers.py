from rest_framework import serializers

from . import services
from .models import Product, ProductImage, SparePart
from .validators import image_extension_validator, validate_image_size


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "is_primary", "sort_order"]
        read_only_fields = fields


class SparePartSerializer(serializers.ModelSerializer):
    """Read-only shape shown to customers."""

    class Meta:
        model = SparePart
        fields = ["id", "name", "part_code", "description", "price", "stock", "image"]
        read_only_fields = fields


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = ["id", "slug", "name", "brand", "model_code", "mrp", "price", "discount_amount", "stock", "primary_image"]

    def get_primary_image(self, obj):
        images = list(obj.images.all())  # prefetched, ordered primary-first
        if not images:
            return None
        request = self.context.get("request")
        url = images[0].image.url
        return request.build_absolute_uri(url) if request else url


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    spare_parts = SparePartSerializer(source="active_spare_parts", many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ["description", "images", "spare_parts"]


# ---------------- Admin ----------------

class AdminSparePartSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        required=False,
        allow_null=True,
        validators=[image_extension_validator, validate_image_size],
    )

    class Meta:
        model = SparePart
        fields = ["id", "product", "name", "part_code", "description", "price", "stock", "image", "is_active"]

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            data = data.copy()
        if data.get("image") == "":
            data["image"] = None
        return super().to_internal_value(data)

    def validate(self, attrs):
        product = attrs.get("product", getattr(self.instance, "product", None))
        name = attrs.get("name", getattr(self.instance, "name", None))
        duplicates = SparePart.objects.filter(product=product, name__iexact=name)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError({"name": ["This product already has a spare part with this name."]})
        return attrs


class AdminProductSerializer(serializers.ModelSerializer):
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(validators=[image_extension_validator, validate_image_size]),
        write_only=True, required=False, allow_empty=True,
    )
    primary_index = serializers.IntegerField(write_only=True, required=False, min_value=0)
    images = ProductImageSerializer(many=True, read_only=True)
    spare_parts = AdminSparePartSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "slug", "name", "brand", "model_code", "description", "mrp", "price", "stock",
            "is_active", "images", "spare_parts", "uploaded_images", "primary_index", "created_at",
        ]
        read_only_fields = ["slug", "created_at"]

    def validate(self, attrs):
        mrp = attrs.get("mrp", getattr(self.instance, "mrp", None))
        price = attrs.get("price", getattr(self.instance, "price", None))
        if mrp is not None and price is not None and price > mrp:
            raise serializers.ValidationError({"price": ["Price cannot be greater than MRP."]})

        files = attrs.get("uploaded_images", [])
        if self.instance is None and not files:
            raise serializers.ValidationError({"uploaded_images": ["Upload at least one image."]})
        index = attrs.get("primary_index")
        if index is not None and index >= len(files):
            raise serializers.ValidationError({"primary_index": ["Must point to one of the uploaded images."]})
        return attrs

    def create(self, validated_data):
        files = validated_data.pop("uploaded_images", [])
        index = validated_data.pop("primary_index", None)
        return services.create_product(validated_data, files, index)

    def update(self, instance, validated_data):
        files = validated_data.pop("uploaded_images", [])
        index = validated_data.pop("primary_index", None)
        instance = super().update(instance, validated_data)
        if files:
            services.add_images(instance, files, index)
        return instance