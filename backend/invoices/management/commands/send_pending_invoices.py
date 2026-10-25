from django.core.management.base import BaseCommand

from invoices.models import Invoice
from invoices.services import send_invoice_email


class Command(BaseCommand):
    help = "Retry sending invoice emails that failed earlier (for example SMTP was down)."

    def handle(self, *args, **options):
        sent = failed = 0
        for invoice in Invoice.objects.filter(emailed_at__isnull=True).select_related("order__user"):
            if send_invoice_email(invoice):
                sent += 1
            else:
                failed += 1
        self.stdout.write(self.style.SUCCESS(f"Sent {sent}, still failing {failed}."))