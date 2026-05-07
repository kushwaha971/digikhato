"""Add compliance and editability fields for billing/inventory/karigar."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0011_einvoice_simulated"),
    ]

    operations = [
        migrations.AddField(
            model_name="karigar",
            name="is_active",
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddConstraint(
            model_name="karigar",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=("tenant", "code"),
                name="uniq_jwl_karigar_tenant_code_active",
            ),
        ),
        migrations.AddField(
            model_name="item",
            name="hallmark_status",
            field=models.CharField(
                choices=[
                    ("NOT_HALLMARKED", "Not Hallmarked"),
                    ("HALLMARKED", "Hallmarked"),
                    ("HUID_ASSIGNED", "HUID Assigned"),
                ],
                db_index=True,
                default="NOT_HALLMARKED",
                max_length=20,
            ),
        ),
        migrations.AddConstraint(
            model_name="item",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True, huid__gt=""),
                fields=("tenant", "huid"),
                name="uniq_jwl_item_tenant_huid_nonempty",
            ),
        ),
        migrations.AddField(
            model_name="salesinvoiceline",
            name="huid",
            field=models.CharField(blank=True, default="", max_length=6),
        ),
    ]
