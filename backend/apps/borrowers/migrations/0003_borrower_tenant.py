import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("borrowers", "0002_initial"),
        ("users", "0003_user_tenant"),
    ]

    operations = [
        migrations.AddField(
            model_name="borrower",
            name="tenant",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tenant_borrowers",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
