from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import StandardPagination
from common.permissions import IsAdminRole

from . import services
from .models import Product, ProductImage, SparePart
from .serializers import (
    AdminProductSerializer,
    AdminSparePartSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
)


# ---------------- Public (customers) ----------------

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filter_backends = [SearchFilter]
    search_fields = ["name", "brand", "model_code", "description"]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).prefetch_related("images")


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.filter(is_active=True).prefetch_related(
            "images",
            Prefetch("spare_parts", queryset=SparePart.objects.filter(is_active=True), to_attr="active_spare_parts"),
        )


# ---------------- Admin ----------------

class AdminProductViewSet(viewsets.ModelViewSet):
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminRole]
    pagination_class = StandardPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [SearchFilter]
    search_fields = ["name", "brand", "model_code", "description"]

    def get_queryset(self):
        return Product.objects.prefetch_related("images", "spare_parts")

    def perform_destroy(self, instance):
        # Soft delete: hide the product but keep it for past orders and invoices.
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class AdminSparePartViewSet(viewsets.ModelViewSet):
    serializer_class = AdminSparePartSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = SparePart.objects.all()
        product_id = self.request.query_params.get("product")
        return queryset.filter(product_id=product_id) if product_id else queryset


class AdminProductImageDetailView(APIView):
    """PATCH {"is_primary": true} makes the image primary; DELETE removes it."""

    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        image = get_object_or_404(ProductImage, pk=pk)
        if str(request.data.get("is_primary")).lower() in ("true", "1"):
            services.set_primary(image)
            image.refresh_from_db()
        return Response(ProductImageSerializer(image, context={"request": request}).data)

    def delete(self, request, pk):
        image = get_object_or_404(ProductImage, pk=pk)
        if image.product.images.count() == 1:
            return Response({"detail": "A product must keep at least one image."}, status=status.HTTP_400_BAD_REQUEST)
        services.delete_image(image)
        return Response(status=status.HTTP_204_NO_CONTENT)