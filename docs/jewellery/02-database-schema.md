# DK-JWL-02 — Database Schema Planning

**Document ID:** DK-JWL-02  
**Version:** 1.0  
**Date:** 2026-05-02  

All models use PostgreSQL via Django ORM. Every domain table extends `JewelleryBaseModel` which provides common columns.

---

## Base Model (Mixin)

```python
# apps/jewellery/models/base.py
import uuid
from django.db import models

class JewelleryBaseModel(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant      = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, db_index=True)
    branch      = models.ForeignKey('core.Branch', on_delete=models.SET_NULL, null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    created_by  = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_by  = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='+')
    deleted_at  = models.DateTimeField(null=True, blank=True)   # soft delete
    version     = models.PositiveIntegerField(default=1)        # optimistic locking

    class Meta:
        abstract = True
```

**Money:** `DecimalField(max_digits=18, decimal_places=2)`  
**Weight:** `DecimalField(max_digits=12, decimal_places=4)` (grams, 4 decimals)  
**Purity:** `DecimalField(max_digits=6, decimal_places=3)` (e.g., 91.600 for 22K)

---

## Section 1 — Master Data

### Metal & Purity

```python
class Metal(models.Model):
    code = models.CharField(max_length=10, unique=True)  # GOLD, SILVER, PLAT
    name = models.CharField(max_length=50)
    default_unit = models.CharField(max_length=10, default='gram')

class Purity(models.Model):
    metal = models.ForeignKey(Metal, on_delete=models.CASCADE)
    code  = models.CharField(max_length=10)   # 24K, 22K, 18K, 14K, 9K, S999, S925
    pct   = models.DecimalField(max_digits=6, decimal_places=3)  # 91.600
    class Meta:
        unique_together = ('metal', 'code')
```

### Category (Self-referencing tree)

```python
class Category(JewelleryBaseModel):
    parent       = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    name         = models.CharField(max_length=100)
    hsn_code     = models.CharField(max_length=10, blank=True)
    default_making_charge_formula = models.CharField(
        max_length=20, choices=[('PER_GRAM','Per Gram'),('PCT_METAL','% of Metal'),('PER_PIECE','Per Piece')]
    )
    default_wastage_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
```

### Design (Item Template)

```python
class Design(JewelleryBaseModel):
    category    = models.ForeignKey(Category, on_delete=models.PROTECT)
    code        = models.CharField(max_length=50)
    name        = models.CharField(max_length=200)
    image_urls  = models.JSONField(default=list)     # list of S3 URLs
    default_weight = models.DecimalField(max_digits=12, decimal_places=4, null=True)
    default_stones = models.JSONField(default=dict)  # stone specs
    default_labour = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    bom            = models.JSONField(default=dict)  # bill of materials
```

### Item (Physical Piece)

```python
class Item(JewelleryBaseModel):
    STATUS = [('IN_STOCK','In Stock'),('SOLD','Sold'),('ISSUED','Issued to Karigar'),
              ('TRANSIT','Inter-branch Transit'),('WRITTEN_OFF','Written Off')]

    design      = models.ForeignKey(Design, on_delete=models.PROTECT)
    sku         = models.CharField(max_length=100, blank=True)
    barcode     = models.CharField(max_length=200, blank=True)
    huid        = models.CharField(max_length=20, blank=True)  # BIS HUID
    metal       = models.ForeignKey(Metal, on_delete=models.PROTECT)
    purity      = models.ForeignKey(Purity, on_delete=models.PROTECT)
    gross_wt    = models.DecimalField(max_digits=12, decimal_places=4)
    net_wt      = models.DecimalField(max_digits=12, decimal_places=4)
    stone_wt    = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    less_wt     = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    charge_wt   = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    status      = models.CharField(max_length=20, choices=STATUS, default='IN_STOCK')
    location_bin = models.CharField(max_length=100, blank=True)
    image_urls  = models.JSONField(default=list)
    cost_price  = models.DecimalField(max_digits=18, decimal_places=2, null=True)
    mrp         = models.DecimalField(max_digits=18, decimal_places=2, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'branch', 'status', 'design']),
            models.Index(fields=['barcode']),
            models.Index(fields=['huid']),
        ]
```

### Stone & Diamond (linked to Item)

```python
class Diamond(JewelleryBaseModel):
    item         = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='diamonds')
    cut          = models.CharField(max_length=50, blank=True)
    color        = models.CharField(max_length=10, blank=True)
    clarity      = models.CharField(max_length=10, blank=True)
    carat        = models.DecimalField(max_digits=8, decimal_places=3)
    certificate_no  = models.CharField(max_length=100, blank=True)
    certificate_lab = models.CharField(max_length=50, blank=True)

class Stone(JewelleryBaseModel):
    item         = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stones')
    stone_type   = models.CharField(max_length=50)  # kundan, jadau, ruby, emerald…
    count        = models.PositiveIntegerField(default=1)
    weight_carat = models.DecimalField(max_digits=8, decimal_places=3, null=True)
    description  = models.TextField(blank=True)
```

---

## Section 2 — Inventory Movements

```python
class StockMovement(JewelleryBaseModel):
    MOVEMENT_TYPES = [
        ('PURCHASE_IN','Purchase In'), ('SALE_OUT','Sale Out'),
        ('KARIGAR_ISSUE','Karigar Issue'), ('KARIGAR_RECEIVE','Karigar Receive'),
        ('TRANSFER_OUT','Transfer Out'), ('TRANSFER_IN','Transfer In'),
        ('ADJUSTMENT','Adjustment'), ('WRITE_OFF','Write Off'),
        ('RETURN_IN','Return In'), ('RETURN_OUT','Return Out'),
    ]
    item           = models.ForeignKey(Item, on_delete=models.PROTECT)
    movement_type  = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    reference_type = models.CharField(max_length=50)   # 'sales_invoice', 'karigar_issue'…
    reference_id   = models.UUIDField()
    qty            = models.IntegerField(default=1)
    weight         = models.DecimalField(max_digits=12, decimal_places=4)
    rate           = models.DecimalField(max_digits=18, decimal_places=2, null=True)
    value          = models.DecimalField(max_digits=18, decimal_places=2, null=True)
    ts             = models.DateTimeField()

class Transfer(JewelleryBaseModel):
    STATUS = [('REQUESTED','Requested'),('APPROVED','Approved'),
              ('IN_TRANSIT','In Transit'),('RECEIVED','Received'),('REJECTED','Rejected')]
    from_branch = models.ForeignKey('core.Branch', on_delete=models.PROTECT, related_name='transfers_out')
    to_branch   = models.ForeignKey('core.Branch', on_delete=models.PROTECT, related_name='transfers_in')
    status      = models.CharField(max_length=20, choices=STATUS)
    dispatched_at = models.DateTimeField(null=True)
    received_at   = models.DateTimeField(null=True)

class TransferLine(models.Model):
    transfer = models.ForeignKey(Transfer, on_delete=models.CASCADE, related_name='lines')
    item     = models.ForeignKey(Item, on_delete=models.PROTECT)
    qty      = models.IntegerField(default=1)
    weight   = models.DecimalField(max_digits=12, decimal_places=4)

class StockTake(JewelleryBaseModel):
    started_at    = models.DateTimeField()
    completed_at  = models.DateTimeField(null=True)
    status        = models.CharField(max_length=20, default='IN_PROGRESS')
    conducted_by  = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)

class StockTakeLine(models.Model):
    stock_take  = models.ForeignKey(StockTake, on_delete=models.CASCADE, related_name='lines')
    item        = models.ForeignKey(Item, on_delete=models.PROTECT)
    system_qty  = models.IntegerField()
    system_wt   = models.DecimalField(max_digits=12, decimal_places=4)
    counted_qty = models.IntegerField(null=True)
    counted_wt  = models.DecimalField(max_digits=12, decimal_places=4, null=True)
    variance    = models.DecimalField(max_digits=12, decimal_places=4, null=True)
```

---

## Section 3 — Billing & Sales

```python
class Customer(JewelleryBaseModel):
    code        = models.CharField(max_length=50)
    name        = models.CharField(max_length=200)
    mobile      = models.CharField(max_length=15)
    email       = models.EmailField(blank=True)
    gstin       = models.CharField(max_length=15, blank=True)
    pan         = models.CharField(max_length=10, blank=True)
    dob         = models.DateField(null=True)
    anniversary = models.DateField(null=True)
    photo_url   = models.URLField(blank=True)
    kyc_status  = models.CharField(max_length=20, default='NONE')
    loyalty_points = models.IntegerField(default=0)

class SalesInvoice(JewelleryBaseModel):
    TYPES = [('TAX_INVOICE','Tax Invoice'),('ESTIMATE','Estimate'),
             ('CASH_MEMO','Cash Memo'),('NON_GST','Non-GST')]
    STATUS = [('DRAFT','Draft'),('ISSUED','Issued'),('CANCELLED','Cancelled')]

    voucher_no      = models.CharField(max_length=50)
    voucher_date    = models.DateField()
    customer        = models.ForeignKey(Customer, on_delete=models.PROTECT, null=True, blank=True)
    invoice_type    = models.CharField(max_length=20, choices=TYPES)
    gross_amount    = models.DecimalField(max_digits=18, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    taxable_amount  = models.DecimalField(max_digits=18, decimal_places=2)
    cgst            = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    sgst            = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    igst            = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    round_off       = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_amount    = models.DecimalField(max_digits=18, decimal_places=2)
    advance_used    = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    paid_amount     = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    balance_amount  = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    status          = models.CharField(max_length=20, choices=STATUS, default='DRAFT')
    e_invoice_irn   = models.CharField(max_length=200, blank=True)
    e_invoice_qr    = models.TextField(blank=True)
    place_of_supply = models.CharField(max_length=2, blank=True)   # state code

class SalesInvoiceLine(models.Model):
    invoice        = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE, related_name='lines')
    line_no        = models.PositiveIntegerField()
    item           = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True)
    description    = models.CharField(max_length=300)
    hsn_code       = models.CharField(max_length=10)
    metal          = models.ForeignKey(Metal, on_delete=models.SET_NULL, null=True, blank=True)
    purity         = models.ForeignKey(Purity, on_delete=models.SET_NULL, null=True, blank=True)
    gross_wt       = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    net_wt         = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    stone_wt       = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    rate_per_gram  = models.DecimalField(max_digits=18, decimal_places=4)
    metal_value    = models.DecimalField(max_digits=18, decimal_places=2)
    making_charge_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    making_charge_amt = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    wastage_pct    = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    wastage_amt    = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    hallmarking_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stone_value    = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    line_subtotal  = models.DecimalField(max_digits=18, decimal_places=2)
    gst_rate_pct   = models.DecimalField(max_digits=5, decimal_places=2)
    gst_amount     = models.DecimalField(max_digits=18, decimal_places=2)
    line_total     = models.DecimalField(max_digits=18, decimal_places=2)

class SalesInvoicePayment(models.Model):
    MODES = [('CASH','Cash'),('UPI','UPI'),('CARD','Card'),
             ('BANK','Bank Transfer'),('CHEQUE','Cheque'),('CREDIT','Credit'),('ADVANCE','Advance')]
    invoice   = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE, related_name='payments')
    mode      = models.CharField(max_length=10, choices=MODES)
    reference = models.CharField(max_length=200, blank=True)
    amount    = models.DecimalField(max_digits=18, decimal_places=2)
    ts        = models.DateTimeField(auto_now_add=True)
```

---

## Section 4 — Karigar & Orders

```python
class Karigar(JewelleryBaseModel):
    code                   = models.CharField(max_length=50)
    name                   = models.CharField(max_length=200)
    mobile                 = models.CharField(max_length=15)
    kyc_pan                = models.CharField(max_length=10, blank=True)
    kyc_aadhaar_masked     = models.CharField(max_length=4, blank=True)  # last 4 only
    default_labour_rate    = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    default_wastage_pct    = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    specialization         = models.CharField(max_length=100, blank=True)

class CustomerOrder(JewelleryBaseModel):
    STATUS_CHOICES = [
        ('BOOKED','Booked'), ('METAL_ISSUED','Metal Issued'),
        ('WIP','Work In Progress'), ('KARIGAR_RECEIVED','Received from Karigar'),
        ('QC','Quality Control'), ('HALLMARKED','Hallmarked'),
        ('READY','Ready for Delivery'), ('DELIVERED','Delivered'), ('CLOSED','Closed'),
        ('CANCELLED','Cancelled'),
    ]
    order_no         = models.CharField(max_length=50)
    order_date       = models.DateField()
    customer         = models.ForeignKey(Customer, on_delete=models.PROTECT)
    design           = models.ForeignKey(Design, on_delete=models.SET_NULL, null=True, blank=True)
    expected_delivery = models.DateField(null=True)
    advance_amount   = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BOOKED')

class KarigarIssue(JewelleryBaseModel):
    voucher_no           = models.CharField(max_length=50)
    date                 = models.DateField()
    karigar              = models.ForeignKey(Karigar, on_delete=models.PROTECT)
    order                = models.ForeignKey(CustomerOrder, on_delete=models.SET_NULL, null=True, blank=True)
    gross_wt_issued      = models.DecimalField(max_digits=12, decimal_places=4)
    tunch_pct            = models.DecimalField(max_digits=6, decimal_places=3)
    pure_gold_wt_issued  = models.DecimalField(max_digits=12, decimal_places=4)
    items_json           = models.JSONField(default=list)  # list of {item_id, weight}

class KarigarReceipt(JewelleryBaseModel):
    voucher_no              = models.CharField(max_length=50)
    date                    = models.DateField()
    karigar                 = models.ForeignKey(Karigar, on_delete=models.PROTECT)
    issue                   = models.ForeignKey(KarigarIssue, on_delete=models.PROTECT)
    gross_wt_received       = models.DecimalField(max_digits=12, decimal_places=4)
    net_wt                  = models.DecimalField(max_digits=12, decimal_places=4)
    stone_wt                = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    pure_gold_wt_received   = models.DecimalField(max_digits=12, decimal_places=4)
    wastage_actual_pct      = models.DecimalField(max_digits=5, decimal_places=2)
    labour_amount           = models.DecimalField(max_digits=18, decimal_places=2)
    status                  = models.CharField(max_length=20, default='DRAFT')
```

---

## Section 5 — Gold Pledge Loans

```python
class LoanScheme(JewelleryBaseModel):
    name             = models.CharField(max_length=100)
    ltv_pct          = models.DecimalField(max_digits=5, decimal_places=2)
    interest_method  = models.CharField(
        max_length=10, choices=[('SIMPLE','Simple'),('COMPOUND','Compound'),('FLAT','Flat'),('DAILY','Daily')]
    )
    interest_rate_pct = models.DecimalField(max_digits=6, decimal_places=3)  # per month
    min_tenure       = models.PositiveIntegerField()   # months
    max_tenure       = models.PositiveIntegerField()
    late_fee_pct     = models.DecimalField(max_digits=5, decimal_places=2, default=0)

class GoldPledgeLoan(JewelleryBaseModel):
    STATUS = [('ACTIVE','Active'),('RENEWED','Renewed'),('CLOSED','Closed'),
              ('AUCTIONED','Auctioned'),('LOSS','Loss')]
    loan_no              = models.CharField(max_length=50, unique=True)
    loan_date            = models.DateField()
    customer             = models.ForeignKey(Customer, on_delete=models.PROTECT)
    scheme               = models.ForeignKey(LoanScheme, on_delete=models.PROTECT)
    principal            = models.DecimalField(max_digits=18, decimal_places=2)
    interest_rate_pct    = models.DecimalField(max_digits=6, decimal_places=3)
    interest_method      = models.CharField(max_length=10)
    tenure_months        = models.PositiveIntegerField()
    ltv_pct              = models.DecimalField(max_digits=5, decimal_places=2)
    status               = models.CharField(max_length=20, choices=STATUS, default='ACTIVE')

class PledgeItem(models.Model):
    loan            = models.ForeignKey(GoldPledgeLoan, on_delete=models.CASCADE, related_name='pledge_items')
    line_no         = models.PositiveIntegerField()
    description     = models.CharField(max_length=300)
    metal           = models.ForeignKey(Metal, on_delete=models.PROTECT)
    purity          = models.ForeignKey(Purity, on_delete=models.PROTECT)
    gross_wt        = models.DecimalField(max_digits=12, decimal_places=4)
    net_wt          = models.DecimalField(max_digits=12, decimal_places=4)
    stone_wt        = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    photo_urls      = models.JSONField(default=list)
    valuation_rate  = models.DecimalField(max_digits=18, decimal_places=4)
    valuation_amount = models.DecimalField(max_digits=18, decimal_places=2)
    is_released     = models.BooleanField(default=False)

class LoanRepayment(JewelleryBaseModel):
    loan                = models.ForeignKey(GoldPledgeLoan, on_delete=models.CASCADE, related_name='repayments')
    date                = models.DateField()
    principal_paid      = models.DecimalField(max_digits=18, decimal_places=2)
    interest_paid       = models.DecimalField(max_digits=18, decimal_places=2)
    mode                = models.CharField(max_length=10)
    reference           = models.CharField(max_length=200, blank=True)
    items_released      = models.JSONField(default=list)   # list of pledge_item_ids
    balance_after       = models.DecimalField(max_digits=18, decimal_places=2)
```

---

## Section 6 — Rates

```python
class RateHistory(models.Model):
    metal      = models.ForeignKey(Metal, on_delete=models.PROTECT)
    purity     = models.ForeignKey(Purity, on_delete=models.PROTECT)
    source     = models.CharField(max_length=50, default='MCX')
    rate_per_gram = models.DecimalField(max_digits=18, decimal_places=4)
    ts         = models.DateTimeField()

    class Meta:
        indexes = [models.Index(fields=['metal', 'purity', 'ts'])]

class TenantRate(JewelleryBaseModel):
    metal           = models.ForeignKey(Metal, on_delete=models.PROTECT)
    purity          = models.ForeignKey(Purity, on_delete=models.PROTECT)
    buy_rate        = models.DecimalField(max_digits=18, decimal_places=4)
    sell_rate       = models.DecimalField(max_digits=18, decimal_places=4)
    override_at     = models.DateTimeField(auto_now=True)
    override_by     = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='+')
    override_reason = models.TextField(blank=True)
```

---

## Section 7 — Key Indexes & Constraints

```sql
-- Phase 1 critical indexes
CREATE INDEX jwl_item_tenant_branch_status ON jewellery_item (tenant_id, branch_id, status, design_id);
CREATE INDEX jwl_invoice_tenant_date ON jewellery_salesinvoice (tenant_id, branch_id, voucher_date);
CREATE INDEX jwl_movement_item ON jewellery_stockmovement (item_id, ts);
CREATE INDEX jwl_rate_history ON jewellery_ratehistory (metal_id, purity_id, ts DESC);

-- Phase 2 additions
CREATE INDEX jwl_pledge_loan_status ON jewellery_goldpledgeloan (tenant_id, status, loan_date);
CREATE INDEX jwl_karigar_ledger ON jewellery_karigarledger (tenant_id, karigar_id);
```

---

## Section 8 — Multi-Tenant Row-Level Security

Django enforces tenant isolation in the ORM layer via queryset filtering.  
Every `ViewSet` uses `get_queryset()` filtered by `request.tenant`.

```python
class JewelleryBaseViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return super().get_queryset().filter(
            tenant=self.request.tenant,
            deleted_at__isnull=True,
        )
```

For reports/analytics that cross tables, raw SQL must include `tenant_id = %s` in every sub-query.

---

## Section 9 — Migration Strategy

1. All jewellery models in `apps/jewellery/migrations/`
2. Initial migration: `0001_initial.py` — all Phase 1 tables
3. Phase 2 tables in separate migration `0002_phase2.py`
4. Seed data via management command: `python manage.py seed_jewellery_defaults`
5. Backwards-compatible: adding jewellery app does not touch existing `loans`/`udhhar` tables
