from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from catalog.models import Product, SparePart

from .models import Cart, CartItem

TWO_PLACES = Decimal("0.01")


def _error(message):
    return ValidationError({"detail": message})


def get_or_create_cart(user) -> Cart:
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def cart_items(cart):
    """All lines with the related rows loaded in as few queries as possible."""
    return list(
        cart.items.select_related("product", "spare_part__product").prefetch_related(
            "product__images", "spare_part__product__images"
        )
    )


def item_target(item):
    """The product or spare part this line refers to."""
    return item.product if item.product_id else item.spare_part


def item_is_active(item) -> bool:
    target = item_target(item)
    if item.product_id:
        return target.is_active
    return target.is_active and target.product.is_active


def unit_price(item) -> Decimal:
    return item_target(item).price  # always the current price from the catalog


def totals_for_subtotal(subtotal: Decimal, total_quantity: int) -> dict:
    """GST and total for a subtotal. Prices are exclusive of GST; GST_PERCENT is configurable."""
    percent = Decimal(str(settings.GST_PERCENT))
    tax = (subtotal * percent / Decimal("100")).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return {
        "total_quantity": total_quantity,
        "subtotal": subtotal.quantize(TWO_PLACES),
        "gst_percent": percent,
        "tax_amount": tax,
        "total": (subtotal + tax).quantize(TWO_PLACES),
    }


def calculate_totals(items) -> dict:
    subtotal = sum((unit_price(i) * i.quantity for i in items), Decimal("0"))
    return totals_for_subtotal(subtotal, sum(i.quantity for i in items))


def _check_stock(quantity, stock, label):
    if stock <= 0:
        raise _error(f"{label} is out of stock.")
    if quantity > stock:
        raise _error(f"Only {stock} unit(s) of {label} available.")


@transaction.atomic
def add_item(user, *, product_id=None, spare_part_id=None, quantity=1) -> Cart:
    cart = get_or_create_cart(user)
    if product_id:
        target = Product.objects.filter(pk=product_id, is_active=True).first()
        lookup = {"product": target}
    else:
        target = SparePart.objects.select_related("product").filter(
            pk=spare_part_id, is_active=True, product__is_active=True
        ).first()
        lookup = {"spare_part": target}
    if target is None:
        raise _error("This item is not available.")

    item = CartItem.objects.select_for_update().filter(cart=cart, **lookup).first()
    new_quantity = (item.quantity if item else 0) + quantity
    _check_stock(new_quantity, target.stock, target.name)

    if item:
        item.quantity = new_quantity
        item.save(update_fields=["quantity", "updated_at"])
    else:
        CartItem.objects.create(cart=cart, quantity=new_quantity, **lookup)
    return cart


@transaction.atomic
def update_quantity(item: CartItem, quantity: int) -> Cart:
    target = item_target(item)
    if not item_is_active(item):
        raise _error(f"{target.name} is no longer available. Please remove it.")
    _check_stock(quantity, target.stock, target.name)
    item.quantity = quantity
    item.save(update_fields=["quantity", "updated_at"])
    return item.cart


def remove_item(item: CartItem) -> Cart:
    cart = item.cart
    item.delete()
    return cart


def clear_cart(cart: Cart) -> None:
    cart.items.all().delete()