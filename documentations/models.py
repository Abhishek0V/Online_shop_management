# from django.contrib.auth.models import AbstractUser, BaseUserManager
# from django.core.validators import RegexValidator
# from django.db import models

# # from common.models import TimeStampedModel

# # Indian mobile number: 10 digits starting with 6-9 (frontend strips +91 / spaces)
# phone_validator = RegexValidator(
#     regex=r"^[6-9]\d{9}$",
#     message="Enter a valid 10-digit mobile number.",
# )


# class UserManager(BaseUserManager):
#     """Manager for a user model that logs in with email instead of username."""

#     use_in_migrations = True

#     def _create_user(self, email, password, **extra_fields):
#         if not email:
#             raise ValueError("Email is required.")
#         email = self.normalize_email(email).lower()
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)  # hashes the password
#         user.full_clean(exclude=["password"])  # runs field validators
#         user.save(using=self._db)
#         return user

#     def create_user(self, email, password=None, **extra_fields):
#         extra_fields.setdefault("role", User.Role.CUSTOMER)
#         extra_fields.setdefault("is_staff", False)
#         extra_fields.setdefault("is_superuser", False)
#         return self._create_user(email, password, **extra_fields)

#     def create_superuser(self, email, password=None, **extra_fields):
#         extra_fields.setdefault("role", User.Role.ADMIN)
#         extra_fields.setdefault("is_staff", True)
#         extra_fields.setdefault("is_superuser", True)
#         if extra_fields["role"] != User.Role.ADMIN:
#             raise ValueError("Superuser must have role=admin.")
#         if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
#             raise ValueError("Superuser must have is_staff=True and is_superuser=True.")
#         return self._create_user(email, password, **extra_fields)


# # class User(AbstractUser, TimeStampedModel):
#     """Single user table for both customers and the shop admin (distinguished by role)."""

#     class Role(models.TextChoices):
#         CUSTOMER = "customer", "Customer"
#         ADMIN = "admin", "Admin"

#     # Remove the default username; email is the login identifier.
#     username = None
#     email = models.EmailField("email address", unique=True)
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50, blank=True)
#     phone = models.CharField(max_length=10, validators=[phone_validator])
#     role = models.CharField(
#         max_length=10, choices=Role.choices, default=Role.CUSTOMER, db_index=True
#     )

#     USERNAME_FIELD = "email"
#     REQUIRED_FIELDS = ["first_name", "phone"]  # asked by createsuperuser (plus email/password)

#     objects = UserManager()

#     class Meta:
#         ordering = ["-created_at"]

#     def __str__(self):
#         return self.email

#     def save(self, *args, **kwargs):
#         # Keep emails case-insensitively unique by always storing lowercase.
#         self.email = self.email.lower()
#         super().save(*args, **kwargs)

#     @property
#     def full_name(self):
#         return f"{self.first_name} {self.last_name}".strip()

#     @property
#     def is_admin_role(self):
#         return self.role == self.Role.ADMIN

#     @property
#     def is_customer(self):
#         return self.role == self.Role.CUSTOMER
