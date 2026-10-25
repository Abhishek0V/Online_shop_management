from django.contrib import admin

from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "order", "issued_at", "emailed_at")
    search_fields = ("invoice_number", "order__order_number", "order__user__email")
    readonly_fields = ("order", "invoice_number", "issued_at", "emailed_at")