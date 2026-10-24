import io
import shutil
import tempfile
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from catalog.models import Product, ProductImage, SparePart
from catalog.validators import MAX_IMAGE_SIZE, validate_image_size

TEMP_MEDIA = tempfile.mkdtemp()


def image_file(name="img.png", fmt="PNG"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "blue").save(buf, fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class CatalogTestBase(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def make_user(self, email, role):
        return User.objects.create_user(
            email=email, password="Str0ng!Pass#2026", first_name="T", phone="9876543210", role=role
        )

    def admin(self):
        return self.make_user("admin@example.com", "admin")

    def customer(self):
        return self.make_user("cust@example.com", "customer")

    def make_product(self, name="Bosch GWS 600", code="GWS600", **kw):
        data = dict(name=name, model_code=code, brand="Bosch", mrp=Decimal("4150"), price=Decimal("2699"), stock=10)
        data.update(kw)
        product = Product.objects.create(**data)
        ProductImage.objects.create(product=product, image=image_file(), is_primary=True)
        return product

    def payload(self, **overrides):
        data = {
            "name": "INGCO Drill RGH6528", "brand": "INGCO", "model_code": "RGH6528",
            "description": "Drill", "mrp": "5200", "price": "3799", "stock": 15,
            "uploaded_images": [image_file("a.png"), image_file("b.png")],
        }
        data.update(overrides)
        return data


class ModelTests(CatalogTestBase):
    def test_slug_is_unique_for_same_name(self):
        a = self.make_product(code="A1")
        b = self.make_product(code="B2")
        self.assertNotEqual(a.slug, b.slug)

    def test_db_rejects_price_above_mrp(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Product.objects.create(name="X", model_code="X1", brand="B", mrp=Decimal("10"), price=Decimal("20"))

    def test_only_one_primary_image_per_product(self):
        product = self.make_product()
        with self.assertRaises(IntegrityError), transaction.atomic():
            ProductImage.objects.create(product=product, image=image_file(), is_primary=True)

    def test_image_size_validator(self):
        class Big:
            size = MAX_IMAGE_SIZE + 1
        with self.assertRaises(ValidationError):
            validate_image_size(Big())


class PublicCatalogTests(CatalogTestBase):
    def test_list_shows_only_active_products(self):
        self.make_product(code="A1")
        self.make_product(name="Hidden", code="H1", is_active=False)
        res = self.client.get(reverse("product-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual([p["model_code"] for p in res.data["results"]], ["A1"])
        self.assertIsNotNone(res.data["results"][0]["primary_image"])

    def test_search_by_name_and_model_code(self):
        self.make_product(name="Bosch Grinder", code="G1")
        self.make_product(name="INGCO Drill", code="D1", brand="INGCO")
        res = self.client.get(reverse("product-list"), {"search": "drill"})
        self.assertEqual(len(res.data["results"]), 1)
        res = self.client.get(reverse("product-list"), {"search": "G1"})
        self.assertEqual(res.data["results"][0]["model_code"], "G1")

    def test_detail_includes_images_and_only_active_spare_parts(self):
        product = self.make_product()
        SparePart.objects.create(product=product, name="Armature (220-240V)", price=Decimal("571"), stock=5)
        SparePart.objects.create(product=product, name="Old part", price=Decimal("10"), is_active=False)
        res = self.client.get(reverse("product-detail", args=[product.slug]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["images"]), 1)
        self.assertEqual([s["name"] for s in res.data["spare_parts"]], ["Armature (220-240V)"])

    def test_detail_404_for_inactive_product(self):
        product = self.make_product(is_active=False)
        res = self.client.get(reverse("product-detail", args=[product.slug]))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class AdminProductTests(CatalogTestBase):
    url = reverse("admin-product-list")

    def test_anonymous_gets_401_and_customer_gets_403(self):
        self.assertEqual(self.client.post(self.url, self.payload(), format="multipart").status_code, 401)
        self.client.force_authenticate(self.customer())
        self.assertEqual(self.client.post(self.url, self.payload(), format="multipart").status_code, 403)

    def test_admin_creates_product_with_multiple_images(self):
        self.client.force_authenticate(self.admin())
        res = self.client.post(self.url, self.payload(primary_index=1), format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        product = Product.objects.get(model_code="RGH6528")
        self.assertEqual(product.images.count(), 2)
        self.assertEqual(product.images.filter(is_primary=True).count(), 1)
        self.assertEqual(product.images.get(is_primary=True).sort_order, 1)

    def test_price_above_mrp_rejected(self):
        self.client.force_authenticate(self.admin())
        res = self.client.post(self.url, self.payload(price="9999"), format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", res.data)

    def test_at_least_one_image_required(self):
        self.client.force_authenticate(self.admin())
        data = self.payload()
        data.pop("uploaded_images")
        res = self.client.post(self.url, data, format="multipart")
        self.assertIn("uploaded_images", res.data)

    def test_non_image_file_rejected(self):
        self.client.force_authenticate(self.admin())
        fake = SimpleUploadedFile("notes.png", b"not an image", content_type="image/png")
        res = self.client.post(self.url, self.payload(uploaded_images=[fake]), format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_disallowed_extension_rejected(self):
        self.client.force_authenticate(self.admin())
        gif = image_file("pic.gif", "GIF")
        res = self.client.post(self.url, self.payload(uploaded_images=[gif]), format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_can_add_images(self):
        self.client.force_authenticate(self.admin())
        product = self.make_product()
        res = self.client.patch(
            reverse("admin-product-detail", args=[product.pk]),
            {"stock": 50, "uploaded_images": [image_file("c.png")]}, format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        product.refresh_from_db()
        self.assertEqual(product.stock, 50)
        self.assertEqual(product.images.count(), 2)
        self.assertEqual(product.images.filter(is_primary=True).count(), 1)

    def test_delete_is_soft_and_hides_from_public(self):
        self.client.force_authenticate(self.admin())
        product = self.make_product()
        res = self.client.delete(reverse("admin-product-detail", args=[product.pk]))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        product.refresh_from_db()
        self.assertFalse(product.is_active)
        self.client.force_authenticate(None)
        self.assertEqual(len(self.client.get(reverse("product-list")).data["results"]), 0)

    def test_set_primary_and_delete_image(self):
        self.client.force_authenticate(self.admin())
        product = self.make_product()
        second = ProductImage.objects.create(product=product, image=image_file(), sort_order=1)
        url = reverse("admin-product-image", args=[second.pk])
        self.assertEqual(self.client.patch(url, {"is_primary": True}, format="json").status_code, 200)
        self.assertEqual(product.images.filter(is_primary=True).count(), 1)
        self.assertEqual(product.images.get(is_primary=True).pk, second.pk)
        # deleting the primary promotes the remaining image
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(product.images.filter(is_primary=True).count(), 1)

    def test_cannot_delete_last_image(self):
        self.client.force_authenticate(self.admin())
        product = self.make_product()
        only = product.images.get()
        res = self.client.delete(reverse("admin-product-image", args=[only.pk]))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class AdminSparePartTests(CatalogTestBase):
    url = reverse("admin-spare-part-list")

    def test_admin_adds_spare_part_to_product(self):
        self.client.force_authenticate(self.admin())
        product = self.make_product()
        res = self.client.post(
            self.url, {"product": product.pk, "name": "Field Coil (220-240V)", "price": "140", "stock": 20}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(product.spare_parts.count(), 1)

    def test_duplicate_name_on_same_product_rejected(self):
        self.client.force_authenticate(self.admin())
        product = self.make_product()
        SparePart.objects.create(product=product, name="Armature", price=Decimal("10"))
        res = self.client.post(self.url, {"product": product.pk, "name": "armature", "price": "20", "stock": 1}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_price_rejected(self):
        self.client.force_authenticate(self.admin())
        product = self.make_product()
        res = self.client.post(self.url, {"product": product.pk, "name": "X", "price": "-5", "stock": 1}, format="json")
        self.assertIn("price", res.data)

    def test_customer_cannot_add_spare_part(self):
        self.client.force_authenticate(self.customer())
        product = self.make_product()
        res = self.client.post(self.url, {"product": product.pk, "name": "X", "price": "5", "stock": 1}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_by_product(self):
        self.client.force_authenticate(self.admin())
        p1, p2 = self.make_product(code="P1"), self.make_product(code="P2")
        SparePart.objects.create(product=p1, name="A", price=Decimal("1"))
        SparePart.objects.create(product=p2, name="B", price=Decimal("1"))
        res = self.client.get(self.url, {"product": p1.pk})
        self.assertEqual([s["name"] for s in res.data], ["A"])