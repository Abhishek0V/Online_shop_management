from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2 MB
ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]

image_extension_validator = FileExtensionValidator(allowed_extensions=ALLOWED_IMAGE_EXTENSIONS)


def validate_image_size(file):
    if file.size > MAX_IMAGE_SIZE:
        raise ValidationError("Image must be 2 MB or smaller.")