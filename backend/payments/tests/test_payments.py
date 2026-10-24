from decimal import Decimal

from django.urls import reverse
from rest_framework import status

from cart.models import Cart
from orders.models import Order
from orders.tests.base import ShopFlowTestCase, make_user
from payments.models import Payment


class VerifyPaymentTests(ShopFlowTestCase):
    def start(self):
        self.fill_cart()
        return self.checkout()

    def test_valid_payment_marks_order_paid_and_clears_cart(self):
        res = self.pay(self.start(), "pay_ABC")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data["status"], "paid")
        order = Order.objects.get()
        self.assertEqual(order.status, Order.Status.PAID)
        self.assertIsNotNone(order.paid_at)
        payment = Payment.objects.get()
        self.assertEqual((payment.status, payment.razorpay_payment_id), ("captured", "pay_ABC"))
        self.assertEqual(Cart.objects.get(user=self.user).items.count(), 0)
        self.assertEqual(self.stocks(), (3, 2))  # stays deducted

    def test_verify_twice_is_harmless(self):
        checkout = self.start()
        self.pay(checkout)
        res = self.pay(checkout)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(self.stocks(), (3, 2))

    def test_invalid_signature_rejected_and_order_stays_pending(self):
        checkout = self.start()
        self.razorpay.verify_signature.return_value = False
        res = self.pay(checkout)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.get().status, Order.Status.PENDING_PAYMENT)
        self.assertEqual(Payment.objects.get().status, "created")
        self.assertEqual(Cart.objects.get(user=self.user).items.count(), 2)

    def test_cannot_verify_another_customers_payment(self):
        checkout = self.start()
        self.client.force_authenticate(make_user("other@example.com"))
        self.assertEqual(self.pay(checkout).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.get().status, Order.Status.PENDING_PAYMENT)

    def test_unknown_razorpay_order_rejected(self):
        res = self.client.post(
            reverse("payment-verify"),
            {"razorpay_order_id": "order_x", "razorpay_payment_id": "p", "razorpay_signature": "s"}, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_fields_rejected(self):
        res = self.client.post(reverse("payment-verify"), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_paid_order_keeps_old_prices(self):
        self.pay(self.start())
        self.product.price = Decimal("1000")
        self.product.save()
        item = Order.objects.get().items.get(item_type="product")
        self.assertEqual(str(item.unit_price), "2699.00")


class FailedPaymentTests(ShopFlowTestCase):
    def test_failed_payment_releases_stock(self):
        self.fill_cart()
        checkout = self.checkout()
        self.assertEqual(self.stocks(), (3, 2))
        res = self.client.post(reverse("payment-failed"), {"razorpay_order_id": checkout.data["razorpay_order_id"]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "failed")
        self.assertEqual(self.stocks(), (5, 3))
        self.assertEqual(Payment.objects.get().status, "failed")

    def test_reporting_failure_twice_does_not_double_release(self):
        self.fill_cart()
        checkout = self.checkout()
        body = {"razorpay_order_id": checkout.data["razorpay_order_id"]}
        self.client.post(reverse("payment-failed"), body, format="json")
        self.client.post(reverse("payment-failed"), body, format="json")
        self.assertEqual(self.stocks(), (5, 3))

    def test_failed_call_cannot_cancel_a_paid_order(self):
        self.fill_cart()
        checkout = self.checkout()
        self.pay(checkout)
        res = self.client.post(reverse("payment-failed"), {"razorpay_order_id": checkout.data["razorpay_order_id"]}, format="json")
        self.assertEqual(res.data["status"], "paid")
        self.assertEqual(self.stocks(), (3, 2))

    def test_payment_after_order_was_released_is_flagged(self):
        self.fill_cart()
        checkout = self.checkout()
        self.client.post(reverse("payment-failed"), {"razorpay_order_id": checkout.data["razorpay_order_id"]}, format="json")
        res = self.pay(checkout, "pay_LATE")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("refund", str(res.data["detail"]))
        self.assertEqual(Payment.objects.get().status, "captured")  # money was received, recorded for refund
        self.assertEqual(Order.objects.get().status, Order.Status.FAILED)
        self.assertEqual(self.stocks(), (5, 3))