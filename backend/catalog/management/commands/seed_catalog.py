import io
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw

from catalog import services
from catalog.models import Product, SparePart

# Demo data. Prices are sample values for local testing only.
PRODUCTS = [
    {
        "name": "Bosch Professional Angle Grinders - GWS 600", "model_code": "060137505F", "brand": "Bosch",
        "mrp": "4150", "price": "2699", "stock": 25,
        "description": "Bosch Professional GWS 600 angle grinder, 670 W, for cutting and grinding metal and masonry.",
        "parts": [("Armature (220-240V)", "571"), ("Field Coil (220-240V)", "140")],
    },
    {
        "name": "INGCO Rotary Hammer Drill Machine - RGH6528 - 650Watt", "model_code": "RGH6528", "brand": "INGCO",
        "mrp": "5200", "price": "3799", "stock": 15,
        "description": "INGCO 650 W rotary hammer drill with SDS-plus chuck for drilling concrete, brick and stone.",
        "parts": [("Armature (220-240V)", "650"), ("Field Coil (220-240V)", "420"), ("Carbon Brush Set", "90")],
    },
    {
        "name": "Bosch GSB 450 Impact Drill", "model_code": "GSB450", "brand": "Bosch",
        "mrp": "4600", "price": "3299", "stock": 18,
        "description": "Bosch GSB 450 450 W impact drill for wood, metal and masonry.",
        "parts": [("Armature (220-240V)", "571"), ("Carbon Brush Set", "80")],
    },
    {
        "name": "INGCO Angle Grinder - AG8506", "model_code": "AG8506", "brand": "INGCO",
        "mrp": "3400", "price": "2299", "stock": 30,
        "description": "INGCO 850 W angle grinder with 100 mm disc and side handle.",
        "parts": [("Armature (220-240V)", "480"), ("Field Coil (220-240V)", "260")],
    },
]


def placeholder_png(label: str, color: str) -> ContentFile:
    img = Image.new("RGB", (600, 600), color)
    ImageDraw.Draw(img).text((20, 20), label[:60], fill="white")
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return ContentFile(buf.getvalue())


class Command(BaseCommand):
    help = "Load demo products and spare parts (safe to run more than once)."

    def handle(self, *args, **options):
        colors = ["#0b5cad", "#b42318", "#067647", "#6b4eff"]
        for i, data in enumerate(PRODUCTS):
            defaults = {k: data[k] for k in ("name", "brand", "mrp", "price", "stock", "description")}
            product, created = Product.objects.update_or_create(model_code=data["model_code"], defaults=defaults)
            if created or not product.images.exists():
                for n in range(2):
                    f = placeholder_png(f"{product.name} #{n + 1}", colors[(i + n) % len(colors)])
                    f.name = f"{product.slug}-{n + 1}.png"
                    services.add_images(product, [f])
            for name, price in data["parts"]:
                SparePart.objects.update_or_create(
                    product=product, name=name, defaults={"price": Decimal(price), "stock": 40, "is_active": True}
                )
            self.stdout.write(f"{'Created' if created else 'Updated'}: {product.name}")
        self.stdout.write(self.style.SUCCESS("Catalog seeded."))