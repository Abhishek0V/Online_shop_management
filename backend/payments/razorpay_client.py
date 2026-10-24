"""Thin wrapper around the Razorpay SDK. Tests mock this module, never the network."""
import razorpay
from django.conf import settings


def _client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_order(amount_paise: int, receipt: str) -> dict:
    return _client().order.create(
        {"amount": amount_paise, "currency": "INR", "receipt": receipt, "payment_capture": 1}
    )


def verify_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    """True only if Razorpay's HMAC signature matches (proves the payment is genuine)."""
    try:
        _client().utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
        return True
    except razorpay.errors.SignatureVerificationError:
        return False