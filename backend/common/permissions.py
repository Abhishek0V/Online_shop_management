from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allows only logged-in users whose role is 'admin'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsCustomerRole(BasePermission):
    """Allows only logged-in users whose role is 'customer'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "customer")