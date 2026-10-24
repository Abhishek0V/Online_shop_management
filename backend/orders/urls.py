from django.urls import path

from .views import AdminOrderDetailView, AdminOrderListView, CheckoutView, MyOrderDetailView, MyOrderListView

urlpatterns = [
    path("orders/checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", MyOrderListView.as_view(), name="my-order-list"),
    path("orders/<str:order_number>/", MyOrderDetailView.as_view(), name="my-order-detail"),
    path("admin/orders/", AdminOrderListView.as_view(), name="admin-order-list"),
    path("admin/orders/<str:order_number>/", AdminOrderDetailView.as_view(), name="admin-order-detail"),
]