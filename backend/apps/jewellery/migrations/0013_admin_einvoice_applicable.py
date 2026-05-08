"""Add einvoice_applicable to AdminControl."""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0012_compliance_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="admincontrol",
            name="einvoice_applicable",
            field=models.BooleanField(default=False),
        ),
    ]

