from django.db import transaction

from .models import Product, ProductImage

#keep only one image primary
@transaction.atomic
def set_primary(image: ProductImage) -> ProductImage:
    image.product.images.exclude(pk=image.pk).update(is_primary=False)
    if not image.is_primary:
        image.is_primary = True
        image.save(update_fields=["is_primary", "updated_at"])
    return image


@transaction.atomic
def add_images(product: Product, files, primary_index=None):
    start = product.images.count()
    created = [
        ProductImage.objects.create(product=product, image=f, sort_order=start + i)
        for i, f in enumerate(files)
    ]
    if created:
        if primary_index is not None:
            set_primary(created[primary_index])
        elif not product.images.filter(is_primary=True).exists():
            set_primary(created[0])
    return created


@transaction.atomic
def create_product(validated_data: dict, files, primary_index=None) -> Product:
    product = Product.objects.create(**validated_data)
    add_images(product, files, primary_index if primary_index is not None else 0)
    return product


@transaction.atomic
def delete_image(image: ProductImage) -> None:
    product, was_primary = image.product, image.is_primary
    image.delete()
    if was_primary:
        nxt = product.images.first()
        if nxt:
            set_primary(nxt)