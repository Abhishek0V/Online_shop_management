import re

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

STRONG = "Str0ng!Pass#2026"


class AuthTestBase(APITestCase):
    def setUp(self):
        cache.clear()  # reset throttle counters between tests

    def make_user(self, email="cust@example.com", password=STRONG, **kw):
        return User.objects.create_user(
            email=email, password=password, first_name="Asha", phone="9876543210", **kw
        )

    def register_payload(self, **overrides):
        data = {
            "email": "new@example.com", "first_name": "Ravi", "last_name": "K",
            "phone": "9876543210", "password": STRONG, "confirm_password": STRONG,
        }
        data.update(overrides)
        return data


class RegisterTests(AuthTestBase):
    url = reverse("auth-register")

    def test_register_creates_customer(self):
        res = self.client.post(self.url, self.register_payload())
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="new@example.com")
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertTrue(user.check_password(STRONG))
        self.assertNotIn("password", res.data)

    def test_role_in_payload_is_ignored(self):
        self.client.post(self.url, self.register_payload(role="admin"))
        self.assertEqual(User.objects.get(email="new@example.com").role, User.Role.CUSTOMER)

    def test_duplicate_email_case_insensitive(self):
        self.make_user(email="new@example.com")
        res = self.client.post(self.url, self.register_payload(email="NEW@example.com"))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)

    def test_weak_password_rejected(self):
        res = self.client.post(self.url, self.register_payload(password="12345678", confirm_password="12345678"))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch_rejected(self):
        res = self.client.post(self.url, self.register_payload(confirm_password="Different!1"))
        self.assertIn("confirm_password", res.data)

    def test_invalid_phone_rejected(self):
        res = self.client.post(self.url, self.register_payload(phone="12345"))
        self.assertIn("phone", res.data)

    def test_missing_required_fields(self):
        res = self.client.post(self.url, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ("email", "first_name", "phone", "password"):
            self.assertIn(field, res.data)


class LoginTests(AuthTestBase):
    url = reverse("auth-login")

    def test_login_returns_tokens_and_user(self):
        self.make_user()
        res = self.client.post(self.url, {"email": "CUST@example.com", "password": STRONG})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["role"], "customer")

    def test_wrong_password_rejected(self):
        self.make_user()
        res = self.client.post(self.url, {"email": "cust@example.com", "password": "nope"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_token(self):
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_with_token(self):
        self.make_user()
        token = self.client.post(self.url, {"email": "cust@example.com", "password": STRONG}).data["access"]
        res = self.client.get(reverse("auth-me"), HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.data["email"], "cust@example.com")


@override_settings(FRONTEND_URL="http://front")
class PasswordResetTests(AuthTestBase):
    forgot = reverse("auth-forgot-password")
    reset = reverse("auth-reset-password")

    def _request_link(self):
        self.client.post(self.forgot, {"email": "cust@example.com"})
        body = mail.outbox[-1].body
        return re.search(r"/reset-password/([^/]+)/([^/\s]+)/", body).groups()

    def test_unknown_email_same_response_no_mail(self):
        res = self.client.post(self.forgot, {"email": "ghost@example.com"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_known_email_sends_link(self):
        self.make_user()
        res = self.client.post(self.forgot, {"email": "cust@example.com"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

    def test_reset_with_valid_token(self):
        user = self.make_user()
        uid, token = self._request_link()
        new = "N3w!Password#99"
        res = self.client.post(self.reset, {"uid": uid, "token": token, "new_password": new, "confirm_password": new})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password(new))

    def test_token_cannot_be_reused(self):
        self.make_user()
        uid, token = self._request_link()
        new = "N3w!Password#99"
        payload = {"uid": uid, "token": token, "new_password": new, "confirm_password": new}
        self.client.post(self.reset, payload)
        res = self.client.post(self.reset, payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("token", res.data)

    def test_invalid_token_rejected(self):
        self.make_user()
        uid, _ = self._request_link()
        new = "N3w!Password#99"
        res = self.client.post(self.reset, {"uid": uid, "token": "bad-token", "new_password": new, "confirm_password": new})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_new_password_rejected(self):
        self.make_user()
        uid, token = self._request_link()
        res = self.client.post(self.reset, {"uid": uid, "token": token, "new_password": "12345678", "confirm_password": "12345678"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)