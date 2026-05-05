# Jewellery rate models — Phase B-1.4

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0002_inventory"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ------------------------------------------------------------------
        # RateHistory (plain model — not tenant-scoped, global log)
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="RateHistory",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("source", models.CharField(default="MANUAL", max_length=50)),
                ("rate_per_gram", models.DecimalField(decimal_places=4, max_digits=18)),
                ("ts", models.DateTimeField(db_index=True)),
                ("metal", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="rate_history", to="jewellery.metal")),
                ("purity", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="rate_history", to="jewellery.purity")),
            ],
            options={"ordering": ["-ts"]},
        ),
        migrations.AddIndex(
            model_name="ratehistory",
            index=models.Index(fields=["metal", "purity", "ts"], name="jwl_rate_history_idx"),
        ),

        # ------------------------------------------------------------------
        # TenantRate (tenant-scoped override)
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="TenantRate",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("buy_rate", models.DecimalField(decimal_places=4, max_digits=18)),
                ("sell_rate", models.DecimalField(decimal_places=4, max_digits=18)),
                ("override_at", models.DateTimeField(auto_now=True)),
                ("override_reason", models.TextField(blank=True, default="")),
                ("metal", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="tenant_rates", to="jewellery.metal")),
                ("purity", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="tenant_rates", to="jewellery.purity")),
                ("override_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-override_at"]},
        ),
        migrations.AddIndex(
            model_name="tenantrate",
            index=models.Index(fields=["tenant", "metal", "purity"], name="jwl_tenant_rate_idx"),
        ),
        migrations.AddConstraint(
            model_name="tenantrate",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=("tenant", "metal", "purity"),
                name="uniq_jwl_tenant_rate_active",
            ),
        ),
    ]
