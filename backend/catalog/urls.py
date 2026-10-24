from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    AdminProductImageDetailView,
    AdminProductViewSet,
    AdminSparePartViewSet,
    ProductDetailView,
    ProductListView,
)

router = SimpleRouter()
router.register("admin/products", AdminProductViewSet, basename="admin-product")
router.register("admin/spare-parts", AdminSparePartViewSet, basename="admin-spare-part")

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path("admin/product-images/<int:pk>/", AdminProductImageDetailView.as_view(), name="admin-product-image"),
] + router.urls