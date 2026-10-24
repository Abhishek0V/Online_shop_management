from datetime import timedelta

from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from cart.models import Cart
from orders.models import Order

from .base import ShopFlowTestCase, make_user


class CheckoutTests(ShopFlowTestCase):
    def test_checkout_creates_pending_order_and_reserves_stock(self):
        self.fill_cart()  # 2 x 2699 + 1 x 571 = 5969
        res = self.checkout()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

        order = Order.objects.get()
        self.assertEqual(order.status, Order.Status.PENDING_PAYMENT)
        self.assertEqual(str(order.subtotal), "5969.00")
        self.assertEqual(str(order.tax_amount), "1074.42")
        self.assertEqual(str(order.total_amount), "7043.42")
        self.assertEqual(order.items.count(), 2)
        self.assertEqual(self.stocks(), (3, 2))  # reserved immediately

        self.assertEqual(res.data["amount"], 704342)  # paise
        self.assertEqual(res.data["razorpay_key_id"], "rzp_test_key")
        self.assertEqual(res.data["razorpay_order_id"], f"order_{order.order_number}")
        self.assertEqual(order.payments.get().status, "created")

    def test_order_items_are_snapshots(self):
        self.fill_cart()
        self.checkout()
        item = Order.objects.get().items.get(item_type="spare_part")
        self.assertEqual((item.item_name, item.item_code, str(item.unit_price)), ("Armature (220-240V)", "ARM1", "571.00"))

    def test_cart_is_not_cleared_until_payment(self):
        self.fill_cart()
        self.checkout()
        self.assertEqual(Cart.objects.get(user=self.user).items.count(), 2)

    def test_empty_cart_rejected(self):
        res = self.checkout()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_invalid_shipping_rejected(self):
        self.fill_cart()
        res = self.checkout(ship_pincode="12")
        self.assertIn("ship_pincode", res.data)
        res = self.checkout(ship_phone="123")
        self.assertIn("ship_phone", res.data)
        self.assertEqual(Order.objects.count(), 0)

    def test_missing_shipping_fields_rejected(self):
        self.fill_cart()
        res = self.client.post(reverse("checkout"), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ship_name", res.data)

    def test_insufficient_stock_rejected_and_nothing_changes(self):
        self.fill_cart()
        self.product.stock = 1
        self.product.save()
        res = self.checkout()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only 1", str(res.data["detail"]))
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(self.stocks(), (1, 3))

    def test_hidden_product_rejected(self):
        self.fill_cart()
        self.product.is_active = False
        self.product.save()
        res = self.checkout()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_razorpay_failure_fails_order_and_restores_stock(self):
        self.fill_cart()
        self.razorpay.create_order.side_effect = Exception("gateway down")
        res = self.checkout()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.get().status, Order.Status.FAILED)
        self.assertEqual(self.stocks(), (5, 3))

    def test_new_checkout_cancels_previous_pending_order(self):
        self.fill_cart()
        self.checkout()
        self.checkout()
        statuses = sorted(Order.objects.values_list("status", flat=True))
        self.assertEqual(statuses, ["cancelled", "pending_payment"])
        self.assertEqual(self.stocks(), (3, 2))  # reserved once, not twice

    def test_admin_and_anonymous_cannot_checkout(self):
        self.client.force_authenticate(make_user("admin@example.com", "admin"))
        self.assertEqual(self.checkout().status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(None)
        self.assertEqual(self.checkout().status_code, status.HTTP_401_UNAUTHORIZED)

    def test_stale_pending_orders_are_released_by_command(self):
        self.fill_cart()
        self.checkout()
        Order.objects.update(created_at=timezone.now() - timedelta(hours=2))
        call_command("release_stale_orders")
        self.assertEqual(Order.objects.get().status, Order.Status.CANCELLED)
        self.assertEqual(self.stocks(), (5, 3))


class OrderApiTests(ShopFlowTestCase):
    def paid_order(self, user=None, payment_id="pay_1"):
        user = user or self.user
        self.client.force_authenticate(user)
        self.fill_cart(user=user, product_qty=1, part_qty=0)
        res = self.checkout()
        self.pay(res, payment_id)
        return Order.objects.get(order_number=res.data["order_number"])

    def test_customer_lists_only_own_non_pending_orders(self):
        mine = self.paid_order()
        self.fill_cart(product_qty=1, part_qty=0)
        self.checkout()  # pending, hidden
        other = self.paid_order(make_user("other@example.com"), "pay_2")
        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("my-order-list"))
        self.assertEqual([o["order_number"] for o in res.data["results"]], [mine.order_number])
        self.assertNotIn(other.order_number, str(res.data))

    def test_customer_sees_order_detail_but_not_others(self):
        order = self.paid_order()
        res = self.client.get(reverse("my-order-detail", args=[order.order_number]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["items"]), 1)
        other = self.paid_order(make_user("other@example.com"), "pay_2")
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(reverse("my-order-detail", args=[other.order_number])).status_code, 404)

    def test_admin_sees_all_orders_with_filters(self):
        a = self.paid_order()
        b = self.paid_order(make_user("other@example.com"), "pay_2")
        self.client.force_authenticate(make_user("admin@example.com", "admin"))
        res = self.client.get(reverse("admin-order-list"))
        self.assertEqual(res.data["count"], 2)
        res = self.client.get(reverse("admin-order-list"), {"search": "other@example.com"})
        self.assertEqual([o["order_number"] for o in res.data["results"]], [b.order_number])
        res = self.client.get(reverse("admin-order-list"), {"status": "failed"})
        self.assertEqual(res.data["count"], 0)
        detail = self.client.get(reverse("admin-order-detail", args=[a.order_number]))
        self.assertEqual(detail.data["customer_email"], "cust@example.com")
        self.assertIn("ship_city", detail.data)

    def test_customer_cannot_use_admin_endpoints(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(reverse("admin-order-list")).status_code, status.HTTP_403_FORBIDDEN)