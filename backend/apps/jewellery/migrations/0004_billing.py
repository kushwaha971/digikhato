# Jewellery billing models — Phase B-1.5
# Hand-written because Python 3.9 syntax in other apps blocks makemigrations.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0003_rates"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [

        # ── Customer ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("name", models.CharField(db_index=True, max_length=200)),
                ("mobile", models.CharField(blank=True, db_index=True, default="", max_length=15)),
                ("email", models.EmailField(blank=True, default="")),
                ("gstin", models.CharField(blank=True, db_index=True, default="", max_length=15)),
                ("pan", models.CharField(blank=True, default="", max_length=10)),
                ("state_code", models.CharField(blank=True, default="", max_length=2)),
                ("address", models.TextField(blank=True, default="")),
                ("city", models.CharField(blank=True, default="", max_length=100)),
                ("dob", models.DateField(blank=True, null=True)),
                ("anniversary", models.DateField(blank=True, null=True)),
                ("loyalty_points", models.PositiveIntegerField(default=0)),
                ("tenant", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),

        # ── SalesInvoice ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="SalesInvoice",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("invoice_type", models.CharField(
                    choices=[("TAX_INVOICE", "Tax Invoice"), ("ESTIMATE", "Estimate"), ("CASH_MEMO", "Cash Memo"), ("NON_GST", "Non-GST Bill")],
                    db_index=True, default="TAX_INVOICE", max_length=20,
                )),
                ("status", models.CharField(
                    choices=[("DRAFT", "Draft"), ("ISSUED", "Issued"), ("CANCELLED", "Cancelled")],
                    db_index=True, default="DRAFT", max_length=20,
                )),
                ("voucher_no", models.CharField(blank=True, db_index=True, default="", max_length=50)),
                ("voucher_date", models.DateField(blank=True, null=True)),
                ("place_of_supply_state_code", models.CharField(blank=True, default="", max_length=2)),
                ("seller_state_code", models.CharField(blank=True, default="", max_length=2)),
                ("is_inter_state", models.BooleanField(default=False)),
                ("gross_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("discount_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("taxable_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("stone_value", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("cgst", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("sgst", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("igst", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("hallmark_gst", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("round_off", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("advance_used", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("paid_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("balance_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("issued_at", models.DateTimeField(blank=True, null=True)),
                ("cancelled_at", models.DateTimeField(blank=True, null=True)),
                ("cancel_reason", models.TextField(blank=True, default="")),
                ("notes", models.TextField(blank=True, default="")),
                ("tenant", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("customer", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="invoices", to="jewellery.customer")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("issued_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("cancelled_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="salesinvoice",
            index=models.Index(fields=["tenant", "status", "voucher_date"], name="jwl_invoice_tenant_status_idx"),
        ),

        # ── SalesInvoiceLine ──────────────────────────────────────────────────
        migrations.CreateModel(
            name="SalesInvoiceLine",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("line_no", models.PositiveSmallIntegerField(default=1)),
                ("description", models.CharField(blank=True, default="", max_length=300)),
                ("hsn_code", models.CharField(blank=True, default="", max_length=10)),
                ("metal_code", models.CharField(blank=True, default="", max_length=10)),
                ("purity_code", models.CharField(blank=True, default="", max_length=10)),
                ("gross_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("net_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("stone_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("rate_per_gram", models.DecimalField(decimal_places=4, default=0, max_digits=18)),
                ("metal_value", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("making_mode", models.CharField(
                    choices=[("PER_GRAM", "Per Gram"), ("PCT_METAL", "% of Metal Value"), ("PER_PIECE", "Per Piece")],
                    default="PER_GRAM", max_length=20,
                )),
                ("making_rate", models.DecimalField(decimal_places=4, default=0, max_digits=18)),
                ("making_charge", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("wastage_pct", models.DecimalField(decimal_places=3, default=0, max_digits=6)),
                ("wastage_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("hallmarking_fee", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("stone_value", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("gst_rate_pct", models.DecimalField(decimal_places=2, default=3, max_digits=5)),
                ("line_metal_part", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("gst_amount", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("hallmark_gst_amount", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("discount_allocated", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("line_subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("line_total", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lines", to="jewellery.salesinvoice")),
                ("item", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="invoice_lines", to="jewellery.item")),
            ],
            options={"ordering": ["line_no"]},
        ),

        # ── SalesInvoicePayment ───────────────────────────────────────────────
        migrations.CreateModel(
            name="SalesInvoicePayment",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("mode", models.CharField(
                    choices=[("CASH", "Cash"), ("UPI", "UPI"), ("CARD", "Card"), ("BANK", "Bank Transfer"), ("ADVANCE", "Advance Adjustment"), ("CHEQUE", "Cheque"), ("OTHER", "Other")],
                    default="CASH", max_length=20,
                )),
                ("amount", models.DecimalField(decimal_places=2, max_digits=18)),
                ("reference", models.CharField(blank=True, default="", max_length=100)),
                ("paid_at", models.DateTimeField(auto_now_add=True)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payments", to="jewellery.salesinvoice")),
            ],
            options={"ordering": ["paid_at"]},
        ),

        # ── OldGoldPurchase ───────────────────────────────────────────────────
        migrations.CreateModel(
            name="OldGoldPurchase",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("metal_code", models.CharField(default="GOLD", max_length=10)),
                ("description", models.CharField(blank=True, default="", max_length=200)),
                ("gross_wt", models.DecimalField(decimal_places=4, max_digits=12)),
                ("tested_purity", models.DecimalField(decimal_places=3, max_digits=6)),
                ("pure_grams", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("buy_rate_per_gram", models.DecimalField(decimal_places=4, default=0, max_digits=18)),
                ("deduction_value", models.DecimalField(decimal_places=2, default=0, max_digits=18)),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="old_gold_purchases", to="jewellery.salesinvoice")),
            ],
            options={"ordering": ["id"]},
        ),
    ]
