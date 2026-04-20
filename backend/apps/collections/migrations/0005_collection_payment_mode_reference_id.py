from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("collections", "0004_collection_collection_code"),
    ]

    operations = [
        migrations.AddField(
            model_name="collection",
            name="payment_mode",
            field=models.CharField(
                choices=[
                    ("cash", "Cash"),
                    ("gpay", "GPay"),
                    ("phonepe", "PhonePe"),
                    ("paytm", "Paytm"),
                    ("other_upi", "Other UPI"),
                ],
                default="cash",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="collection",
            name="reference_id",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddIndex(
            model_name="collection",
            index=models.Index(fields=["date", "payment_mode"], name="collections_collection_date_pm_idx"),
        ),
    ]
