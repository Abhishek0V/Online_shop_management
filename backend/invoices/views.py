from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from orders.models import Order

from . import services
from .pdf import build_invoice_pdf


class InvoiceDownloadView(APIView):
    """Customers can download their own invoices; admins can download any."""

    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        orders = Order.objects.filter(status=Order.Status.PAID)
        if request.user.role != "admin":
            orders = orders.filter(user=request.user)
        order = get_object_or_404(orders, order_number=order_number)
        invoice = services.get_or_create_invoice(order)
        response = HttpResponse(build_invoice_pdf(invoice), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response