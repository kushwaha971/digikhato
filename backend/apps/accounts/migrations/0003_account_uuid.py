import uuid

from django.db import migrations, models


def populate_account_uuids(apps, schema_editor):
    Account = apps.get_model("accounts", "Account")
    for account in Account.objects.filter(uuid__isnull=True).iterator():
        account.uuid = uuid.uuid4()
        account.save(update_fields=["uuid"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_rename_accounts_ac_status_idx_accounts_ac_status_b219e9_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="account",
            name="uuid",
            field=models.UUIDField(null=True, blank=True, editable=False, db_index=True),
        ),
        migrations.RunPython(populate_account_uuids, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name="account",
            name="uuid",
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]
