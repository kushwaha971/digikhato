# Jewellery inventory models — Phase B-1.3

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jewellery", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ------------------------------------------------------------------
        # Item (physical piece)
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="Item",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("sku", models.CharField(blank=True, db_index=True, default="", max_length=100)),
                ("barcode", models.CharField(blank=True, db_index=True, default="", max_length=200)),
                ("huid", models.CharField(blank=True, db_index=True, default="", max_length=20)),
                ("gross_wt", models.DecimalField(decimal_places=4, max_digits=12)),
                ("net_wt", models.DecimalField(decimal_places=4, max_digits=12)),
                ("stone_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("less_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("charge_wt", models.DecimalField(decimal_places=4, default=0, max_digits=12)),
                ("status", models.CharField(
                    choices=[
                        ("IN_STOCK", "In Stock"),
                        ("SOLD", "Sold"),
                        ("ISSUED", "Issued to Karigar"),
                        ("TRANSIT", "Inter-branch Transit"),
                        ("WRITTEN_OFF", "Written Off"),
                    ],
                    db_index=True,
                    default="IN_STOCK",
                    max_length=20,
                )),
                ("location_bin", models.CharField(blank=True, default="", max_length=100)),
                ("image_urls", models.JSONField(blank=True, default=list)),
                ("cost_price", models.DecimalField(blank=True, decimal_places=2, max_digits=18, null=True)),
                ("mrp", models.DecimalField(blank=True, decimal_places=2, max_digits=18, null=True)),
                ("design", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="items", to="jewellery.design")),
                ("metal", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="items", to="jewellery.metal")),
                ("purity", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="items", to="jewellery.purity")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="item",
            index=models.Index(fields=["tenant", "branch_name", "status", "design"], name="jwl_item_tenant_branch_status_idx"),
        ),
        migrations.AddIndex(
            model_name="item",
            index=models.Index(fields=["barcode"], name="jwl_item_barcode_idx"),
        ),
        migrations.AddIndex(
            model_name="item",
            index=models.Index(fields=["huid"], name="jwl_item_huid_idx"),
        ),
        migrations.AddIndex(
            model_name="item",
            index=models.Index(fields=["sku"], name="jwl_item_sku_idx"),
        ),

        # ------------------------------------------------------------------
        # Diamond
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="Diamond",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("cut", models.CharField(blank=True, default="", max_length=50)),
                ("color", models.CharField(blank=True, default="", max_length=10)),
                ("clarity", models.CharField(blank=True, default="", max_length=10)),
                ("carat", models.DecimalField(decimal_places=3, max_digits=8)),
                ("certificate_no", models.CharField(blank=True, default="", max_length=100)),
                ("certificate_lab", models.CharField(blank=True, default="", max_length=50)),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="diamonds", to="jewellery.item")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["created_at"]},
        ),

        # ------------------------------------------------------------------
        # Stone
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="Stone",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("stone_type", models.CharField(max_length=50)),
                ("count", models.PositiveIntegerField(default=1)),
                ("weight_carat", models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True)),
                ("description", models.TextField(blank=True, default="")),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stones", to="jewellery.item")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["stone_type"]},
        ),

        # ------------------------------------------------------------------
        # StockMovement
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="StockMovement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("movement_type", models.CharField(
                    choices=[
                        ("PURCHASE_IN", "Purchase In"),
                        ("SALE_OUT", "Sale Out"),
                        ("KARIGAR_ISSUE", "Karigar Issue"),
                        ("KARIGAR_RECEIVE", "Karigar Receive"),
                        ("TRANSFER_OUT", "Transfer Out"),
                        ("TRANSFER_IN", "Transfer In"),
                        ("ADJUSTMENT", "Adjustment"),
                        ("WRITE_OFF", "Write Off"),
                        ("RETURN_IN", "Return In"),
                        ("RETURN_OUT", "Return Out"),
                    ],
                    db_index=True,
                    max_length=20,
                )),
                ("reference_type", models.CharField(blank=True, default="", max_length=50)),
                ("reference_id", models.UUIDField(blank=True, null=True)),
                ("qty", models.IntegerField(default=1)),
                ("weight", models.DecimalField(decimal_places=4, max_digits=12)),
                ("rate", models.DecimalField(blank=True, decimal_places=2, max_digits=18, null=True)),
                ("value", models.DecimalField(blank=True, decimal_places=2, max_digits=18, null=True)),
                ("ts", models.DateTimeField(db_index=True)),
                ("notes", models.TextField(blank=True, default="")),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="movements", to="jewellery.item")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-ts"]},
        ),
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["item", "ts"], name="jwl_movement_item_ts_idx"),
        ),
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["tenant", "movement_type", "ts"], name="jwl_movement_tenant_type_ts_idx"),
        ),

        # ------------------------------------------------------------------
        # Transfer
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="Transfer",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("from_branch", models.CharField(max_length=120)),
                ("to_branch", models.CharField(max_length=120)),
                ("status", models.CharField(
                    choices=[
                        ("REQUESTED", "Requested"),
                        ("APPROVED", "Approved"),
                        ("IN_TRANSIT", "In Transit"),
                        ("RECEIVED", "Received"),
                        ("REJECTED", "Rejected"),
                    ],
                    db_index=True,
                    default="REQUESTED",
                    max_length=20,
                )),
                ("dispatched_at", models.DateTimeField(blank=True, null=True)),
                ("received_at", models.DateTimeField(blank=True, null=True)),
                ("notes", models.TextField(blank=True, default="")),
                ("approved_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="transfer",
            index=models.Index(fields=["tenant", "status", "created_at"], name="jwl_transfer_tenant_status_idx"),
        ),

        # ------------------------------------------------------------------
        # TransferLine
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="TransferLine",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("qty", models.IntegerField(default=1)),
                ("weight", models.DecimalField(decimal_places=4, max_digits=12)),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="transfer_lines", to="jewellery.item")),
                ("transfer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lines", to="jewellery.transfer")),
            ],
            options={"ordering": ["id"]},
        ),

        # ------------------------------------------------------------------
        # StockTake
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="StockTake",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("branch_name", models.CharField(blank=True, db_index=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("started_at", models.DateTimeField()),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("status", models.CharField(
                    choices=[
                        ("IN_PROGRESS", "In Progress"),
                        ("COMPLETED", "Completed"),
                        ("CANCELLED", "Cancelled"),
                    ],
                    db_index=True,
                    default="IN_PROGRESS",
                    max_length=20,
                )),
                ("notes", models.TextField(blank=True, default="")),
                ("conducted_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-started_at"]},
        ),
        migrations.AddIndex(
            model_name="stocktake",
            index=models.Index(fields=["tenant", "status", "started_at"], name="jwl_stocktake_tenant_status_idx"),
        ),

        # ------------------------------------------------------------------
        # StockTakeLine
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="StockTakeLine",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("system_qty", models.IntegerField()),
                ("system_wt", models.DecimalField(decimal_places=4, max_digits=12)),
                ("counted_qty", models.IntegerField(blank=True, null=True)),
                ("counted_wt", models.DecimalField(blank=True, decimal_places=4, max_digits=12, null=True)),
                ("variance", models.DecimalField(blank=True, decimal_places=4, max_digits=12, null=True)),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="stock_take_lines", to="jewellery.item")),
                ("stock_take", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lines", to="jewellery.stocktake")),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.AddConstraint(
            model_name="stocktakeline",
            constraint=models.UniqueConstraint(fields=("stock_take", "item"), name="uniq_jwl_stocktakeline_take_item"),
        ),
    ]
