from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q
from django.utils.text import slugify

from common.models import TimeStampedModel

from .validators import image_extension_validator, validate_image_size

MONEY_MIN = MinValueValidator(Decimal("0.01"))
IMAGE_VALIDATORS = [image_extension_validator, validate_image_size]


class Product(TimeStampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    model_code = models.CharField(max_length=50, unique=True)
    brand = models.CharField(max_length=100, db_index=True)
    description = models.TextField(blank=True)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, validators=[MONEY_MIN])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MONEY_MIN])
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(condition=Q(price__lte=F("mrp")), name="product_price_lte_mrp"),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._unique_slug()
        super().save(*args, **kwargs)

    def _unique_slug(self):
        base = slugify(self.name)[:200] or "product"
        slug, n = base, 2
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    @property
    def discount_amount(self):
        return self.mrp - self.price


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/%Y/%m/", validators=IMAGE_VALIDATORS)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-is_primary", "sort_order", "id"]
        constraints = [
            # At most one primary image per product.
            models.UniqueConstraint(
                fields=["product"], condition=Q(is_primary=True), name="one_primary_image_per_product"
            ),
        ]

    def __str__(self):
        return f"{self.product.name} image #{self.pk}"


class SparePart(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="spare_parts")
    name = models.CharField(max_length=200)  # e.g. "Armature (220-240V)"
    part_code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MONEY_MIN])
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="spare_parts/%Y/%m/", blank=True, null=True, validators=IMAGE_VALIDATORS)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["product", "name"], name="unique_spare_part_name_per_product"),
        ]

    def __str__(self):
        return f"{self.name} ({self.product.name})"