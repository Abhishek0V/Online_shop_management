from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from cart import services as cart_services
from cart.models import Cart
from catalog.models import Product, SparePart

from .models import Order, OrderItem


def _error(message):
    return ValidationError({"detail": message})


@transaction.atomic
def create_order_from_cart(user, shipping: dict) -> Order:
    """Turn the cart into a PENDING_PAYMENT order and reserve (deduct) the stock.

    Many customers can buy the same product at the same time: the stock rows are
    locked with SELECT ... FOR UPDATE, in a fixed order (products by id, then spare
    parts by id) so two checkouts can never both take the last unit or deadlock.
    """
    release_pending_orders(user)  # an unfinished earlier attempt must not keep stock reserved

    cart = Cart.objects.filter(user=user).first()
    lines = cart_services.cart_items(cart) if cart else []
    if not lines:
        raise _error("Your cart is empty.")

    product_ids = sorted({l.product_id for l in lines if l.product_id})
    part_ids = sorted({l.spare_part_id for l in lines if l.spare_part_id})
    products = {p.pk: p for p in Product.objects.select_for_update().filter(pk__in=product_ids).order_by("pk")}
    parts = {s.pk: s for s in SparePart.objects.select_for_update().filter(pk__in=part_ids).order_by("pk")}
    parent_active = dict(
        Product.objects.filter(pk__in={s.product_id for s in parts.values()}).values_list("pk", "is_active")
    )

    problems, resolved = [], []
    for line in lines:
        target = products.get(line.product_id) if line.product_id else parts.get(line.spare_part_id)
        name = cart_services.item_target(line).name
        usable = target is not None and target.is_active and (
            bool(line.product_id) or parent_active.get(target.product_id, False)
        )
        if not usable:
            problems.append(f"{name} is no longer available.")
        elif target.stock <= 0:
            problems.append(f"{name} is out of stock.")
        elif target.stock < line.quantity:
            problems.append(f"Only {target.stock} unit(s) of {name} available.")
        else:
            resolved.append((line, target))
    if problems:
        raise _error(" ".join(problems))

    subtotal = sum((target.price * line.quantity for line, target in resolved), start=Decimal("0"))
    totals = cart_services.totals_for_subtotal(subtotal, sum(l.quantity for l, _ in resolved))
    order = Order.objects.create(
        user=user, subtotal=totals["subtotal"], gst_percent=totals["gst_percent"],
        tax_amount=totals["tax_amount"], total_amount=totals["total"], **shipping,
    )

    for line, target in resolved:
        is_product = bool(line.product_id)
        OrderItem.objects.create(
            order=order,
            item_type=OrderItem.ItemType.PRODUCT if is_product else OrderItem.ItemType.SPARE_PART,
            product=target if is_product else None,
            spare_part=None if is_product else target,
            item_name=target.name,
            item_code=target.model_code if is_product else target.part_code,
            unit_price=target.price,
            quantity=line.quantity,
            line_total=target.price * line.quantity,
        )
        # F() makes the decrement happen inside the database, never read-modify-write in Python.
        type(target).objects.filter(pk=target.pk).update(stock=F("stock") - line.quantity)
    return order


def release_stock(order: Order) -> None:
    """Give an order's reserved stock back (rows updated in a fixed order)."""
    items = sorted(order.items.all(), key=lambda i: (i.item_type, i.product_id or i.spare_part_id or 0))
    for item in items:
        model, pk = (Product, item.product_id) if item.item_type == OrderItem.ItemType.PRODUCT else (SparePart, item.spare_part_id)
        if pk:
            model.objects.filter(pk=pk).update(stock=F("stock") + item.quantity)


@transaction.atomic
def close_pending_order(order_id: int, new_status: str) -> Order:
    """Fail or cancel a PENDING_PAYMENT order and release its stock. Safe to call twice."""
    order = Order.objects.select_for_update().get(pk=order_id)
    if order.status != Order.Status.PENDING_PAYMENT:
        return order
    release_stock(order)
    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    order.payments.filter(status="created").update(status="failed")  # Payment lives in the payments app
    return order


def release_pending_orders(user) -> None:
    pending = Order.objects.filter(user=user, status=Order.Status.PENDING_PAYMENT).values_list("pk", flat=True)
    for pk in list(pending):
        close_pending_order(pk, Order.Status.CANCELLED)


def mark_paid(order: Order) -> Order:
    order.status = Order.Status.PAID
    order.paid_at = timezone.now()
    order.save(update_fields=["status", "paid_at", "updated_at"])
    return order


def release_stale_pending_orders(minutes: int) -> int:
    """Cancel orders whose payment was never completed. Returns how many were released."""
    cutoff = timezone.now() - timedelta(minutes=minutes)
    stale = list(Order.objects.filter(status=Order.Status.PENDING_PAYMENT, created_at__lt=cutoff).values_list("pk", flat=True))
    for pk in stale:
        close_pending_order(pk, Order.Status.CANCELLED)
    return len(stale)