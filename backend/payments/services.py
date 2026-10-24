import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from cart import services as cart_services
from cart.models import Cart
from orders import services as order_services
from orders.models import Order

from . import razorpay_client
from .models import Payment

logger = logging.getLogger(__name__)


def _error(message):
    return ValidationError({"detail": message})


def start_checkout(user, shipping: dict) -> dict:
    """Create the order (stock reserved) and the matching Razorpay order."""
    order = order_services.create_order_from_cart(user, shipping)
    amount_paise = int((order.total_amount * 100).quantize(Decimal("1")))
    try:
        rp_order = razorpay_client.create_order(amount_paise, receipt=order.order_number)
    except Exception:  # network problem, bad keys, ...
        logger.exception("Razorpay order creation failed for %s", order.order_number)
        order_services.close_pending_order(order.pk, Order.Status.FAILED)  # gives the stock back
        raise _error("We could not start the payment. Please try again.")

    Payment.objects.create(order=order, razorpay_order_id=rp_order["id"], amount=order.total_amount)
    return {
        "order_number": order.order_number,
        "razorpay_order_id": rp_order["id"],
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "amount": amount_paise,  # in paise, as Razorpay expects
        "currency": "INR",
        "total_amount": str(order.total_amount),
        "prefill": {"name": order.ship_name, "email": user.email, "contact": order.ship_phone},
    }


def _own_payment(user, razorpay_order_id):
    payment = Payment.objects.select_related("order").filter(
        razorpay_order_id=razorpay_order_id, order__user=user
    ).first()
    if payment is None:
        raise _error("Payment not found.")
    return payment


def _late_payment_error(payment_id):
    return _error(
        f"Payment {payment_id} was received after the order expired. "
        "Please contact support to get a refund."
    )


def verify_payment(user, *, razorpay_order_id, razorpay_payment_id, razorpay_signature) -> Order:
    """Confirm a Razorpay payment on the server. Calling it twice is harmless."""
    payment = _own_payment(user, razorpay_order_id)
    if not razorpay_client.verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        raise _error("Payment verification failed.")

    late = False
    with transaction.atomic():
        payment = Payment.objects.select_for_update().get(pk=payment.pk)
        order = Order.objects.select_for_update().get(pk=payment.order_id)
        if payment.status == Payment.Status.CAPTURED:
            if order.status != Order.Status.PAID:
                raise _late_payment_error(payment.razorpay_payment_id)
            return order  # repeat call: nothing more to do

        payment.status = Payment.Status.CAPTURED
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.save(update_fields=["status", "razorpay_payment_id", "razorpay_signature", "updated_at"])

        if order.status == Order.Status.PENDING_PAYMENT:
            order_services.mark_paid(order)
            cart = Cart.objects.filter(user=user).first()
            if cart:
                cart_services.clear_cart(cart)
        else:
            late = True  # the order was already released (e.g. cancelled by a newer checkout)

    if late:
        logger.error("Late payment %s for order %s needs a manual refund", razorpay_payment_id, order.order_number)
        raise _late_payment_error(razorpay_payment_id)

    _after_payment(order)
    return order


def report_failed(user, razorpay_order_id) -> Order:
    """The customer closed the Razorpay popup or the payment failed: release the stock."""
    payment = _own_payment(user, razorpay_order_id)
    return order_services.close_pending_order(payment.order_id, Order.Status.FAILED)


def _after_payment(order: Order) -> None:
    """Hook for work that must follow a successful payment (invoice + email, added in the next step)."""