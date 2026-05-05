import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0004_billing"),
    ]

    operations = [
        migrations.AlterField(
            model_name="salesinvoice",
            name="invoice_type",
            field=models.CharField(
                choices=[
                    ("TAX_INVOICE", "Tax Invoice"),
                    ("ESTIMATE", "Estimate"),
                    ("CASH_MEMO", "Cash Memo"),
                    ("NON_GST", "Non-GST Bill"),
                    ("CREDIT_NOTE", "Credit Note"),
                ],
                db_index=True,
                default="TAX_INVOICE",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="salesinvoice",
            name="reference_invoice",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="credit_notes",
                to="jewellery.salesinvoice",
            ),
        ),
    ]
