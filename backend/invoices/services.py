import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone

from orders.models import Order

from .models import Invoice
from .pdf import build_invoice_pdf

logger = logging.getLogger(__name__)


def invoice_number_for(order: Order) -> str:
    # Derived from the (unique, random-suffix) order number, so it is concurrency-safe.
    return order.order_number.replace("ORD-", "INV-", 1)


def get_or_create_invoice(order: Order) -> Invoice:
    invoice, _ = Invoice.objects.get_or_create(order=order, defaults={"invoice_number": invoice_number_for(order)})
    return invoice


def send_invoice_email(invoice: Invoice) -> bool:
    """Email the invoice PDF to the customer. Returns True if it was sent."""
    order = invoice.order
    message = EmailMessage(
        subject=f"Your invoice {invoice.invoice_number} (order {order.order_number})",
        body=(
            f"Hi {order.user.first_name},\n\n"
            f"Thank you for your order {order.order_number}. Your payment of Rs. {order.total_amount} "
            f"was received. Your invoice is attached.\n\n{settings.SHOP_NAME}"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[order.user.email],
    )
    message.attach(f"{invoice.invoice_number}.pdf", build_invoice_pdf(invoice), "application/pdf")
    try:
        message.send()
    except Exception:
        logger.exception("Could not email invoice %s", invoice.invoice_number)
        return False
    invoice.emailed_at = timezone.now()
    invoice.save(update_fields=["emailed_at", "updated_at"])
    return True


def issue_invoice(order: Order) -> Invoice:
    """Create the invoice for a paid order and email it. Safe to call more than once."""
    invoice = get_or_create_invoice(order)
    if invoice.emailed_at is None:
        send_invoice_email(invoice)
    return invoice