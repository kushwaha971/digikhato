from django.contrib import admin
from .models import Account


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['id', 'borrower', 'amount_given', 'amount_paid', 'outstanding_amount', 'status', 'start_date']
    list_filter = ['status']
    search_fields = ['borrower__name', 'borrower__mobile_number']
