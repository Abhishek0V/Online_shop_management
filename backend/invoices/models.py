from django.db import models
from django.utils import timezone

from common.models import TimeStampedModel
from orders.models import Order


class Invoice(TimeStampedModel):
    """Invoice record for a paid order.

    The PDF itself is not stored: it is generated on demand from the order's
    snapshot data (names, prices, totals), so it is always identical and never
    sits in a publicly reachable folder.
    """

    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name="invoice")
    invoice_number = models.CharField(max_length=40, unique=True)
    issued_at = models.DateTimeField(default=timezone.now)
    emailed_at = models.DateTimeField(null=True, blank=True)  # empty until the email was sent

    class Meta:
        ordering = ["-issued_at"]

    def __str__(self):
        return self.invoice_number