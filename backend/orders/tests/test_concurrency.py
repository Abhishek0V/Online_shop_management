import threading
from decimal import Decimal

from django.db import connection
from django.test import TransactionTestCase, override_settings, skipUnlessDBFeature
from rest_framework.exceptions import ValidationError

from cart import services as cart_services
from catalog.models import Product
from orders import services as order_services
from orders.models import Order

from .base import SHIPPING, make_user


@skipUnlessDBFeature("has_select_for_update")
@override_settings(GST_PERCENT=18)
class ConcurrentCheckoutTests(TransactionTestCase):
    """Needs PostgreSQL (SQLite has no row locks)."""

    def test_last_unit_is_sold_only_once(self):
        product = Product.objects.create(
            name="Last One", model_code="L1", brand="B", mrp=Decimal("100"), price=Decimal("90"), stock=1
        )
        users = [make_user(f"buyer{i}@example.com") for i in range(2)]
        for user in users:
            cart_services.add_item(user, product_id=product.pk, quantity=1)

        results, barrier = [], threading.Barrier(2)

        def buy(user):
            try:
                barrier.wait()
                order_services.create_order_from_cart(user, dict(SHIPPING))
                results.append("ok")
            except ValidationError:
                results.append("rejected")
            finally:
                connection.close()

        threads = [threading.Thread(target=buy, args=(u,)) for u in users]
        [t.start() for t in threads]
        [t.join() for t in threads]

        self.assertEqual(sorted(results), ["ok", "rejected"])
        product.refresh_from_db()
        self.assertEqual(product.stock, 0)
        self.assertEqual(Order.objects.count(), 1)