"""Add e_invoice_is_simulated to SalesInvoice."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0010_outstanding"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesinvoice",
            name="e_invoice_is_simulated",
            field=models.BooleanField(default=True),
        ),
    ]
