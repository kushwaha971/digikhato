from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("loans", "0002_loan_optional_fields_and_notes"),
    ]

    operations = [
        migrations.AddField(
            model_name="loan",
            name="due_date",
            field=models.DateField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="loan",
            name="alert_active",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddIndex(
            model_name="loan",
            index=models.Index(fields=["status", "due_date"], name="loans_loan_status_due_date_idx"),
        ),
    ]
