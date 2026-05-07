"""Migration for gold pledge loan models (Phase B-2.5)."""

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0008_karigar"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LoanScheme",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("name", models.CharField(max_length=100)),
                ("ltv_pct", models.DecimalField(decimal_places=2, max_digits=5)),
                ("interest_method", models.CharField(
                    choices=[
                        ("SIMPLE", "Simple"),
                        ("COMPOUND", "Compound"),
                        ("FLAT", "Flat"),
                        ("DAILY", "Daily"),
                    ],
                    max_length=10,
                )),
                ("interest_rate_pct", models.DecimalField(decimal_places=3, max_digits=6)),
                ("min_tenure", models.PositiveIntegerField()),
                ("max_tenure", models.PositiveIntegerField()),
                ("late_fee_pct", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("is_active", models.BooleanField(default=True)),
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
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="GoldPledgeLoan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("loan_no", models.CharField(db_index=True, max_length=50)),
                ("loan_date", models.DateField()),
                ("principal", models.DecimalField(decimal_places=2, max_digits=18)),
                ("interest_rate_pct", models.DecimalField(decimal_places=3, max_digits=6)),
                ("interest_method", models.CharField(max_length=10)),
                ("tenure_months", models.PositiveIntegerField()),
                ("ltv_pct", models.DecimalField(decimal_places=2, max_digits=5)),
                ("status", models.CharField(
                    choices=[
                        ("ACTIVE", "Active"),
                        ("RENEWED", "Renewed"),
                        ("CLOSED", "Closed"),
                        ("AUCTIONED", "Auctioned"),
                        ("LOSS", "Loss"),
                    ],
                    db_index=True,
                    default="ACTIVE",
                    max_length=20,
                )),
                ("maturity_date", models.DateField(blank=True, null=True)),
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
                ("customer", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="pledge_loans",
                    to="jewellery.customer",
                )),
                ("scheme", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    to="jewellery.loanscheme",
                )),
            ],
            options={"ordering": ["-loan_date"]},
        ),
        migrations.CreateModel(
            name="PledgeItem",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("line_no", models.PositiveIntegerField()),
                ("description", models.CharField(blank=True, default="", max_length=300)),
                ("gross_wt", models.DecimalField(decimal_places=4, max_digits=12)),
                ("net_wt", models.DecimalField(decimal_places=4, max_digits=12)),
                ("stone_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("valuation_rate", models.DecimalField(decimal_places=4, max_digits=18)),
                ("valuation_amount", models.DecimalField(decimal_places=2, max_digits=18)),
                ("is_released", models.BooleanField(default=False)),
                ("loan", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="pledge_items",
                    to="jewellery.goldpledgeloan",
                )),
                ("metal", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    to="jewellery.metal",
                )),
                ("purity", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    to="jewellery.purity",
                )),
            ],
            options={"ordering": ["line_no"]},
        ),
        migrations.CreateModel(
            name="LoanRepayment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("date", models.DateField()),
                ("principal_paid", models.DecimalField(decimal_places=2, max_digits=18)),
                ("interest_paid", models.DecimalField(decimal_places=2, max_digits=18)),
                ("mode", models.CharField(
                    choices=[
                        ("CASH", "Cash"),
                        ("UPI", "UPI"),
                        ("CARD", "Card"),
                        ("BANK", "Bank Transfer"),
                        ("CHEQUE", "Cheque"),
                    ],
                    max_length=10,
                )),
                ("reference", models.CharField(blank=True, default="", max_length=200)),
                ("items_released", models.JSONField(default=list)),
                ("balance_after", models.DecimalField(decimal_places=2, max_digits=18)),
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
                ("loan", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="repayments",
                    to="jewellery.goldpledgeloan",
                )),
            ],
            options={"ordering": ["-date"]},
        ),
    ]
