# DK-JWL-04 — UI/UX Mapping

**Document ID:** DK-JWL-04  
**Version:** 1.0  
**Date:** 2026-05-02  

---

## Design Principles

1. **Mobile-first PWA** — same principle as existing DigiKhaato modules; optimized for small screens first
2. **Action-oriented** — the most common action (create invoice, record repayment) is always one tap away
3. **Rate-aware** — live MCX rate is always visible on billing screens; auto-fills rate fields
4. **Print-ready** — every document (invoice, statement, tag) has a print/share action
5. **Jewellery color palette** — accent color `#C49A22` (gold) matches the sidebar reference

---

## Route Structure

```
/jewellery                          → Module home / Dashboard
/jewellery/dashboard                → KPI overview

/jewellery/billing                  → Invoice list
/jewellery/billing/new              → Create invoice / estimate
/jewellery/billing/:id              → Invoice detail (view, print, share)
/jewellery/billing/old-gold/new     → Old gold purchase

/jewellery/inventory                → Item list
/jewellery/inventory/new            → Add item
/jewellery/inventory/:id            → Item detail + movement history
/jewellery/inventory/stock-take/new → Start physical stock-take
/jewellery/inventory/transfers      → Transfer list
/jewellery/inventory/transfers/new  → Create transfer

/jewellery/master                   → Master data hub
/jewellery/master/categories        → Category tree
/jewellery/master/designs           → Design library
/jewellery/master/tax-slabs         → Tax slab editor
/jewellery/master/number-series     → Number series

/jewellery/karigar                  → Karigar list
/jewellery/karigar/:id              → Karigar ledger
/jewellery/orders                   → Order list (kanban/list toggle)
/jewellery/orders/new               → Create order
/jewellery/orders/:id               → Order detail + status timeline

/jewellery/accounts                 → Accounts overview
/jewellery/accounts/vouchers/new    → Create voucher
/jewellery/accounts/cashbook        → Cash book
/jewellery/accounts/ledger/:id      → Account ledger

/jewellery/pledge                   → Gold pledge loan list
/jewellery/pledge/new               → New loan wizard
/jewellery/pledge/:id               → Loan detail
/jewellery/pledge/schemes           → Loan schemes

/jewellery/outstanding              → Party outstanding table

/jewellery/reports                  → Report hub
/jewellery/reports/gstr             → GST reports
/jewellery/reports/profitability    → Profitability
/jewellery/reports/stock            → Stock reports

/jewellery/settings                 → Admin controls
/jewellery/settings/users           → User + role management
/jewellery/settings/branches        → Branch management
/jewellery/settings/rates           → MCX rate + override
```

---

## Screen Descriptions

### Dashboard `/jewellery/dashboard`

Top cards (4):
- Today's Sales (₹ amount + count)
- Stock Value (at current MCX rate)
- Open Orders (count + oldest)
- Pledge Loans Due (count + total overdue)

Quick actions bar:
- [New Invoice] [Record Repayment] [Check Rate] [Scan Item]

Recent activity feed: last 10 events (invoice, repayment, karigar receive)

---

### Invoice Creation `/jewellery/billing/new`

Layout (desktop: 2-column; mobile: stacked):

**Left panel — Line Items**
- Customer search (autocomplete by name/mobile)
- Invoice type toggle: [Tax Invoice] [Estimate] [Cash Memo]
- MCX rate bar (auto-refreshed, click to override)
- Line item table:
  - `+` Add item (scan tag OR search by SKU/design/name)
  - Per line: metal, purity, gross/net/stone weight, rate (auto-filled from MCX), making charge %, wastage %, HSN
  - Computed columns: metal value, making ₹, wastage ₹, GST ₹, line total
  - Special lines: hallmarking fee, repair charge (fixed amount)
- Old gold exchange section (collapsible): gross wt, purity tested → deduction auto-calculated

**Right panel — Summary**
- Line subtotals
- Bill discount (₹ or %)
- Taxable amount
- CGST / SGST / IGST breakdown
- Round-off
- **Total Payable (large)**
- Payment split: Cash + UPI + Card + Bank + Advance (add rows)
- Balance due / Change due

**Footer actions:**  
[Save Draft] [Issue Invoice] [Preview PDF]

---

### Item Detail `/jewellery/inventory/:id`

Header: item image gallery (swipe), status badge, location bin

Tabs:
1. **Details** — all weight fields, purity, HUID, barcode
2. **Movement History** — timeline: purchase → karigar issue → karigar receive → sale
3. **Documents** — linked invoice/voucher PDFs
4. **Tags** — print tag button, tag history

---

### Order Kanban `/jewellery/orders`

9-column kanban (scrollable horizontally on mobile; list view toggle):
```
BOOKED | METAL ISSUED | WIP | KARIGAR RCVD | QC | HALLMARKED | READY | DELIVERED | CLOSED
```

Each card shows: order no, customer name, design, expected date (red if overdue)

Click card → order detail modal with full status timeline

---

### Gold Pledge Loan Wizard `/jewellery/pledge/new`

4-step wizard:

**Step 1 — KYC**
- Customer search / new customer
- PAN (masked), Aadhaar (last 4 only displayed)
- Upload photo, signature, address proof

**Step 2 — Pledge Items**
- Add items: description, metal, purity, weights, photo upload
- System shows valuation at current MCX buy rate per item
- Total pledge value shown

**Step 3 — Scheme & Calculation**
- Scheme selector
- LTV % (from scheme), max loan amount (auto-calculated)
- Editable principal (≤ max_loan)
- Interest preview table: monthly due amounts

**Step 4 — Disbursal**
- Mode: Cash / Bank / UPI / Cheque
- Amount confirmation
- 2-person approval checkbox (if above threshold)

---

### Sidebar Component

Reusable React component based on `digikhaato_jewellery_sidebar.html` reference.  
Sections and nav items:

```
OVERVIEW
  ◈ Dashboard

MODULES 1–8
  ₹ Billing & Sales
      Tax Invoice (GST)
      Estimate / Quotation
      Sale Return / Credit Note
      Old Gold Exchange
      E-Invoice (IRN+QR)
      Split Payment Modes
      Print Templates
  ▦ Stock & Inventory
      Item Master
      Purity Tracking
      Barcode / QR / RFID
      HUID / BIS Hallmark
      Physical Stock-take
      Live MCX Valuation
  ⚒ Order & Karigar
      Customer Order
      Metal Issue Voucher
      Karigar Receipt
      Tunch Reconciliation
      Wastage Reconciliation
      Labour Bill
  ⊞ Accounts & Ledger
  ✦ GST & Reports
  ⇄ Party Outstanding
  ⬡ Gold Pledge Loans
      KYC Capture
      Pledge Entry
      Loan Disbursal
      Interest Schemes
      Top-up / Renewal
      Foreclosure
      Auction & P&L

MODULES 9–15
  ◉ Users & Roles
  ⊕ Multi-Branch
  ▣ Barcode / RFID
  ↑ MCX Live Rate
  ✉ Notifications
  ⚙ Admin Controls
```

---

## Component Library (Shared within Jewellery Module)

| Component | Purpose |
|-----------|---------|
| `RateTicker` | Live MCX rate bar, stale indicator, override button |
| `WeightInput` | Decimal input with unit label (g), validates 4 decimal places |
| `PuritySelector` | Metal + purity cascading dropdown |
| `InvoiceLineRow` | Full line item row with computed totals |
| `GstBreakdown` | CGST/SGST/IGST split card |
| `PaymentSplitTable` | Multi-row payment mode entry |
| `ItemScanner` | Camera QR/barcode + manual fallback |
| `KycUpload` | File upload for PAN/Aadhaar/photo with masking preview |
| `OrderStatusBadge` | Color-coded status chip (9 states) |
| `PledgeItemCard` | Photo + weight + purity card for pledge items |
| `LoanInterestPreview` | Monthly interest schedule table |
| `TagPrintButton` | Triggers tag PDF generation and print dialog |

---

## Mobile-Specific UX Notes

- **Bottom navigation** for jewellery module: [Bills] [Stock] [Orders] [Pledge] [More]
- **Floating action button** on list pages → new invoice / new item
- Invoice creation line items use full-screen modal on mobile (not inline table)
- QR scan uses device camera; fallback: manual barcode/HUID entry
- PDF share via native share sheet (navigator.share) → WhatsApp, SMS, email
- Rate ticker collapses to a small gold pill at top of screen on mobile

---

## Accessibility

- All touch targets ≥ 44×44px
- Weight/amount inputs use numeric keyboard (`inputMode="decimal"`)
- Status badges have text labels, not color-only
- Print views use `@media print` CSS, hiding nav/sidebar
