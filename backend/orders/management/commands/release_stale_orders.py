from django.conf import settings
from django.core.management.base import BaseCommand

from orders.services import release_stale_pending_orders


class Command(BaseCommand):
    help = "Cancel unpaid orders older than PENDING_ORDER_TIMEOUT_MINUTES and give their stock back."

    def handle(self, *args, **options):
        count = release_stale_pending_orders(settings.PENDING_ORDER_TIMEOUT_MINUTES)
        self.stdout.write(self.style.SUCCESS(f"Released {count} stale order(s)."))