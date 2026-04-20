import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("borrowers", "0003_borrower_tenant"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Account",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("amount_given", models.DecimalField(decimal_places=2, max_digits=12)),
                ("daily_interest_rate", models.DecimalField(decimal_places=4, max_digits=6)),
                ("duration_days", models.PositiveIntegerField(blank=True, null=True)),
                ("start_date", models.DateField(auto_now_add=True)),
                (
                    "status",
                    models.CharField(
                        choices=[("active", "Active"), ("closed", "Closed"), ("overdue", "Overdue")],
                        db_index=True,
                        default="active",
                        max_length=20,
                    ),
                ),
                ("amount_paid", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("outstanding_amount", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                (
                    "borrower",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="accounts",
                        to="borrowers.borrower",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="accounts_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="account",
            index=models.Index(fields=["status", "start_date"], name="accounts_ac_status_idx"),
        ),
        migrations.AddIndex(
            model_name="account",
            index=models.Index(fields=["borrower", "updated_at"], name="accounts_ac_borrower_idx"),
        ),
    ]
