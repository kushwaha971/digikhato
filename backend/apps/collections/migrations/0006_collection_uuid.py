import uuid

from django.db import migrations, models


def populate_collection_uuids(apps, schema_editor):
    Collection = apps.get_model("collections", "Collection")
    for collection in Collection.objects.filter(uuid__isnull=True).iterator():
        collection.uuid = uuid.uuid4()
        collection.save(update_fields=["uuid"])


class Migration(migrations.Migration):
    dependencies = [
        ("collections", "0005_collection_payment_mode_reference_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="collection",
            name="uuid",
            field=models.UUIDField(null=True, blank=True, editable=False, db_index=True),
        ),
        migrations.RunPython(populate_collection_uuids, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name="collection",
            name="uuid",
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]
