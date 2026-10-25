from rest_framework import serializers

from .models import Order, OrderItem

SHIPPING_FIELDS = ["ship_name", "ship_phone", "ship_address_line", "ship_city", "ship_state", "ship_pincode"]


class ShippingSerializer(serializers.ModelSerializer):
    """Validates the checkout form; field rules come from the Order model."""

    class Meta:
        model = Order
        fields = SHIPPING_FIELDS


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "item_type", "item_name", "item_code", "unit_price", "quantity", "line_total"]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = ["order_number", "status", "status_label", "total_amount", "item_count", "created_at", "paid_at"]


class OrderDetailSerializer(OrderListSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    invoice_number = serializers.SerializerMethodField()
    invoice_emailed = serializers.SerializerMethodField()

    def get_invoice_number(self, obj):
        invoice = getattr(obj, "invoice", None)  # None until the invoice exists
        return invoice.invoice_number if invoice else None

    def get_invoice_emailed(self, obj):
        invoice = getattr(obj, "invoice", None)
        return bool(invoice and invoice.emailed_at)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + SHIPPING_FIELDS + [
            "subtotal", "gst_percent", "tax_amount", "items", "invoice_number", "invoice_emailed",
        ]


class AdminOrderListSerializer(OrderListSerializer):
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    customer_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + ["customer_email", "customer_name"]


class AdminOrderDetailSerializer(OrderDetailSerializer):
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    customer_name = serializers.CharField(source="user.full_name", read_only=True)
    customer_phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta(OrderDetailSerializer.Meta):
        fields = OrderDetailSerializer.Meta.fields + ["customer_email", "customer_name", "customer_phone"]