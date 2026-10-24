from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsCustomerRole

from . import services
from .models import CartItem
from .serializers import AddItemSerializer, CartSerializer, UpdateQuantitySerializer


def cart_response(request, cart, status_code=status.HTTP_200_OK):
    return Response(CartSerializer(cart, context={"request": request}).data, status=status_code)


class CartView(APIView):
    permission_classes = [IsCustomerRole]

    def get(self, request):
        return cart_response(request, services.get_or_create_cart(request.user))


class CartItemCreateView(APIView):
    permission_classes = [IsCustomerRole]

    def post(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = services.add_item(
            request.user,
            product_id=serializer.validated_data.get("product_id"),
            spare_part_id=serializer.validated_data.get("spare_part_id"),
            quantity=serializer.validated_data["quantity"],
        )
        return cart_response(request, cart, status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [IsCustomerRole]

    def _item(self, request, pk):
        # Filtering by the logged-in user means nobody can touch another customer's cart.
        return get_object_or_404(CartItem.objects.select_related("cart"), pk=pk, cart__user=request.user)

    def patch(self, request, pk):
        serializer = UpdateQuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = services.update_quantity(self._item(request, pk), serializer.validated_data["quantity"])
        return cart_response(request, cart)

    def delete(self, request, pk):
        cart = services.remove_item(self._item(request, pk))
        return cart_response(request, cart)