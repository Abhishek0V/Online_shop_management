import uuid

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

from accounts.models import phone_validator
from catalog.models import Product, SparePart
from common.models import TimeStampedModel

pincode_validator = RegexValidator(regex=r"^\d{6}$", message="Enter a valid 6-digit pincode.")


def generate_order_number() -> str:
    """Random suffix instead of a counter, so concurrent checkouts can never collide."""
    while True:
        number = f"ORD-{timezone.localdate():%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"
        if not Order.objects.filter(order_number=number).exists():
            return number


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Pending payment"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    order_number = models.CharField(max_length=30, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT, db_index=True)

    # Shipping details are copied onto the order so later profile changes don't alter it.
    ship_name = models.CharField(max_length=100)
    ship_phone = models.CharField(max_length=10, validators=[phone_validator])
    ship_address_line = models.CharField(max_length=255)
    ship_city = models.CharField(max_length=100)
    ship_state = models.CharField(max_length=100)
    ship_pincode = models.CharField(max_length=6, validators=[pincode_validator])

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = generate_order_number()
        super().save(*args, **kwargs)


class OrderItem(TimeStampedModel):
    class ItemType(models.TextChoices):
        PRODUCT = "product", "Product"
        SPARE_PART = "spare_part", "Spare part"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    item_type = models.CharField(max_length=12, choices=ItemType.choices)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    spare_part = models.ForeignKey(SparePart, on_delete=models.SET_NULL, null=True, blank=True)

    # Snapshot: later price or name changes never alter past orders and invoices.
    item_name = models.CharField(max_length=200)
    item_code = models.CharField(max_length=50, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} x {self.item_name}"