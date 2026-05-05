import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_usermodulerole"),
    ]

    operations = [
        migrations.CreateModel(
            name="ModuleAccessRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("module", models.CharField(
                    choices=[
                        ("loans", "Loan Management"),
                        ("udhaar", "Udhaar App"),
                        ("jewellery", "Jewellery ERP"),
                    ],
                    db_index=True,
                    max_length=50,
                )),
                ("status", models.CharField(
                    choices=[
                        ("pending", "Pending"),
                        ("approved", "Approved"),
                        ("rejected", "Rejected"),
                    ],
                    db_index=True,
                    default="pending",
                    max_length=20,
                )),
                ("rejection_reason", models.TextField(blank=True, default="")),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="module_access_requests",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("reviewed_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="reviewed_module_requests",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="moduleaccessrequest",
            index=models.Index(fields=["user", "module", "status"], name="users_mod_user_mod_status_idx"),
        ),
        migrations.AddIndex(
            model_name="moduleaccessrequest",
            index=models.Index(fields=["status", "created_at"], name="users_mod_status_created_idx"),
        ),
    ]
