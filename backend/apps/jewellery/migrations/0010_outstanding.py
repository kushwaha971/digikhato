"""Migration for Party Outstanding models (Phase B-2.4)."""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0009_pledge"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PartyOutstandingBalance",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("amount_balance", models.DecimalField(
                    decimal_places=2,
                    default=0,
                    help_text="Cash balance (positive = customer owes us)",
                    max_digits=18,
                )),
                ("metal_balance_grams", models.DecimalField(
                    decimal_places=4,
                    default=0,
                    help_text="Gold balance in grams",
                    max_digits=12,
                )),
                ("last_txn_date", models.DateField(blank=True, null=True)),
                ("tenant", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="+",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="+",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("updated_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="+",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("customer", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="outstanding",
                    to="jewellery.customer",
                )),
            ],
            options={"ordering": ["-last_txn_date"]},
        ),
        migrations.CreateModel(
            name="PartyOutstandingMovement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("movement_type", models.CharField(
                    choices=[
                        ("INVOICE_DEBIT", "Invoice Debit"),
                        ("INVOICE_CREDIT", "Invoice Credit"),
                        ("PAYMENT_RECEIVED", "Payment Received"),
                        ("ADVANCE_GIVEN", "Advance Given"),
                        ("METAL_ISSUED", "Metal Issued"),
                        ("METAL_RECEIVED", "Metal Received"),
                        ("MANUAL_ADJUSTMENT", "Manual Adjustment"),
                    ],
                    db_index=True,
                    max_length=30,
                )),
                ("amount_delta", models.DecimalField(
                    decimal_places=2,
                    default=0,
                    help_text="Positive = increase balance (customer owes more)",
                    max_digits=18,
                )),
                ("metal_delta_grams", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("reference_type", models.CharField(blank=True, default="", max_length=50)),
                ("reference_id", models.CharField(blank=True, default="", max_length=50)),
                ("notes", models.TextField(blank=True, default="")),
                ("txn_date", models.DateField(db_index=True)),
                ("tenant", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="+",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="+",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("updated_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="+",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("balance", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="movements",
                    to="jewellery.partyoutstandingbalance",
                )),
            ],
            options={"ordering": ["-txn_date", "-created_at"]},
        ),
    ]
