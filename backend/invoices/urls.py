from django.urls import path

from .views import InvoiceDownloadView

urlpatterns = [
    path("orders/<str:order_number>/invoice/", InvoiceDownloadView.as_view(), name="invoice-download"),
]