import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_user_first_login_reset_flags"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserModuleRole",
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
                ("role_code", models.CharField(
                    choices=[
                        ("jwl_admin", "Admin"),
                        ("jwl_manager", "Manager"),
                        ("jwl_cashier", "Cashier"),
                        ("jwl_salesperson", "Salesperson"),
                        ("jwl_karigar_manager", "Karigar Manager"),
                        ("jwl_pledge_officer", "Gold Pledge Officer"),
                        ("jwl_auditor", "Auditor"),
                    ],
                    max_length=50,
                )),
                ("branch_name", models.CharField(blank=True, default="", max_length=120)),
                ("is_active", models.BooleanField(default=True)),
                ("granted_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="granted_module_roles",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="module_roles",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "indexes": [models.Index(fields=["user", "module"], name="users_usermodulerole_user_module_idx")],
                "unique_together": {("user", "module", "role_code", "branch_name")},
            },
        ),
    ]
