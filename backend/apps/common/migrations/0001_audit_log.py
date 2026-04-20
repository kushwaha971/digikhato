import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("tenant_id_snapshot", models.IntegerField(blank=True, db_index=True, null=True)),
                ("tenant_name_snapshot", models.CharField(blank=True, max_length=120)),
                ("action", models.CharField(db_index=True, max_length=50)),
                ("model_name", models.CharField(blank=True, max_length=100)),
                ("object_id", models.CharField(blank=True, max_length=50)),
                ("detail", models.CharField(blank=True, max_length=500)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="audit_actions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["tenant_id_snapshot", "created_at"], name="common_audit_tenant_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["actor", "created_at"], name="common_audit_actor_idx"),
        ),
        # Create the DB cache table (replaces `manage.py createcachetable`)
        migrations.RunSQL(
            sql="""
                CREATE TABLE IF NOT EXISTS django_cache (
                    cache_key varchar(255) NOT NULL PRIMARY KEY,
                    value text NOT NULL,
                    expires timestamp with time zone NOT NULL
                );
                CREATE INDEX IF NOT EXISTS django_cache_expires ON django_cache (expires);
            """,
            reverse_sql="DROP TABLE IF EXISTS django_cache;",
        ),
    ]
