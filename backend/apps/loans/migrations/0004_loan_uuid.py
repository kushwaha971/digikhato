import uuid

from django.db import migrations, models


def populate_loan_uuids(apps, schema_editor):
    Loan = apps.get_model("loans", "Loan")
    for loan in Loan.objects.filter(uuid__isnull=True).iterator():
        loan.uuid = uuid.uuid4()
        loan.save(update_fields=["uuid"])


class Migration(migrations.Migration):
    dependencies = [
        ("loans", "0003_loan_due_date_and_alert"),
    ]

    operations = [
        migrations.AddField(
            model_name="loan",
            name="uuid",
            field=models.UUIDField(null=True, blank=True, editable=False, db_index=True),
        ),
        migrations.RunPython(populate_loan_uuids, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name="loan",
            name="uuid",
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]
