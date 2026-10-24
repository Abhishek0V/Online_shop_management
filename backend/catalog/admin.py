from django.contrib import admin

from .models import Product, ProductImage, SparePart


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class SparePartInline(admin.TabularInline):
    model = SparePart
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "model_code", "price", "mrp", "stock", "is_active")
    list_filter = ("brand", "is_active")
    search_fields = ("name", "model_code", "brand")
    inlines = [ProductImageInline, SparePartInline]