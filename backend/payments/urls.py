from django.urls import path

from .views import PaymentFailedView, VerifyPaymentView

urlpatterns = [
    path("payments/verify/", VerifyPaymentView.as_view(), name="payment-verify"),
    path("payments/failed/", PaymentFailedView.as_view(), name="payment-failed"),
]