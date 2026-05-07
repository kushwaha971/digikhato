# Jewellery karigar/order models — Phase B-2.1
# Hand-written migration; do not run makemigrations.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0007_admin_controls"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [

        # ── Karigar ───────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Karigar",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("code", models.CharField(db_index=True, max_length=50)),
                ("name", models.CharField(db_index=True, max_length=200)),
                ("mobile", models.CharField(blank=True, default="", max_length=15)),
                ("kyc_pan", models.CharField(blank=True, default="", max_length=10)),
                ("kyc_aadhaar_masked", models.CharField(blank=True, default="", max_length=4)),
                ("default_labour_rate", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("default_wastage_pct", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("specialization", models.CharField(blank=True, default="", max_length=100)),
                ("tenant", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),

        # ── CustomerOrder ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name="CustomerOrder",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("order_no", models.CharField(blank=True, db_index=True, default="", max_length=50)),
                ("order_date", models.DateField()),
                ("expected_delivery", models.DateField(blank=True, null=True)),
                ("advance_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("status", models.CharField(
                    choices=[
                        ("BOOKED", "Booked"),
                        ("METAL_ISSUED", "Metal Issued"),
                        ("WIP", "Work In Progress"),
                        ("KARIGAR_RECEIVED", "Received from Karigar"),
                        ("QC", "Quality Control"),
                        ("HALLMARKED", "Hallmarked"),
                        ("READY", "Ready for Delivery"),
                        ("DELIVERED", "Delivered"),
                        ("CLOSED", "Closed"),
                        ("CANCELLED", "Cancelled"),
                    ],
                    db_index=True, default="BOOKED", max_length=20,
                )),
                ("notes", models.TextField(blank=True, default="")),
                ("tenant", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="orders", to="jewellery.customer")),
                ("design", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="jewellery.design")),
            ],
            options={"ordering": ["-order_date"]},
        ),

        # ── KarigarIssue ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="KarigarIssue",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("voucher_no", models.CharField(blank=True, db_index=True, default="", max_length=50)),
                ("date", models.DateField()),
                ("gross_wt_issued", models.DecimalField(decimal_places=4, max_digits=12)),
                ("tunch_pct", models.DecimalField(decimal_places=3, max_digits=6)),
                ("pure_gold_wt_issued", models.DecimalField(decimal_places=4, max_digits=12)),
                ("items_json", models.JSONField(default=list)),
                ("notes", models.TextField(blank=True, default="")),
                ("tenant", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("karigar", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="issues", to="jewellery.karigar")),
                ("order", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="issues", to="jewellery.customerorder")),
                ("metal", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="+", to="jewellery.metal")),
            ],
            options={"ordering": ["-date"]},
        ),

        # ── KarigarReceipt ────────────────────────────────────────────────────
        migrations.CreateModel(
            name="KarigarReceipt",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("voucher_no", models.CharField(blank=True, db_index=True, default="", max_length=50)),
                ("date", models.DateField()),
                ("gross_wt_received", models.DecimalField(decimal_places=4, max_digits=12)),
                ("net_wt", models.DecimalField(decimal_places=4, max_digits=12)),
                ("stone_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("final_purity_pct", models.DecimalField(decimal_places=3, default=0, max_digits=6)),
                ("pure_gold_wt_received", models.DecimalField(decimal_places=4, max_digits=12)),
                ("wastage_actual_pct", models.DecimalField(decimal_places=2, max_digits=5)),
                ("labour_amount", models.DecimalField(decimal_places=2, max_digits=18)),
                ("pure_diff", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("status", models.CharField(default="DRAFT", max_length=20)),
                ("tenant", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("karigar", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="receipts", to="jewellery.karigar")),
                ("issue", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="receipts", to="jewellery.karigarissue")),
            ],
            options={"ordering": ["-date"]},
        ),
    ]
