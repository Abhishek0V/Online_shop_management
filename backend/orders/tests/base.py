from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import User
from cart import services as cart_services
from catalog.models import Product, SparePart

SHIPPING = {
    "ship_name": "Asha K", "ship_phone": "9876543210", "ship_address_line": "12 MG Road",
    "ship_city": "Palakkad", "ship_state": "Kerala", "ship_pincode": "678001",
}


def make_user(email="cust@example.com", role="customer"):
    return User.objects.create_user(
        email=email, password="Str0ng!Pass#2026", first_name="Asha", phone="9876543210", role=role
    )


@override_settings(GST_PERCENT=18, RAZORPAY_KEY_ID="rzp_test_key", RAZORPAY_KEY_SECRET="secret")
class ShopFlowTestCase(APITestCase):
    """Shared setup: a customer, a product with a spare part, and a mocked Razorpay."""

    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(self.user)
        self.product = Product.objects.create(
            name="Bosch GWS 600", model_code="GWS600", brand="Bosch",
            mrp=Decimal("4150"), price=Decimal("2699"), stock=5,
        )
        self.part = SparePart.objects.create(
            product=self.product, name="Armature (220-240V)", part_code="ARM1", price=Decimal("571"), stock=3
        )
        patcher = patch("payments.services.razorpay_client")
        self.razorpay = patcher.start()
        self.addCleanup(patcher.stop)
        self.razorpay.create_order.side_effect = lambda amount, receipt: {"id": f"order_{receipt}"}
        self.razorpay.verify_signature.return_value = True

    def fill_cart(self, user=None, product_qty=2, part_qty=1):
        user = user or self.user
        if product_qty:
            cart_services.add_item(user, product_id=self.product.pk, quantity=product_qty)
        if part_qty:
            cart_services.add_item(user, spare_part_id=self.part.pk, quantity=part_qty)

    def checkout(self, **overrides):
        return self.client.post(reverse("checkout"), {**SHIPPING, **overrides}, format="json")

    def pay(self, checkout_response, payment_id="pay_TEST1"):
        return self.client.post(
            reverse("payment-verify"),
            {
                "razorpay_order_id": checkout_response.data["razorpay_order_id"],
                "razorpay_payment_id": payment_id,
                "razorpay_signature": "sig",
            },
            format="json",
        )

    def stocks(self):
        self.product.refresh_from_db()
        self.part.refresh_from_db()
        return self.product.stock, self.part.stock