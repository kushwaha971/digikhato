import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0006_salesinvoice_einvoice_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminControl",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("feature_flags", models.JSONField(blank=True, default=dict)),
                ("lock_period_end", models.DateField(blank=True, null=True)),
                ("lock_period_reason", models.CharField(blank=True, default="", max_length=500)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("lock_set_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("tenant", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["branch_name"]},
        ),
        migrations.AddIndex(
            model_name="admincontrol",
            index=models.Index(fields=["tenant", "branch_name", "lock_period_end"], name="jwl_admin_tenant_branch_lock_idx"),
        ),
        migrations.AddConstraint(
            model_name="admincontrol",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=("tenant", "branch_name"),
                name="uniq_jwl_admincontrol_tenant_branch_active",
            ),
        ),
    ]
