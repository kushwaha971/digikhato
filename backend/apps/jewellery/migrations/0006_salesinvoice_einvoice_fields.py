from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0005_credit_note_salesinvoice_reference"),
    ]

    operations = [
        migrations.AddField(
            model_name="salesinvoice",
            name="e_invoice_irn",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
        migrations.AddField(
            model_name="salesinvoice",
            name="e_invoice_qr",
            field=models.TextField(blank=True, default=""),
        ),
    ]
