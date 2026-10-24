from django.conf import settings
from django.db import models
from django.db.models import Q

from catalog.models import Product, SparePart
from common.models import TimeStampedModel


class Cart(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")

    def __str__(self):
        return f"Cart of {self.user}"


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    spare_part = models.ForeignKey(SparePart, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["created_at", "id"]
        constraints = [
            models.CheckConstraint(
                condition=(Q(product__isnull=False) & Q(spare_part__isnull=True))
                | (Q(product__isnull=True) & Q(spare_part__isnull=False)),
                name="cartitem_exactly_one_target",
            ),
            models.CheckConstraint(condition=Q(quantity__gte=1), name="cartitem_quantity_gte_1"),
            models.UniqueConstraint(
                fields=["cart", "product"], condition=Q(product__isnull=False), name="unique_product_per_cart"
            ),
            models.UniqueConstraint(
                fields=["cart", "spare_part"], condition=Q(spare_part__isnull=False), name="unique_spare_part_per_cart"
            ),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product or self.spare_part}"