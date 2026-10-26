from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

User = get_user_model()


def send_password_reset_email(email: str) -> None:
    """Email a reset link if the account exists. Never reveals whether it does."""
    user = User.objects.filter(email__iexact=email.strip(), is_active=True).first()
    if user is None:
        return
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
    send_mail(
        subject="Reset your Hardware Shop password",
        message=(
            f"Hi {user.first_name},\n\nUse the link below to reset your password. "
            f"It expires in {settings.PASSWORD_RESET_TIMEOUT // 60} minutes.\n\n{link}\n\n"
            "If you did not request this, ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def reset_password(user, new_password: str) -> None:
    user.set_password(new_password)  # changing the hash also invalidates the used token
    user.save(update_fields=["password", "updated_at"])