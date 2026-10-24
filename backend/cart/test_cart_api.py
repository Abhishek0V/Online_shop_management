from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from cart.models import Cart, CartItem
from catalog.models import Product, SparePart


@override_settings(GST_PERCENT=18)
class CartTestBase(APITestCase):
    def make_user(self, email="cust@example.com", role="customer"):
        return User.objects.create_user(
            email=email, password="Str0ng!Pass#2026", first_name="T", phone="9876543210", role=role
        )

    def setUp(self):
        self.customer = self.make_user()
        self.client.force_authenticate(self.customer)
        self.product = Product.objects.create(
            name="Bosch GWS 600", model_code="GWS600", brand="Bosch",
            mrp=Decimal("4150"), price=Decimal("2699"), stock=5,
        )
        self.part = SparePart.objects.create(
            product=self.product, name="Armature (220-240V)", price=Decimal("571"), stock=3
        )

    def add(self, **payload):
        return self.client.post(reverse("cart-item-add"), payload, format="json")


class PermissionTests(CartTestBase):
    def test_anonymous_gets_401(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(reverse("cart")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_gets_403(self):
        self.client.force_authenticate(self.make_user("admin@example.com", "admin"))
        self.assertEqual(self.client.get(reverse("cart")).status_code, status.HTTP_403_FORBIDDEN)

    def test_new_customer_has_empty_cart(self):
        res = self.client.get(reverse("cart"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["items"], [])
        self.assertEqual(res.data["total"], "0.00")


class AddItemTests(CartTestBase):
    def test_add_product(self):
        res = self.add(product_id=self.product.pk, quantity=2)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        line = res.data["items"][0]
        self.assertEqual((line["item_type"], line["quantity"], line["unit_price"]), ("product", 2, "2699.00"))

    def test_add_spare_part(self):
        res = self.add(spare_part_id=self.part.pk)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        line = res.data["items"][0]
        self.assertEqual(line["item_type"], "spare_part")
        self.assertIn("Bosch GWS 600", line["subtitle"])

    def test_adding_same_item_increases_quantity(self):
        self.add(product_id=self.product.pk, quantity=2)
        res = self.add(product_id=self.product.pk, quantity=1)
        self.assertEqual(len(res.data["items"]), 1)
        self.assertEqual(res.data["items"][0]["quantity"], 3)

    def test_quantity_over_stock_rejected(self):
        res = self.add(product_id=self.product.pk, quantity=6)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only 5", str(res.data["detail"]))
        self.assertEqual(CartItem.objects.count(), 0)

    def test_accumulated_quantity_over_stock_rejected(self):
        self.add(product_id=self.product.pk, quantity=4)
        res = self.add(product_id=self.product.pk, quantity=2)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CartItem.objects.get().quantity, 4)

    def test_out_of_stock_rejected(self):
        self.product.stock = 0
        self.product.save()
        self.assertEqual(self.add(product_id=self.product.pk).status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_product_and_part_rejected(self):
        self.product.is_active = False
        self.product.save()
        self.assertEqual(self.add(product_id=self.product.pk).status_code, status.HTTP_400_BAD_REQUEST)
        # a spare part of a hidden product is hidden too
        self.assertEqual(self.add(spare_part_id=self.part.pk).status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_item_rejected(self):
        self.assertEqual(self.add(product_id=9999).status_code, status.HTTP_400_BAD_REQUEST)

    def test_must_send_exactly_one_target(self):
        self.assertEqual(self.add(quantity=1).status_code, status.HTTP_400_BAD_REQUEST)
        res = self.add(product_id=self.product.pk, spare_part_id=self.part.pk)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_zero_quantity_rejected(self):
        self.assertEqual(self.add(product_id=self.product.pk, quantity=0).status_code, status.HTTP_400_BAD_REQUEST)


class UpdateAndRemoveTests(CartTestBase):
    def setUp(self):
        super().setUp()
        self.add(product_id=self.product.pk, quantity=1)
        self.item = CartItem.objects.get()
        self.url = reverse("cart-item-detail", args=[self.item.pk])

    def test_update_quantity(self):
        res = self.client.patch(self.url, {"quantity": 4}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["items"][0]["quantity"], 4)

    def test_update_over_stock_rejected(self):
        res = self.client.patch(self.url, {"quantity": 9}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 1)

    def test_update_invalid_quantity_rejected(self):
        self.assertEqual(self.client.patch(self.url, {"quantity": 0}, format="json").status_code, 400)

    def test_remove_item(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["items"], [])

    def test_cannot_touch_another_customers_item(self):
        self.client.force_authenticate(self.make_user("other@example.com"))
        self.assertEqual(self.client.patch(self.url, {"quantity": 2}, format="json").status_code, 404)
        self.assertEqual(self.client.delete(self.url).status_code, 404)
        self.assertEqual(CartItem.objects.count(), 1)

    def test_item_hidden_after_product_deactivated_is_flagged(self):
        self.product.is_active = False
        self.product.save()
        res = self.client.get(reverse("cart"))
        self.assertTrue(res.data["has_issues"])
        self.assertFalse(res.data["items"][0]["available"])


class TotalsAndConstraintTests(CartTestBase):
    def test_totals_with_gst(self):
        self.add(product_id=self.product.pk, quantity=2)  # 2 x 2699 = 5398
        res = self.add(spare_part_id=self.part.pk, quantity=2)  # 2 x 571 = 1142
        self.assertEqual(res.data["subtotal"], "6540.00")
        self.assertEqual(res.data["gst_percent"], "18")
        self.assertEqual(res.data["tax_amount"], "1177.20")
        self.assertEqual(res.data["total"], "7717.20")
        self.assertEqual(res.data["total_quantity"], 4)

    def test_price_change_is_reflected_in_cart(self):
        self.add(product_id=self.product.pk)
        self.product.price = Decimal("2500")
        self.product.save()
        res = self.client.get(reverse("cart"))
        self.assertEqual(res.data["items"][0]["unit_price"], "2500.00")

    def test_db_rejects_item_with_both_or_neither_target(self):
        cart = Cart.objects.create(user=self.customer)
        with self.assertRaises(IntegrityError), transaction.atomic():
            CartItem.objects.create(cart=cart, quantity=1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            CartItem.objects.create(cart=cart, product=self.product, spare_part=self.part, quantity=1)