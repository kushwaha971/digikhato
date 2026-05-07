# DigiKhaato Jewellery ERP — Partially Wired Features
## Implementation Planning Document

**Version:** 1.0  
**Date:** 2026-05-07  
**Reviewed by:** QA Engineer · UI/UX Developer · Backend Developer · Business Analyst · Shopkeeper · Business Owner  
**Scope:** Five features with working backends but missing or broken frontends

---

## How to Use This Document

Each feature section is structured identically:
1. Status snapshot (what works today)
2. Priority and risk rating
3. Business rules
4. User flow
5. UI/UX specification
6. Backend gaps and required changes
7. Test cases (positive · negative · edge · regression)
8. Risks and open questions

Read the **Priority Matrix** first to decide build order. Then implement feature by feature top-down.

---

## Priority Matrix

| Feature | Priority | Blocking? | Compliance Risk |
|---------|----------|-----------|-----------------|
| Invoice Item Search | **P0** | Blocks all billing | Medium (wrong HSN) |
| E-Invoice IRN Disclaimer | **P0** | Legal liability TODAY | **CRITICAL** |
| Outstanding / Party Ledger | **P1** | Blocks month-end close | Medium |
| Karigar Edit | **P1** | Daily ops friction | Low |
| Inventory Purity/HUID | **P1 (HUID on invoice = P0)** | BIS compliance | **HIGH** |

> **Rule:** P0 items must be resolved before any paid customer demo. P1 items must be complete within the first billing cycle (30 days of go-live).

---

---

# Feature 1 — Invoice Item Search

## 1.1 Status Today

| Layer | State |
|-------|-------|
| Backend | ✅ `ItemViewSet` has `?search=` (matches sku, barcode, huid), `?purity=`, `?status=`, `?design=`, `/items/scan/<code>/` action |
| RTK Query | ❌ `useListItemsQuery` called once with `{ page: 1 }` — no search param wiring |
| Frontend | ❌ `<Select>` with first 20 items, no filter, no typeahead |

**Shopkeeper impact:** Counter staff cannot find items for 500+ SKU shops. Billing stops. This is the single highest-priority issue in the entire product.

## 1.2 Business Rules

| Rule | Description |
|------|-------------|
| BR-I1 | Search fires after 2+ characters; single-character input is ignored |
| BR-I2 | Search covers: SKU (prefix), barcode (exact), HUID (exact), design name (contains) |
| BR-I3 | Results capped at 30 per query. If >30 matched, show "Showing first 30 — type more to narrow" |
| BR-I4 | Only `IN_STOCK` items returned. Exception: Credit Note line → return `SOLD` items instead |
| BR-I5 | Selecting an item auto-fills: `metal_code`, `purity_code`, `gross_wt`, `net_wt`, `stone_wt`, `hsn_code`, `description`, `rate_per_gram` (from live rates), `huid` (read-only on line) |
| BR-I6 | `rate_per_gram` auto-fill shows amber "Rate overridden" indicator if staff changes it |
| BR-I7 | Barcode scanner emits chars in <100ms burst + Enter. Detect scan vs. typing and bypass debounce |
| BR-I8 | "Manual line" (no item selected) keeps all fields editable — supports service charges |
| BR-I9 | Adding same item UUID twice shows warning: "Already on line N. Duplicate may cause stock conflict." Allow proceeding |
| BR-I10 | If live rates fetch fails, rate_per_gram shows "0" with inline note "Rate unavailable — enter manually" |

## 1.3 User Flow

```
Staff opens New Invoice → clicks "Add line" → Item field is now a search input

  [types "BR"] → 300ms debounce → GET /items/?search=BR&status=IN_STOCK&page_size=30
      → dropdown appears with matching items
      → each row shows: SKU | design name | metal/purity chip | net weight

  [selects "BR-0042 — 22K Gold Bracelet, 8.20g"]
      → all line fields auto-fill from item data
      → rate_per_gram fills from live rate for 22K GOLD
      → huid = item.huid (read-only, shown as chip)

  [scans barcode "7041200001"]
      → all chars arrive in <100ms
      → system detects scan event → calls /items/scan/7041200001/
      → line auto-fills immediately, no debounce wait

  [leaves item blank]
      → all line fields remain manually editable (manual line)
```

## 1.4 UI/UX Specification

### New Component: `ItemSearchSelect`

Modelled exactly on the existing `CustomerSearchSelect`. Create at:
`frontend/src/components/jewellery/billing/ItemSearchSelect.tsx`

```
Interface:
  value: string              // item ID (empty string = no selection)
  onChange: (id: string, item?: JwlItem) => void
  invoiceType?: InvoiceType  // controls status filter (ISSUED vs SOLD)
  label?: string

Renders:
  Input (min-h-[44px]) with search icon
  Dropdown (absolute, z-20, max-h-56, overflow-y-auto, w-full)
    Loading row: "Searching…" (text-sm text-muted)
    Empty row: "No items found for '{query}'"
    Hint row when query < 2 chars: "Type SKU, barcode, or HUID to search"
    Item rows: SKU (font-semibold) | design_name (text-muted) | [metal/purity chip] | Xg
  Selected chip (when value is set):
    "{SKU} — {design_name}"  [✕ clear button]
```

### Changes to `InvoiceLineRow`

Replace in [InvoiceLineRow.tsx](frontend/src/components/jewellery/billing/InvoiceLineRow.tsx):
```
BEFORE: <Select label="Inventory item">...</Select>
AFTER:  <ItemSearchSelect value={line.item} onChange={(id, item) => onItemSelect(index, id, item)} />
```

Add `onItemSelect` prop to `InvoiceLineRowProps`. The parent `InvoiceFormContent` handles the auto-fill patch when an item is selected.

### Rate Override Indicator

On `rate_per_gram` Input: if the user changes it after auto-fill, show:
`<p className="text-xs text-warning-600 mt-0.5">Rate overridden</p>`

### Mobile-First

- Dropdown: `position: absolute; z-20; w-full` — no viewport overflow
- Touch targets: `min-h-[44px]` on all inputs (already enforced by design system)
- On mobile, the dropdown `max-h-40` (shorter) to leave room for keyboard

## 1.5 Backend Changes Required

| Change | File | Effort |
|--------|------|--------|
| Add `?metal_code=` filter | `views/inventory.py` → `ItemViewSet.get_queryset` | 1 line |
| Add `?design_name=` search | same | 1 line |
| Add `charge_wt` to `ItemListSerializer` | `serializers/inventory.py` | 1 line |
| Rename `?purity=` to also accept `?purity_code=` (alias) | `views/inventory.py` | 2 lines |

**No migration needed.** All changes are query param and serializer field additions.

## 1.6 RTK Query Changes Required

Add to `JwlItemListParams` in `jewellery-api.ts`:
```ts
search?: string;
metal_code?: string;
design_name?: string;
page_size?: number;
```

## 1.7 Test Cases

**Positive**
- `TC-I01` Search "Ring" → GET `/items/?search=Ring&status=IN_STOCK` → correct items returned
- `TC-I02` Select item → all 8 line fields auto-fill from item data
- `TC-I03` Barcode scan (<100ms burst) → calls `/items/scan/{code}/` directly
- `TC-I04` Rate auto-fills from live rates; rate override shows amber indicator
- `TC-I05` Manual line (blank item) → all fields editable, no error

**Negative**
- `TC-I06` Search "ZZZNOMATCH" → `count: 0`, dropdown shows empty state message
- `TC-I07` No auth header → HTTP 401
- `TC-I08` SQL injection in search param → HTTP 200, normal filtered results (ORM safety)
- `TC-I09` Cross-tenant token → only own tenant items returned

**Edge Cases**
- `TC-I10` Single character input → no API call fires
- `TC-I11` 500+ SKU catalog, search "Ring" → max 30 results, "Showing first 30" note shown
- `TC-I12` Live rates offline → rate_per_gram = "0", "Rate unavailable" note shown
- `TC-I13` Same item added twice → warning shown, user can proceed
- `TC-I14` Rapid typing "G","Go","Gol","Gold" within 400ms → single API call fires

**Regression**
- `TC-I15` Invoice create/issue/cancel unaffected by search changes
- `TC-I16` Manual lines (no item) still work after ItemSearchSelect is introduced
- `TC-I17` Invoice total calculation correct after item selected via search

## 1.8 Risks and Open Questions

| Risk | Mitigation |
|------|-----------|
| `charge_wt` absent from list serializer — making charges may be wrong | Add `charge_wt` to `ItemListSerializer` before v1 |
| Diamond/stone update silently no-ops in `ItemWriteSerializer.update` | Known bug — track separately, out of scope here |
| Item with no SKU — displayed as first 8 chars of UUID in dropdown | Acceptable for v1 |

**Open Questions**
- Should Credit Note item search return SOLD items? BA says yes — confirm with shopkeeper.
- Min search length: 2 chars (BA recommendation) — align with backend min filter length.

---

---

# Feature 2 — E-Invoice IRN Disclaimer + Compliance

## 2.1 Status Today

| Layer | State |
|-------|-------|
| Backend | ⚠️ `generate_e_invoice` creates SHA-256 hash locally. NOT submitted to GSTN/IRP |
| Frontend | ❌ No disclaimer. "Generate IRN" button shows a number. User assumes compliance |
| Legal | 🚨 Misleading users into believing they are GSTN-compliant when they are not |

**This is the only feature in the product that creates legal liability for DigiKhaato as a company.** A shop penalised by GST authorities who can show they relied on a fake IRN from DigiKhaato has grounds for a claim. Fix or hide the button — there is no middle ground.

## 2.2 E-Invoicing Compliance Background (India)

| Rule | Detail |
|------|--------|
| Threshold | Businesses with >₹5 crore aggregate turnover must e-invoice |
| Applies to | B2B invoices only (buyer has GSTIN). B2C invoices are exempt |
| Legal IRN | Must be obtained from IRP at `einvoice1.gst.gov.in` or via a GSP |
| Penalty | 100% of tax due or ₹10,000 per invoice (whichever higher) for non-compliant invoices |
| Cancellation | IRN can only be cancelled within 24 hours of IRP registration |
| B2C exemption | If customer has no GSTIN, e-invoicing is NOT required regardless of invoice value |

## 2.3 Business Rules

| Rule | Description |
|------|-------------|
| BR-E1 | E-invoicing required only if: `tenant.einvoice_applicable = True` AND `invoice.type = TAX_INVOICE` AND `customer.gstin` is non-blank |
| BR-E2 | When BR-E1 conditions met and IRN is locally-generated (not IRP), show persistent amber warning banner on invoice detail |
| BR-E3 | `e_invoice_irn` field must never hold a locally-generated value without being flagged. Add `e_invoice_is_simulated: bool` to model |
| BR-E4 | "Generate IRN" action must open a ConfirmDialog with explicit disclaimer + acknowledgement checkbox before firing |
| BR-E5 | B2C invoices (no customer GSTIN): no IRN warning, no "Submit to IRP" button shown |
| BR-E6 | `tenant.einvoice_applicable = False`: no IRN warnings anywhere. Show settings note only |
| BR-E7 | Invoice cancelled within 24h of IRP submission: call IRP cancellation API. After 24h: "Cancel Invoice" replaced by "Issue Credit Note" |
| BR-E8 | Invoice PDF must not print IRN as if legally valid. Print "IRN (Simulated — not GSTN filed)" if `e_invoice_is_simulated = True` |
| BR-E9 | QR code must be rendered as a scannable image (`qrcode.react`), not raw base64 text |

## 2.4 User Flow

### Immediate Fix (this week — no IRP integration)
```
Invoice detail page (B2B TAX_INVOICE, einvoice_applicable = True):

  [Amber banner — always visible if IRN not IRP-submitted]
  "⚠ IRN not submitted to GSTN. This invoice is NOT e-invoice compliant.
   File via GSTN portal manually or enable IRP integration in Settings."

  [More menu → "Generate IRN" click]
  → ConfirmDialog opens
    Title: "Generate Reference IRN"
    Body:  Warning text (see UI spec)
           [checkbox] "I understand this is for internal reference only"
    Buttons: [Cancel] [Generate — disabled until checkbox ticked]

  [After generation]
  → E-invoice panel shows IRN with Badge variant="warning": "SIMULATED"
  → Amber panel border, not standard border-border
```

### Phase 2 (IRP integration — future sprint)
```
  [Submit to IRP button]
  → Backend calls IRP/GSP API with GSTN invoice JSON
  → On success: IRN, ack_no, ack_date, signed QR stored
  → Panel turns green: Badge variant="success": "GSTN REGISTERED"
  → Invoice PDF regenerated with official QR code
```

## 2.5 UI/UX Specification

### ConfirmDialog before Generate IRN

```
Modal size="sm" (uses existing ConfirmDialog component)
Title: "Generate Reference IRN"

Body:
  .rounded-xl.border.border-warning-300.bg-warning-50.p-3.text-sm (amber box)
  "This generates an IRN for internal reference only.
   It is NOT submitted to the GSTN Invoice Registration Portal (IRP)
   and is NOT legally valid for GST e-invoicing compliance.

   To generate a legally valid IRN, integrate with a GSTN-certified
   e-invoicing provider (ASP/GSP) in Settings."

  [checkbox] "I understand this IRN is for internal use only
              and is not a valid GSTN e-invoice."

Footer: [Cancel]  [Generate (disabled until checkbox ticked)]
        loading={eInvoiceState.isLoading} on Generate button
```

### E-Invoice Panel (after generation)

```
.app-panel.rounded-2xl.border.border-warning-300.bg-warning-50 (amber tint)
┌──────────────────────────────────────────────────────────────┐
│  E-invoice details  [Badge variant="warning": SIMULATED]     │
│                                                              │
│  IRN                                                         │
│  [64-char hash, font-mono text-xs break-all]                 │
│                                                              │
│  QR Code                                                     │
│  [<QRCodeSVG value={invoice.e_invoice_qr} size={128} />]     │
│                                                              │
│  ⚠ This IRN has not been registered with GSTN.               │
│    Not valid for GST filing or audit presentation.           │
└──────────────────────────────────────────────────────────────┘
```

### Amber Compliance Banner (invoice detail — B2B, einvoice_applicable)

```
.rounded-xl.border.border-warning-300.bg-warning-50.p-3.text-sm.mb-4
"⚠ B2B Invoice — IRN not submitted to GSTN.
 This invoice is not e-invoice compliant. File manually at einvoice1.gst.gov.in
 or enable IRP integration in Settings → GST Configuration."
```

Show only when: `invoice.type === "TAX_INVOICE"` AND `customer.gstin` is non-blank AND `!invoice.e_invoice_irn || invoice.e_invoice_is_simulated`.

## 2.6 Backend Changes Required

| Change | File | Notes |
|--------|------|-------|
| Add `e_invoice_is_simulated` BooleanField (default=True) | `models/billing.py` | New migration needed |
| Add `einvoice_applicable` BooleanField to tenant admin settings | `models/admin.py` | New migration needed |
| Set `e_invoice_is_simulated = True` in `generate_e_invoice` | `services/billing.py` | 1 line |
| Expose `e_invoice_is_simulated` in `SalesInvoiceSerializer` | `serializers/billing.py` | 1 line |
| Add `einvoice_applicable` to admin settings serializer + view | `serializers/admin.py`, `views/admin.py` | Small change |

## 2.7 Test Cases

**Positive**
- `TC-E01` B2B TAX_INVOICE, einvoice_applicable=True, no IRN → amber banner visible
- `TC-E02` Checkbox ticked → Generate button enables
- `TC-E03` After generation → panel shows SIMULATED badge + amber border
- `TC-E04` QR field renders as `<QRCodeSVG>` image, not raw text
- `TC-E05` B2C invoice (no GSTIN) → no warning, no IRP button

**Negative**
- `TC-E06` Checkbox not ticked → Generate button stays disabled
- `TC-E07` einvoice_applicable=False → no amber banners anywhere
- `TC-E08` Attempt PATCH on `e_invoice_irn` field → read-only, silently ignored
- `TC-E09` Invalid GSTIN format → HTTP 400 on invoice create

**Edge Cases**
- `TC-E10` B2B invoice, einvoice_applicable=True, real IRP IRN exists → no amber warning (future state)
- `TC-E11` Invoice total = ₹0 → IRN generation blocked with error
- `TC-E12` Cancel within 24h of issue → Cancel button available; after 24h → "Issue Credit Note" shown
- `TC-E13` IRN uniqueness — two different invoices must have different IRN values

**Regression**
- `TC-E14` Invoices created before `e_invoice_is_simulated` field added → `irn` field present (null for old), no 500
- `TC-E15` B2C invoice issue/cancel flow unaffected

## 2.8 Risks

| Risk | Severity | Action |
|------|----------|--------|
| Shop files GST return with fake IRN | **Critical** | Add disclaimer this week |
| QR code shown as raw base64 to tax auditor | High | Render as image via `qrcode.react` |
| `einvoice_applicable` not configurable per tenant | Medium | Add to admin settings |
| 24h cancellation window not enforced | Medium | Add `issued_at` timestamp check before cancel |

**Open Questions**
- Should `einvoice_applicable` default to `False` (opt-in) or `True` (opt-out)? Recommend `False` — safer default.
- Does the shop GSTIN belong on the tenant settings model or the branch model? (Relevant for multi-branch.)

---

---

# Feature 3 — Outstanding / Party Ledger

## 3.1 Status Today

| Layer | State |
|-------|-------|
| Backend | ✅ `PartyOutstandingBalance`, `PartyOutstandingMovement` models exist. `get_ageing_report` service. Manual adjust action. `post_movement` called from billing issue |
| RTK Query | ❌ No `listOutstanding`, `getPartyBalance`, or `postAdjustment` hooks in `jewellery-api.ts` |
| Frontend | ❌ `ModulePlaceholder` — nothing renders |

**Shopkeeper impact:** Cannot see receivables. Month-end reconciliation impossible. CA cannot use the system for tax filing. Shop will maintain a parallel register — defeating the product's value.

## 3.2 Business Rules

| Rule | Description |
|------|-------------|
| BR-O1 | Ageing buckets: 0–30d (Current), 31–60d, 61–90d, 90+ (overdue). Badge colours: success → warning → warning → danger |
| BR-O2 | Note on current backend: ageing is computed from `last_txn_date` (not oldest open invoice). Label clearly in UI as "Last activity date" — known deficiency, acceptable for v1 |
| BR-O3 | Show both: cash balance (₹) and metal balance (grams) per party |
| BR-O4 | Positive balance = customer owes shop (receivable, shown in red/amber). Negative = shop owes customer (advance/credit, shown in green) |
| BR-O5 | Zero-balance parties excluded by default. "Include zero-balance" toggle for auditors |
| BR-O6 | Manual adjustments: only `P_ACCOUNTS_ADJUST` permission (admin/manager). Adjustment notes mandatory (min 5 chars). Only `MANUAL_ADJUSTMENT` type available in UI form |
| BR-O7 | Movement history: show last 50 movements (not current 20 cap). Each row: date, type label, amount delta, metal delta, reference (clickable link to invoice if type=INVOICE_DEBIT), notes |
| BR-O8 | Balance is computed from movements — never directly editable |
| BR-O9 | CSV export: Customer Name, Mobile, Cash Balance, Metal Balance (g), Last Activity Date, Ageing Bucket |

## 3.3 User Flow

```
Morning routine (owner/accountant):

  /jewellery/outstanding
  → Summary header: "Total receivable: ₹X from Y customers | Overdue 90+: Z"
  → Ageing bar (4 clickable buckets — click filters list below)
  → Party list (cards, sorted by balance desc)

  [tap a party card]
  → Drill-down Drawer opens (size="xl")
    → Summary chips: Total | Oldest invoice | Last payment
    → Movement table (last 50 rows, paginated)
    → "Post Adjustment" button (visible only to admin/manager)

  [Post Adjustment button]
  → Adjustment Drawer (size="lg")
    → Party (pre-filled from context)
    → Type: MANUAL_ADJUSTMENT (only option)
    → Amount Delta (₹, signed — positive = customer owes more, negative = credit)
    → Metal Delta (g, signed)
    → Date (defaults today)
    → Notes (required)
  → [Save] → balance updates, movement appears at top of history
```

## 3.4 UI/UX Specification

### Outstanding Page Layout

```
Screen title="Party Outstanding" subtitle="As of [today's date]"

Actions bar:
  FilterPills: [All] [Customers] [Suppliers]   DatePicker: "As of"   [Export CSV]
  [+ Manual Adjustment] (visible to admin/manager only)

── Ageing Summary Bar ──────────────────────────
grid-cols-2 md:grid-cols-4 gap-3 (each is a button, click filters list)
┌──────────┬──────────┬──────────┬─────────────┐
│ 0–30d    │ 31–60d   │ 61–90d   │ 90+ days    │
│ ₹1.2L    │ ₹45k     │ ₹12k    │ ₹8k [danger]│
│ 8 parties│ 3 parties│ 1 party  │ 2 parties   │
└──────────┴──────────┴──────────┴─────────────┘
Active bucket: ring-2 ring-primary-500

── Party List ──────────────────────────────────
SkeletonList count=5 (isFetching)
EmptyState "All square" "No outstanding balances" (zero data)

.app-panel.card-clickable (per party)
  Name (font-semibold)     [Badge: Customer | Supplier]
  ₹ 23,400 outstanding     Oldest: 47 days
  [Badge variant=warning: 31–60d]
  Metal: 12.5g  (if metal_balance_grams != 0)

  Negative balance party (advance):
  -₹5,000 (text-success-600)  [Badge variant="success": Credit]
```

### Party Drill-down Drawer

```
Drawer size="xl"
Title: "{party name} — Outstanding"
Body:
  Summary chips row (grid-cols-3):
    Total owed | Oldest movement | Last payment date

  .app-panel.rounded-xl (movement table)
  Responsive: table on md+, stacked cards on mobile
  Date | Type | Amount | Metal | Reference | Notes

  Movement type labels (human-readable, not SCREAMING_CASE):
    INVOICE_DEBIT → "Invoice raised"
    PAYMENT_RECEIVED → "Payment received"
    ADVANCE_GIVEN → "Advance collected"
    MANUAL_ADJUSTMENT → "Manual adjustment"

  Reference column: if invoice, render as Link to /jewellery/billing/{id}

Footer:
  [Post Adjustment] (admin/manager only)   [Close]
```

### Manual Adjustment Drawer

```
Drawer size="lg"
Title: "Manual Adjustment"
Fields:
  CustomerSearchSelect (party, pre-filled if opened from party detail)
  Select: Movement type = MANUAL_ADJUSTMENT (single option, read-only)
  Input type="number": Amount Delta (₹) — signed, allow negative
  Input type="number": Metal Delta (g) — signed, allow negative
  DatePicker: Date (defaults today, cannot be future)
  Textarea: Notes (required, min 5 chars, maxLength=500)

Error: full-width danger banner in drawer body (not toast — persists)
Footer: [Cancel]  [Save adjustment]  loading={adjustState.isLoading}
```

## 3.5 Backend Changes Required

| Change | File | Priority |
|--------|------|----------|
| Add `?ageing=30/60/90` filter param to `get_ageing_report` service | `services/outstanding.py` | v1 |
| Add `?customer=<uuid>` filter to `PartyOutstandingViewSet.list` | `views/outstanding.py` | v1 |
| Increase movement history cap from 20 → 50; add cursor pagination to movements | `serializers/outstanding.py`, `views/outstanding.py` | v1 |
| Expose ageing bucket on each party in list response (not just binary `overdue_90_plus`) | `serializers/outstanding.py` | v1 |
| Add `branch_name` filter to outstanding list | `views/outstanding.py` | v1 |

**Known deficiency to document in UI:** Ageing is calculated from `last_txn_date`, not from the age of individual unpaid invoice lines. Proper invoice-level ageing is a v2 item. Label it clearly in the UI.

## 3.6 RTK Query Changes Required

Add to `jewellery-api.ts`:
```ts
listOutstanding: builder.query<PaginatedResponse<JwlPartyOutstanding>, OutstandingListParams>
getPartyOutstanding: builder.query<JwlPartyOutstandingDetail, string>  // by balance UUID
postManualAdjustment: builder.mutation<JwlPartyOutstanding, ManualAdjustmentPayload>
exportOutstandingCsv: builder.query<Blob, OutstandingListParams>
```

## 3.7 Test Cases

**Positive**
- `TC-O01` GET `/outstanding/` → list with cash_balance, metal_balance_grams, ageing bucket per party
- `TC-O02` Click party card → Drawer opens with 50 movement rows
- `TC-O03` Manual adjustment saved → balance updates, movement appears at top of history
- `TC-O04` Zero-balance party excluded by default; visible when toggle enabled
- `TC-O05` Negative balance (advance) shown in green with "Credit" badge

**Negative**
- `TC-O06` Non-manager posts adjustment → 403, button not visible in UI
- `TC-O07` Filter `from_date` > `to_date` → HTTP 400
- `TC-O08` Cross-tenant outstanding access → only own tenant data

**Edge Cases**
- `TC-O09` Soft-deleted customer with non-zero balance → still appears with "Deleted" label
- `TC-O10` Concurrent payment posts → `select_for_update` prevents race condition
- `TC-O11` Balance of ₹9,999,999.99 → renders without truncation or scientific notation
- `TC-O12` 500+ movements for one party → paginated, no timeout

**Regression**
- `TC-O13` Invoice issue still auto-creates INVOICE_DEBIT movement
- `TC-O14` Billing and customer endpoints unaffected

## 3.8 Risks

| Risk | Severity |
|------|----------|
| `post_movement` not called consistently from all billing paths | High — audit billing service |
| Ageing from `last_txn_date` misleads owners on "old vs. new" debt | Medium — label clearly in UI |
| `reference_id` is CharField, not FK — dangling refs if invoice deleted | Low — note in code, fix in v2 |
| No paginated `/outstanding/{id}/movements/` endpoint | Medium — add before frontend build |

---

---

# Feature 4 — Karigar Edit + Detail

## 4.1 Status Today

| Layer | State |
|-------|-------|
| Backend | ✅ `KarigarViewSet` is `ModelViewSet` — PUT/PATCH fully wired. All fields editable |
| RTK Query | ❌ No `useUpdateKarigarMutation` or `useGetKarigarQuery` in `jewellery-api.ts` |
| Frontend | ❌ No `karigar/[id]` route. Karigar cards have no edit button or click handler |

## 4.2 Business Rules

| Rule | Description |
|------|-------------|
| BR-K1 | Editable fields: `name`, `mobile`, `specialization`, `default_labour_rate`, `default_wastage_pct`, `kyc_pan`, `kyc_aadhaar_masked` |
| BR-K2 | `code` is read-only after creation — used in voucher audit trails |
| BR-K3 | Add `is_active` boolean (default=True). Distinct from soft-delete. Inactive = unavailable for new assignments, history preserved |
| BR-K4 | Inactive karigar excluded from new-issue karigar dropdown. Still visible in historical vouchers |
| BR-K5 | Marking inactive when karigar has open issues: warn but do not block. Open issues continue to be processable |
| BR-K6 | Inactivating does NOT cancel open orders |
| BR-K7 | PAN format: `[A-Z]{5}[0-9]{4}[A-Z]` — validate only if non-blank |
| BR-K8 | Mobile: 10 digits, strip `+91` prefix before saving |
| BR-K9 | Performance summary (read-only): total gold issued (g), total returned (g), avg wastage %, open issue count |

## 4.3 User Flow

```
Karigar list → tap a karigar card → Edit Drawer opens (pre-filled)
  → Edit name/phone/etc.
  → Toggle "Active" switch (if turning off and has open issues → warning dialog)
  → [Save changes] → card updates, drawer closes

Karigar card (expanded view):
  Performance summary: "Issued: 125g | Returned: 122.5g | Avg wastage: 2% | Open: 2"
```

## 4.4 UI/UX Specification

### Karigar Card Changes

```
.app-panel.card-clickable  (onClick → openEditDrawer(karigar))
┌─────────────────────────────────────────────────────┐
│ Ramesh Kumar              [Badge: Active / Inactive] │
│ 9820001111 · Goldsmith        [IconButton: ✎ Edit]  │
│ Code: KRG-001                                       │
│ ─────────────────────────────────────────────────── │
│ Issued: 125g  Returned: 122.5g  Open: 2  Wastage: 2%│
└─────────────────────────────────────────────────────┘
```

Badge: `Active` → variant="success", `Inactive` → variant="warning"

### Edit Drawer

```
Drawer size="2xl"
Title: "New Karigar" or "Edit — {karigar.name}"

Form (space-y-4):
  grid-cols-2: Name* | Mobile*
  grid-cols-2: Specialization | Default wastage %
  grid-cols-2: Default labour rate (₹/g) | KYC PAN
  grid-cols-2: Code (read-only on edit) | Aadhaar last 4 (optional)

  [Active toggle] (edit mode only)
  "Mark as inactive to stop new assignments while keeping history"

  ── Performance Summary (edit mode only) ──
  .app-panel.bg-surface2 grid-cols-4
  Issued (g) | Returned (g) | Avg wastage % | Open issues

Footer: [Cancel]  [Save Karigar / Save changes]
```

Formik `enableReinitialize={true}` so drawer pre-fills when reopened for different karigar.

### Inactivate Warning

```
ConfirmDialog (when toggling active → inactive with open issues)
Title: "Mark karigar as inactive?"
Body: "{name} has {n} open issue vouchers. They remain assigned but
       no new work can be assigned. Existing issues will not be affected."
Buttons: [Keep active]  [Mark inactive]
```

## 4.5 Backend Changes Required

| Change | File | Notes |
|--------|------|-------|
| Add `is_active = BooleanField(default=True, db_index=True)` | `models/karigar.py` | New migration |
| Expose `is_active` in `KarigarSerializer` | `serializers/karigar.py` | — |
| Filter `is_active=True` in karigar dropdown for new-issue form (separate query param) | `views/karigar.py` | `?active_only=true` param |
| Add `unique_together` on `(tenant, code)` | `models/karigar.py` | Migration + data check |
| Add mobile format validator (10-digit) | `serializers/karigar.py` | 2 lines |
| Add PAN format validator (optional, pattern only) | `serializers/karigar.py` | 2 lines |
| Add `branch_name` to `KarigarSerializer` read fields | `serializers/karigar.py` | 1 line |

## 4.6 RTK Query Changes Required

Add to `jewellery-api.ts`:
```ts
getKarigar: builder.query<JwlKarigar, string>
updateKarigar: builder.mutation<JwlKarigar, { id: string } & Partial<JwlKarigar>>
```

Add `is_active?: boolean` to `JwlKarigar` type.

## 4.7 Test Cases

**Positive**
- `TC-K01` PATCH `/karigar/{id}/` with new mobile → HTTP 200, updated
- `TC-K02` Edit drawer opens pre-filled with existing values
- `TC-K03` Save changes → card reflects new data without page reload
- `TC-K04` Mark inactive with no open issues → immediate, no warning
- `TC-K05` Inactive karigar not shown in new-issue karigar dropdown

**Negative**
- `TC-K06` PATCH with empty name → HTTP 400
- `TC-K07` PATCH with invalid PAN format → HTTP 400
- `TC-K08` Edit non-existent karigar → HTTP 404
- `TC-K09` Edit with wrong tenant token → HTTP 403/404
- `TC-K10` DELETE karigar with active job orders → HTTP 400 (or 409)

**Edge Cases**
- `TC-K11` Unicode name "रामलाल सोनी" → stored and displayed correctly
- `TC-K12` Mark inactive with 2 open issues → warning shown; confirm → marked inactive; open issues unchanged
- `TC-K13` Concurrent edit by two users → last-write-wins, no partial merge
- `TC-K14` Inactive karigar still appears in historical issue vouchers

**Regression**
- `TC-K15` Karigar create still works
- `TC-K16` Karigar list pagination/search unaffected
- `TC-K17` KarigarIssue and KarigarReceipt creation unaffected

## 4.8 Risks

| Risk | Severity |
|------|----------|
| Duplicate `code` per tenant — no unique constraint today | Medium — add with migration |
| `is_active` migration on existing karigars defaults all to True | Low — correct default |
| Performance summary requires aggregation query — may be slow at scale | Low for v1 (shops have ≤50 karigars) |

---

---

# Feature 5 — Inventory Purity Tracking + HUID

## 5.1 Status Today

| Layer | State |
|-------|-------|
| Backend — Item model | ✅ `huid` field exists (CharField max_length=20, blank=True, db_indexed) |
| Backend — Search | ✅ `?search=` covers `huid__icontains` |
| Backend — Purity summary | ❌ No aggregation endpoint |
| Backend — HUID uniqueness | ❌ No unique constraint per tenant |
| Backend — HUID on invoice line | ❌ `SalesInvoiceLine` has no `huid` field |
| Frontend — Purity tab | ❌ `ModulePlaceholder` |
| Frontend — HUID tab | ❌ `ModulePlaceholder` |

**HUID on invoice = BIS-mandated legal requirement since April 2023.** This is not a nice-to-have.

## 5.2 Business Rules

| Rule | Description |
|------|-------------|
| BR-P1 | Purity summary: one row per (metal, purity) in stock. Shows: item count, gross wt, net wt, charge wt, estimated value (net_wt × live rate) |
| BR-P2 | Click purity row → filtered item list for that purity |
| BR-P3 | HUID: exactly 6 alphanumeric uppercase chars (`[A-Z0-9]{6}`). Auto-uppercase input |
| BR-P4 | HUID must be unique per tenant. Duplicate rejected: "HUID AB1234 is already assigned to item {SKU}" |
| BR-P5 | Gold items: HUID mandatory. Warning (not block) if blank at time of invoice creation |
| BR-P6 | When an item with HUID is added to invoice line → `SalesInvoiceLine.huid` auto-filled. Printed on invoice PDF |
| BR-P7 | HUID search: type 6 chars → shows item detail (IN_STOCK) or sold history (with invoice link) |
| BR-P8 | Add `hallmark_status` field: `NOT_HALLMARKED`, `HALLMARKED`, `HUID_ASSIGNED`. Filterable |
| BR-P9 | Estimated value labelled "Indicative — based on today's rate" |
| BR-P10 | Silver and non-metal items: HUID optional, no warning |

## 5.3 User Flow

### Purity Tracking Tab
```
/jewellery/inventory?view=purity

  FilterSelect: Metal (All | GOLD | SILVER | PLATINUM)

  Summary cards (grid-cols-2 md:grid-cols-4):
    [GOLD 22K]  [GOLD 18K]  [SILVER 92.5]  ...
    47 items · 384g · ₹23.4L indicative

  [Click card → item list filtered to that purity]
```

### HUID Tracking Tab
```
/jewellery/inventory?view=huid

  FilterPills: [All] [Has HUID] [Missing HUID] [Hallmarked]
  Search input: "Search by HUID (6 chars)"

  Table (md+) / stacked cards (mobile):
    SKU | Design | HUID | Metal/Purity | Hallmark Status | Action

  Missing HUID row: [Badge variant="danger": "No HUID"]
  Sold item HUID: shows "SOLD — INV-2026-001 · 12 Mar 2026" as reference
```

## 5.4 UI/UX Specification

### PurityTrackingView Component

```tsx
// frontend/src/components/jewellery/inventory/PurityTrackingView.tsx

Data source: useListItemsQuery({ status: "IN_STOCK", metal_code: selectedMetal })
Client-side group by purity_code using useMemo:
  Record<string, { items: JwlItem[]; total_net_wt: number; total_gross_wt: number }>

Summary cards:
  .app-panel.card-clickable (onClick → setSelectedPurity)
  Active card: ring-2 ring-primary-500

Item list below cards:
  Same ItemCard as main inventory tab, filtered by selectedPurity
  Reuse existing ItemMasterPage list rendering — just pass purity filter
```

### HUIDTrackingView Component

```tsx
// frontend/src/components/jewellery/inventory/HUIDTrackingView.tsx

Data source: useListItemsQuery({ search: debouncedHuid, ... })
Client-side filters: hasHuid, missingHuid — useCallback + useMemo

Table row — missing HUID:
  <td className="text-danger-600 font-semibold">No HUID</td>
  [IconButton: Edit → opens item/[id] page where HUID can be set]

HUID search — sold item:
  Show from useListInvoicesQuery result (RTK cache) when item.status === "SOLD"
```

### Hallmark Status Badge

```tsx
// Add to constants/jewellery.ts:
export const HALLMARK_STATUS_LABELS = { NOT_HALLMARKED: "Not Hallmarked", ... }
export const HALLMARK_STATUS_VARIANTS = { NOT_HALLMARKED: "danger", HALLMARKED: "success", ... }
```

### HUID on Invoice Line Row

Add read-only HUID chip in `InvoiceLineRow` (shows only when `line.huid` is non-empty):
```
[chip: HUID: AB1234] (inline below metal/purity row)
```

## 5.5 Backend Changes Required

| Change | File | Priority |
|--------|------|----------|
| Add `huid` to `SalesInvoiceLine` (CharField max_length=6, blank=True) | `models/billing.py` | **P0** — BIS compliance |
| Add unique constraint on `Item.huid` per tenant (partial index `WHERE huid != ''`) | `models/inventory.py` | P0 |
| Add HUID format validator (6 chars `[A-Z0-9]`) | `serializers/inventory.py` | P0 |
| Auto-fill `SalesInvoiceLine.huid` from item when line is created | `services/billing.py` | P0 |
| Add `hallmark_status` ChoiceField to `Item` | `models/inventory.py` | P1 |
| Add `?metal_code=` filter to `ItemViewSet.get_queryset` | `views/inventory.py` | P1 |
| Add purity summary `@action(detail=False)` using `annotate(Count, Sum)` | `views/inventory.py` | P1 |
| Add `hallmark_status` to `ItemListSerializer` and `ItemWriteSerializer` | `serializers/inventory.py` | P1 |

**Migrations needed:** billing (add huid to invoice line), inventory (add hallmark_status, partial unique index on huid).

## 5.6 Test Cases

**Positive**
- `TC-P01` Purity summary tab → shows rows grouped by metal/purity with correct item count + weight totals
- `TC-P02` Click purity group → item list filtered to that purity
- `TC-P03` HUID search "AB1234" → matching IN_STOCK item shown with full detail
- `TC-P04` HUID search — sold item → shows "Sold via INV-XXXX on DD/MM/YYYY" with link
- `TC-P05` Item with HUID added to invoice → `SalesInvoiceLine.huid` = item.huid

**Negative**
- `TC-P06` Duplicate HUID on two items → HTTP 400 on second
- `TC-P07` HUID length != 6 chars → HTTP 400
- `TC-P08` Gold item created with blank HUID → saves with warning, no block
- `TC-P09` Filter `?purity=999` (invalid BIS code) → HTTP 400 or empty results

**Edge Cases**
- `TC-P10` Lowercase HUID input "ab1234" → auto-uppercased to "AB1234"
- `TC-P11` All items same purity → single summary card, no division errors
- `TC-P12` Empty inventory → purity tab shows empty state, no crash
- `TC-P13` Purity rate unavailable → shows "Rate N/A" not ₹0
- `TC-P14` HUID search "ZZ9999" not found → "No item found with HUID ZZ9999"

**Regression**
- `TC-P15` Main inventory tab unaffected
- `TC-P16` Item create/edit still works
- `TC-P17` Invoice item search unaffected by purity/HUID changes
- `TC-P18` Existing invoice lines without HUID field → no 500 after migration

## 5.7 Risks

| Risk | Severity |
|------|----------|
| Existing items have no HUID — migration leaves all blank | Expected. Add warning on item detail "HUID not set" |
| Pre-April 2023 stock sold without HUID — do not block retroactively | Warn only, never block |
| Purity aggregation query may be slow at 10k+ items | Use DB-level `annotate` not Python loop |
| `SalesInvoiceLine` migration on existing data — huid defaults to "" | Correct, backward safe |

---

---

# Cross-Feature Integration Tests

| TC | Scenario | Expected |
|----|----------|----------|
| `TC-INT-01` | Search item → add to invoice → check outstanding | Invoice creates INVOICE_DEBIT movement; outstanding balance increases |
| `TC-INT-02` | Add item with HUID to invoice → issue invoice | `SalesInvoiceLine.huid` populated; PDF prints HUID; purity summary reflects deduction |
| `TC-INT-03` | Edit karigar → assign to order → create customer invoice | Customer outstanding updates; karigar balance separate |
| `TC-INT-04` | Cancel invoice with real IRN within 24h | Cancel allowed; after 24h → only credit note allowed |
| `TC-INT-05` | Post manual adjustment → verify outstanding balance recalculated | Balance updated atomically; movement history has new entry |

---

---

# Build Order and Sprint Plan

## Week 1 (P0 — unblock billing and remove legal risk)

| Task | Owner area | Effort |
|------|-----------|--------|
| Add `ItemSearchSelect` component | Frontend | 1 day |
| Wire `ItemSearchSelect` into `InvoiceLineRow` with auto-fill | Frontend | 0.5 day |
| Add `?metal_code=`, `?design_name=`, `charge_wt` to backend item API | Backend | 0.5 day |
| Add `e_invoice_is_simulated` field + IRN ConfirmDialog disclaimer | Backend + Frontend | 0.5 day |
| Add amber banner on B2B invoices with unsubmitted IRN | Frontend | 0.5 day |
| Render QR as image (`qrcode.react`) not raw text | Frontend | 0.5 day |

## Week 2 (P1 — operational completeness)

| Task | Owner area | Effort |
|------|-----------|--------|
| Add `is_active` to Karigar model + migration | Backend | 0.5 day |
| Add `updateKarigar`, `getKarigar` RTK mutations | Frontend | 0.5 day |
| Build karigar edit Drawer + inactivate flow | Frontend | 1 day |
| Build Outstanding page (list + ageing bar + drill-down drawer) | Frontend | 2 days |
| Add outstanding RTK hooks (`listOutstanding`, `postAdjustment`) | Frontend | 0.5 day |
| Fix outstanding backend: ageing params, `?customer=` filter, 50-row cap | Backend | 1 day |

## Week 3 (P1 — BIS compliance + purity views)

| Task | Owner area | Effort |
|------|-----------|--------|
| Add `huid` to `SalesInvoiceLine` + migration | Backend | 0.5 day |
| Add HUID unique constraint + format validator | Backend | 0.5 day |
| Add `hallmark_status` to Item model | Backend | 0.5 day |
| Auto-fill `SalesInvoiceLine.huid` from item on billing | Backend | 0.5 day |
| Build `PurityTrackingView` component | Frontend | 1 day |
| Build `HUIDTrackingView` component | Frontend | 1 day |
| Add HUID chip to `InvoiceLineRow` | Frontend | 0.5 day |

---

---

# Open Questions

| # | Question | Owner | Decision needed by |
|---|---------|-------|-------------------|
| Q1 | Should `einvoice_applicable` default to `False` (opt-in) or `True`? | Business | Week 1 |
| Q2 | Does Credit Note billing search need SOLD items in dropdown? | BA + shopkeeper | Week 1 |
| Q3 | Ageing from `last_txn_date` vs. oldest open invoice — is v1 simplification acceptable? | Business | Week 2 |
| Q4 | Which GSP/IRP provider for Phase 2 e-invoice integration? (ClearTax, Tally, Masters India) | Business | Phase 2 planning |
| Q5 | Is HUID mandatory for silver items? (BIS regulations evolving) | BA | Week 3 |
| Q6 | Should inactive karigars be filtered from all lists by default or shown with a dim style? | UX | Week 2 |
| Q7 | CSV export for outstanding — server-side or client-side CSV generation? | Backend | Week 2 |
| Q8 | Purity summary aggregation — do we need it server-side or is client-side `useMemo` grouping acceptable for v1? | Backend | Week 3 |

---

---

# Assumptions

1. Backend authentication and tenant isolation works correctly for all new endpoints (JWT + `tenant` filter on all querysets).
2. The existing `post_movement` service is called from billing issue flow — validate this with a targeted test before building the Outstanding UI.
3. `qrcode.react` can be added to the frontend without license or bundle-size issues.
4. Shops using DigiKhaato have their inventory entered in the Item master before billing begins.
5. Phase 2 IRP integration will use a GSP/ASP (not direct NIC API) — GSP APIs are more stable and handle the schema complexity.
6. All money amounts are INR. No multi-currency support required.
7. HUID on invoice is required only for gold. Silver and diamond items are exempt for now.
