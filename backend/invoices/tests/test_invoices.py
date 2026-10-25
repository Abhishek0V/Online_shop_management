from unittest.mock import patch

from django.core import mail
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from invoices.models import Invoice
from invoices.pdf import build_invoice_pdf
from orders.models import Order
from orders.tests.base import ShopFlowTestCase, make_user


class InvoiceFlowTests(ShopFlowTestCase):
    def paid(self, payment_id="pay_INV1"):
        self.fill_cart()
        checkout = self.checkout()
        self.pay(checkout, payment_id)
        return Order.objects.get(order_number=checkout.data["order_number"])

    def test_payment_creates_invoice_and_emails_pdf(self):
        order = self.paid()
        invoice = Invoice.objects.get()
        self.assertEqual(invoice.order, order)
        self.assertEqual(invoice.invoice_number, order.order_number.replace("ORD-", "INV-"))
        self.assertIsNotNone(invoice.emailed_at)

        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["cust@example.com"])
        self.assertIn(order.order_number, message.subject)
        filename, content, mimetype = message.attachments[0]
        self.assertEqual((filename, mimetype), (f"{invoice.invoice_number}.pdf", "application/pdf"))
        self.assertTrue(content.startswith(b"%PDF"))

    def test_verifying_twice_does_not_duplicate_invoice_or_email(self):
        self.fill_cart()
        checkout = self.checkout()
        self.pay(checkout)
        self.pay(checkout)
        self.assertEqual(Invoice.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_unpaid_order_has_no_invoice(self):
        self.fill_cart()
        self.checkout()
        self.assertEqual(Invoice.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_email_failure_does_not_break_payment_and_can_be_retried(self):
        with patch("invoices.services.EmailMessage.send", side_effect=Exception("smtp down")):
            order = self.paid()
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PAID)  # payment still succeeded
        self.assertIsNone(Invoice.objects.get().emailed_at)
        self.assertEqual(len(mail.outbox), 0)

        call_command("send_pending_invoices")
        self.assertIsNotNone(Invoice.objects.get().emailed_at)
        self.assertEqual(len(mail.outbox), 1)

    def test_pdf_is_generated(self):
        self.paid()
        pdf = build_invoice_pdf(Invoice.objects.get())
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertGreater(len(pdf), 1500)

    def test_pdf_handles_special_characters_in_names(self):
        self.product.name = "Drill <Pro> & Co"
        self.product.save()
        self.paid()
        self.assertTrue(build_invoice_pdf(Invoice.objects.get()).startswith(b"%PDF"))

    def test_order_detail_includes_invoice_info(self):
        order = self.paid()
        res = self.client.get(reverse("my-order-detail", args=[order.order_number]))
        self.assertEqual(res.data["invoice_number"], Invoice.objects.get().invoice_number)
        self.assertTrue(res.data["invoice_emailed"])


class InvoiceDownloadTests(ShopFlowTestCase):
    def setUp(self):
        super().setUp()
        self.fill_cart()
        checkout = self.checkout()
        self.pay(checkout)
        self.order = Order.objects.get()
        self.url = reverse("invoice-download", args=[self.order.order_number])

    def test_owner_downloads_pdf(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.assertIn("attachment", res["Content-Disposition"])
        self.assertTrue(res.content.startswith(b"%PDF"))

    def test_admin_downloads_any_invoice(self):
        self.client.force_authenticate(make_user("admin@example.com", "admin"))
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

    def test_other_customer_gets_404(self):
        self.client.force_authenticate(make_user("other@example.com"))
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_404_NOT_FOUND)

    def test_anonymous_gets_401(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unpaid_order_has_no_download(self):
        Order.objects.update(status=Order.Status.PENDING_PAYMENT)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_404_NOT_FOUND)

    def test_missing_invoice_is_created_on_download(self):
        Invoice.objects.all().delete()
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)
        self.assertEqual(Invoice.objects.count(), 1)