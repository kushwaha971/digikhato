import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("borrowers", "0006_borrower_uuid"),
        ("locations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="borrower",
            name="location",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="location_borrowers",
                to="locations.location",
            ),
        ),
    ]
