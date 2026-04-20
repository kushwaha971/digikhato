import uuid

from django.db import migrations, models


def populate_borrower_uuids(apps, schema_editor):
    Borrower = apps.get_model("borrowers", "Borrower")
    for borrower in Borrower.objects.filter(uuid__isnull=True).iterator():
        borrower.uuid = uuid.uuid4()
        borrower.save(update_fields=["uuid"])


class Migration(migrations.Migration):
    dependencies = [
        ("borrowers", "0005_address_optional"),
    ]

    operations = [
        migrations.AddField(
            model_name="borrower",
            name="uuid",
            field=models.UUIDField(null=True, blank=True, editable=False, db_index=True),
        ),
        migrations.RunPython(populate_borrower_uuids, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name="borrower",
            name="uuid",
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]
