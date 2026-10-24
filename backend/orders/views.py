from django.db.models import Count
from rest_framework import generics, status
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import StandardPagination
from common.permissions import IsAdminRole, IsCustomerRole
from payments import services as payment_services

from .models import Order
from .serializers import (
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    ShippingSerializer,
)


class CheckoutView(APIView):
    """Creates the order, reserves stock and starts the Razorpay payment."""

    permission_classes = [IsCustomerRole]

    def post(self, request):
        serializer = ShippingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = payment_services.start_checkout(request.user, serializer.validated_data)
        return Response(data, status=status.HTTP_201_CREATED)


def _with_item_count(queryset):
    return queryset.annotate(item_count=Count("items")).order_by("-created_at", "-id")


class MyOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsCustomerRole]
    pagination_class = StandardPagination

    def get_queryset(self):
        # Unfinished checkouts are hidden from the customer.
        qs = Order.objects.filter(user=self.request.user).exclude(status=Order.Status.PENDING_PAYMENT)
        return _with_item_count(qs)


class MyOrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [IsCustomerRole]
    lookup_field = "order_number"

    def get_queryset(self):
        qs = Order.objects.filter(user=self.request.user).prefetch_related("items")
        return _with_item_count(qs)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = AdminOrderListSerializer
    permission_classes = [IsAdminRole]
    pagination_class = StandardPagination
    filter_backends = [SearchFilter]
    search_fields = ["order_number", "user__email", "ship_name"]

    def get_queryset(self):
        qs = Order.objects.select_related("user")
        wanted = self.request.query_params.get("status")
        if wanted in Order.Status.values:
            qs = qs.filter(status=wanted)
        return _with_item_count(qs)


class AdminOrderDetailView(generics.RetrieveAPIView):
    serializer_class = AdminOrderDetailSerializer
    permission_classes = [IsAdminRole]
    lookup_field = "order_number"

    def get_queryset(self):
        return _with_item_count(Order.objects.select_related("user").prefetch_related("items"))