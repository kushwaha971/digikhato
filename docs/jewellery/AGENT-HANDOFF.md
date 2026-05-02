# Jewellery ERP — AI Agent Handoff Document

**Module:** DigiKhaato Jewellery ERP  
**Last Updated:** 2026-05-02  
**Last Agent:** Claude (Sonnet 4.6) — documentation pass  
**Next Agent:** Whoever picks this up next — start from **Phase 1, Task B-1.1** (see § Current Work)

> **How to use this document**
> Read §1 (Current Status) and §2 (Next Agent Instructions) first. Then read the relevant phase section for context. Update §1 and the task checkbox that you completed before your context ends.

---

## §1 — Current Status

```
PHASE          STATUS
─────────────────────────────────────────────────
Documentation  ✅ COMPLETE
Phase 1        ⏳ NOT STARTED
Phase 2        ⏳ NOT STARTED
Phase 3        ⏳ NOT STARTED
```

### What exists right now

**Backend — Jewellery app: DOES NOT EXIST**  
No `apps/jewellery/` directory. No models, views, URLs for jewellery.

**Frontend — Jewellery module: DOES NOT EXIST**  
No `/jewellery` routes, no RTK slice, no jewellery components.

**Existing platform (do not modify without reading first):**
- `backend/apps/common/` — shared audit, permissions, pagination utilities
- `backend/apps/accounts/` — auth (JWT via SimpleJWT)
- `backend/apps/users/` — user model
- `backend/apps/onboarding/` — tenant/business profile
- `frontend/src/store/api.ts` — base RTK Query `apiSlice`
- `frontend/src/lib/axios.ts` — shared Axios instance
- `frontend/src/components/ui/` — shared UI primitives (Button, Input, Card, Modal, etc.)
- `frontend/src/components/layout/Sidebar.tsx` — global sidebar (needs jewellery section added)

---

## §2 — Next Agent Instructions

**START HERE. Read before touching any file.**

### Mandatory reading (in this order)
1. `docs/jewellery/00-overview-and-architecture.md` — architecture decisions
2. `docs/jewellery/02-database-schema.md` — exact model definitions
3. `docs/jewellery/03-api-design.md` — API contracts
4. `docs/jewellery/DigiKhaato-Jewellery-ERP-COMPLETE.md` Section 7 — all business formulas

### Current task to resume
**Phase 1 — Backend Bootstrap (B-1.1)**  
Create the `apps/jewellery/` Django app with base models.

### Exact next steps
1. Read `backend/apps/common/models.py` — understand existing base model patterns
2. Read `backend/apps/common/permissions.py` — understand permission class pattern
3. Read `backend/config/settings.py` (or wherever `INSTALLED_APPS` lives) — to know where to register the new app
4. Create `backend/apps/jewellery/` following the structure in `docs/jewellery/00-overview-and-architecture.md §3.2`
5. Implement Phase 1 backend tasks in order: B-1.1 → B-1.2 → B-1.3 → B-1.4 → B-1.5

### Rules for this codebase
- Every jewellery model must extend `JewelleryBaseModel` (defined in `02-database-schema.md`)
- Weight fields: `DecimalField(max_digits=12, decimal_places=4)`
- Money fields: `DecimalField(max_digits=18, decimal_places=2)`
- All business formulas in `apps/jewellery/services/` — never inline in views
- All jewellery API endpoints under `/api/jwl/v1/`
- Always filter queryset by `tenant` and `deleted_at__isnull=True`
- Wrap multi-table writes in `transaction.atomic()`

---

## §3 — Decisions Log

Decisions that are **final** — do not revisit without a good reason.

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| D-01 | Jewellery is a separate Django app `apps/jewellery/` | Clean module boundary; doesn't touch loans/udhhar | 2026-05-02 |
| D-02 | API namespace: `/api/jwl/v1/` | Prevents collision with existing `/api/` routes | 2026-05-02 |
| D-03 | Jewellery customer model is separate from loans borrower | Different data shape (GST, KYC, loyalty); optional FK links them | 2026-05-02 |
| D-04 | `UserModuleRole(user, module, role, branch)` for RBAC | Supports multi-module, multi-branch roles per user | 2026-05-02 |
| D-05 | Feature flag `jewellery` on tenant activates the module | Tenants without flag see nothing | 2026-05-02 |
| D-06 | Gold Pledge Loans is jewellery module, NOT the existing loans module | Different collateral model; existing loans = cash; pledge = gold ornaments | 2026-05-02 |
| D-07 | All business formulas mirrored in TypeScript for real-time UI preview; server is source of truth on issue | Avoids stale UI while keeping backend authoritative | 2026-05-02 |
| D-08 | Phase 1: MCX rate is manual override only; Phase 2: live feed | MCX API licensing is a blocker; don't block Phase 1 shipping | 2026-05-02 |
| D-09 | Aadhaar: only last 4 digits in any API response; encrypted in DB | DPDP Act 2023 compliance | 2026-05-02 |
| D-10 | Frontend jewellery module uses separate RTK slice `jewelleryApi` | Keeps jewellery state isolated from loans/udhhar state | 2026-05-02 |

---

## §4 — Files Created / Modified

### Documentation files (created 2026-05-02)
| File | Status | Description |
|------|--------|-------------|
| `docs/jewellery/README.md` | ✅ Created | Index file |
| `docs/jewellery/00-overview-and-architecture.md` | ✅ Created | Architecture, module map |
| `docs/jewellery/01-phase-wise-implementation.md` | ✅ Created | Phase 1/2/3 task lists |
| `docs/jewellery/02-database-schema.md` | ✅ Created | Django model code |
| `docs/jewellery/03-api-design.md` | ✅ Created | API contracts |
| `docs/jewellery/04-ui-ux-mapping.md` | ✅ Created | Routes, screens, components |
| `docs/jewellery/05-integration-points.md` | ✅ Created | Integration with existing system |
| `docs/jewellery/06-multi-role-user-system.md` | ✅ Created | RBAC, UserModuleRole |
| `docs/jewellery/07-ai-agent-playbook.md` | ✅ Created | Agent roles, domain knowledge |
| `docs/jewellery/AGENT-HANDOFF.md` | ✅ Created | This file |

### Code files (none yet — implementation not started)
_Will be filled in as implementation progresses._

---

## §5 — Phase 1: Core Shop Operations

**Estimated effort:** 8–10 weeks  
**Goal:** Jeweller can onboard, manage catalogue, manage stock, create basic bills.

---

### BACKEND TASKS

#### B-1.1 — Django App Bootstrap
**Status:** ⏳ Pending  
**Files to create:**
```
backend/apps/jewellery/__init__.py
backend/apps/jewellery/apps.py
backend/apps/jewellery/urls.py
backend/apps/jewellery/models/__init__.py
backend/apps/jewellery/models/base.py         ← JewelleryBaseModel mixin
backend/apps/jewellery/services/__init__.py
backend/apps/jewellery/tests/__init__.py
```
**Files to modify:**
- `backend/config/settings.py` — add `'apps.jewellery'` to `INSTALLED_APPS`
- `backend/config/urls.py` — add `path('api/jwl/v1/', include('apps.jewellery.urls'))`

**Checklist:**
- [ ] App created and registered
- [ ] `JewelleryBaseModel` abstract model created (see `02-database-schema.md §Base Model`)
- [ ] `JewelleryFeatureGuard` permission class created
- [ ] `HasJewelleryPermission(code)` permission class created
- [ ] URL namespace `/api/jwl/v1/` registered
- [ ] `python manage.py check` passes with no errors

---

#### B-1.2 — Master Data Models (Module 3)
**Status:** ⏳ Pending  
**Depends on:** B-1.1  
**Files to create:**
```
backend/apps/jewellery/models/master.py
backend/apps/jewellery/serializers/master.py
backend/apps/jewellery/views/master.py
backend/apps/jewellery/management/commands/seed_jewellery_defaults.py
```
**Models to implement:** `Metal`, `Purity`, `Category`, `Design`, `TaxSlab`, `NumberSeries`  
_(See exact field definitions in `02-database-schema.md §Master Data`)_

**Checklist:**
- [ ] `Metal`, `Purity` models created (read-only; seeded by management command)
- [ ] `Category` model created (self-referencing tree via `parent` FK)
- [ ] `Design` model created (`image_urls` JSONField, `bom` JSONField)
- [ ] `TaxSlab` model created (with `effective_from`, `effective_to`)
- [ ] `NumberSeries` model created (with `prefix`, `next_number`, `padding`)
- [ ] Initial migration created and tested
- [ ] `seed_jewellery_defaults` command seeds: GOLD/SILVER/PLAT metals, all purities, default tax slabs (3%/5%/18%), default number series
- [ ] CRUD ViewSets for Category, Design, TaxSlab, NumberSeries
- [ ] GET-only endpoints for Metal, Purity
- [ ] All endpoints require `JewelleryFeatureGuard`
- [ ] Unit test: category tree returns parent→child correctly
- [ ] Unit test: seed command is idempotent (safe to run twice)

---

#### B-1.3 — Item (Inventory) Models (Module 2 — Part)
**Status:** ⏳ Pending  
**Depends on:** B-1.2  
**Files to create:**
```
backend/apps/jewellery/models/inventory.py
backend/apps/jewellery/serializers/inventory.py
backend/apps/jewellery/views/inventory.py
backend/apps/jewellery/services/inventory.py
```
**Models:** `Item`, `Diamond`, `Stone`, `StockMovement`, `StockTake`, `StockTakeLine`, `Transfer`, `TransferLine`  
_(See `02-database-schema.md §Inventory Movements`)_

**Checklist:**
- [ ] `Item` model created with all weight/purity fields and `status` choices
- [ ] `StockMovement` model created (reference_type + reference_id generic FK pattern)
- [ ] `StockTake` + `StockTakeLine` models created
- [ ] `Transfer` + `TransferLine` models created (5-stage status)
- [ ] Migrations created and tested
- [ ] `ItemViewSet`: list (with filters: branch, design, status, purity), create, retrieve, update
- [ ] `POST /items/{id}/write-off/` — sets status=WRITTEN_OFF, records StockMovement, writes audit log
- [ ] `GET /items/scan/{code}/` — resolves barcode/QR/HUID to item detail
- [ ] `POST /stock-takes/` + submit lines + complete endpoints
- [ ] Transfer CRUD + approve/dispatch/receive actions
- [ ] Unit test: write-off creates StockMovement with type WRITE_OFF
- [ ] Unit test: scan endpoint resolves by barcode, sku, and huid
- [ ] Unit test: tenant A cannot see tenant B items (isolation)

---

#### B-1.4 — MCX Rate Service (Module 12)
**Status:** ⏳ Pending  
**Depends on:** B-1.2  
**Files to create:**
```
backend/apps/jewellery/models/rates.py
backend/apps/jewellery/serializers/rates.py
backend/apps/jewellery/views/rates.py
backend/apps/jewellery/services/rates.py    ← gold rate derivation formula
```
**Models:** `RateHistory`, `TenantRate`

**Checklist:**
- [ ] `RateHistory` model created (index on `metal, purity, ts`)
- [ ] `TenantRate` model created (`buy_rate`, `sell_rate`, `override_reason`)
- [ ] `GET /rates/live/` — returns latest rate per metal/purity with `is_stale` flag
- [ ] `GET /rates/history/` — filterable by metal, purity, date range
- [ ] `POST /rates/override/` — Admin only; records to TenantRate + audit log
- [ ] `calculate_gold_rate(mcx_rate, purity_pct, markup_pct)` in `services/rates.py`
- [ ] Unit test: formula matches master spec example (MCX 68500, 22K, 1.5% markup → ₹6,373)
- [ ] Phase 1: rate is manually entered; no external API call (Phase 2 concern)

---

#### B-1.5 — Billing Service (Module 1 — Core)
**Status:** ⏳ Pending  
**Depends on:** B-1.3, B-1.4  
**Files to create:**
```
backend/apps/jewellery/models/billing.py
backend/apps/jewellery/serializers/billing.py
backend/apps/jewellery/views/billing.py
backend/apps/jewellery/services/billing.py    ← ALL invoice formulas here
backend/apps/jewellery/services/number_series.py
backend/apps/jewellery/tests/test_billing_formulas.py
backend/apps/jewellery/tests/test_billing_api.py
```
**Models:** `Customer`, `SalesInvoice`, `SalesInvoiceLine`, `SalesInvoicePayment`, `OldGoldPurchase`

**Formula implementations required** (from `DigiKhaato-Jewellery-ERP-COMPLETE.md §7`):
- `7.1` — Gold rate derivation
- `7.2` — Making charge (3 modes: per-gram, % of metal, per-piece)
- `7.3` — Wastage amount
- `7.5` — Hallmarking fee
- `7.6` — Line subtotal + GST split (CGST/SGST/IGST)
- `7.7` — Bill-level discount + round-off
- `7.8` — Old gold exchange deduction

**Checklist:**
- [ ] All billing models created with migrations
- [ ] `calculate_invoice()` service function: takes lines + discount → returns all computed fields
- [ ] `POST /sales/invoices/calculate/` — stateless preview endpoint (no auth required)
- [ ] `POST /sales/invoices/` — creates DRAFT invoice
- [ ] `POST /sales/invoices/{id}/issue/` — atomically: assigns voucher_no (number series, locked), posts ledger (stub for Phase 2), updates item status → SOLD
- [ ] `POST /sales/invoices/{id}/cancel/` — Manager+ permission; writes audit log
- [ ] `GET /sales/invoices/{id}/pdf/` — generates PDF (WeasyPrint or ReportLab)
- [ ] Estimate type: creates invoice with `invoice_type=ESTIMATE`; no stock movement on issue
- [ ] Old gold: `POST /sales/old-gold-purchases/` creates deduction voucher
- [ ] Number series: `get_next_number(tenant, branch, voucher_type)` uses `select_for_update()` — CRITICAL: no race condition
- [ ] Unit test: intra-state GST: CGST 1.5% + SGST 1.5% (not 3% IGST)
- [ ] Unit test: inter-state GST: IGST 3% (not CGST/SGST)
- [ ] Unit test: old gold deduction reduces `total_payable`
- [ ] Unit test: discount allocated proportionally per line
- [ ] Unit test: issuing invoice sets item status → SOLD
- [ ] Unit test: cannot issue invoice for item with status ≠ IN_STOCK

---

#### B-1.6 — Users & Roles Extension (Module 9 — Phase 1)
**Status:** ⏳ Pending  
**Depends on:** B-1.1  
**Files to modify:**
- `backend/apps/users/models.py` — add `UserModuleRole` model (see `06-multi-role-user-system.md`)
- `backend/apps/users/serializers.py` — add serializers for UserModuleRole
- `backend/apps/users/views.py` — add CRUD endpoints

**Checklist:**
- [ ] `UserModuleRole(user, module, role, branch, granted_by, expires_at)` model created
- [ ] Migration created
- [ ] `GET/POST /users/{id}/module-roles/` endpoints
- [ ] `jewellery` permission codes added to `common/constants.py` (or equivalent constants file)
- [ ] 7 predefined jewellery roles seeded: `jwl_admin`, `jwl_manager`, `jwl_cashier`, `jwl_salesperson`, `jwl_karigar_manager`, `jwl_pledge_officer`, `jwl_auditor`
- [ ] Unit test: cashier cannot access cancel endpoint (403)
- [ ] Unit test: manager can access cancel endpoint (200)

---

#### B-1.7 — Admin Controls (Module 15 — Phase 1)
**Status:** ⏳ Pending  
**Depends on:** B-1.1  
**Files to create:**
```
backend/apps/jewellery/views/admin.py
```
**Checklist:**
- [ ] `GET/PATCH /admin/feature-flags/` endpoints
- [ ] `GET /admin/trash/` and `POST /admin/trash/{entity}/{id}/restore/`
- [ ] `POST /admin/lock-period/` — sets locked period; billing views check this
- [ ] Unit test: restore from trash recovers soft-deleted item

---

### FRONTEND TASKS

#### F-1.1 — Module Shell & Routing
**Status:** ⏳ Pending  
**Depends on:** B-1.1 (API must respond to auth checks)  
**Files to create:**
```
frontend/src/app/jewellery/layout.tsx
frontend/src/app/jewellery/page.tsx           ← redirects to /jewellery/dashboard
frontend/src/app/jewellery/dashboard/page.tsx
frontend/src/store/jewellery-api.ts           ← RTK Query slice base
```
**Files to modify:**
- `frontend/src/components/layout/Sidebar.tsx` — add jewellery section
- `frontend/src/lib/moduleNav.ts` — add jewellery module entry
- `frontend/src/app/modules/page.tsx` — add Jewellery ERP card (feature-flagged)

**Checklist:**
- [ ] `/jewellery` route tree created in Next.js app router
- [ ] `jewelleryApi` RTK slice created (base URL `/api/jwl/v1/`)
- [ ] Feature flag guard: if `tenant.feature_flags.jewellery !== true`, redirect to `/modules`
- [ ] Sidebar: jewellery section with all 15 sub-module nav items (collapsed by default)
- [ ] Sidebar nav matches structure from `digikhaato_jewellery_sidebar.html`
- [ ] Module card on `/modules` page shows Jewellery ERP (gold icon, feature-flag-gated)
- [ ] Dashboard page renders 4 KPI cards (stubs with loading state)
- [ ] Mobile bottom nav: jewellery module entry

---

#### F-1.2 — Jewellery Master UI
**Status:** ⏳ Pending  
**Depends on:** F-1.1, B-1.2  
**Files to create:**
```
frontend/src/app/jewellery/master/categories/page.tsx
frontend/src/app/jewellery/master/designs/page.tsx
frontend/src/app/jewellery/master/designs/new/page.tsx
frontend/src/app/jewellery/master/tax-slabs/page.tsx
frontend/src/app/jewellery/master/number-series/page.tsx
frontend/src/features/jewellery/master-api.ts
```
**Checklist:**
- [ ] Category tree: expandable/collapsible tree, add child category, edit name/HSN
- [ ] Design library: grid of design cards with image, add new design form
- [ ] Design form: category select, image upload (S3 presign), default weights
- [ ] Tax slab list with effective dates, edit existing slab
- [ ] Number series: show prefix, next number, edit prefix/padding per voucher type
- [ ] All forms use `react-hook-form` + `zod` validation (existing pattern)

---

#### F-1.3 — Inventory UI
**Status:** ⏳ Pending  
**Depends on:** F-1.1, B-1.3  
**Files to create:**
```
frontend/src/app/jewellery/inventory/page.tsx
frontend/src/app/jewellery/inventory/new/page.tsx
frontend/src/app/jewellery/inventory/[id]/page.tsx
frontend/src/app/jewellery/inventory/stock-take/new/page.tsx
frontend/src/app/jewellery/inventory/transfers/page.tsx
frontend/src/app/jewellery/inventory/transfers/new/page.tsx
frontend/src/features/jewellery/inventory-api.ts
frontend/src/components/jewellery/inventory/ItemCard.tsx
frontend/src/components/jewellery/inventory/WeightInput.tsx
frontend/src/components/jewellery/inventory/PuritySelector.tsx
```
**Checklist:**
- [ ] Item list: filter chips (status, purity, category, branch), search by SKU/HUID
- [ ] Item detail: all weights, purity, status badge, location bin
- [ ] Item detail tabs: Details, Movement History, Tags
- [ ] Add item form: design autocomplete, weight fields (4dp), purity cascading select, HUID, barcode
- [ ] `WeightInput` component: decimal input, "g" label, 4dp validation
- [ ] `PuritySelector` component: metal select → purity select (cascading)
- [ ] Stock take wizard: item list with scan/manual entry, counted weight input, discrepancy preview
- [ ] Transfer form: item multi-select → to-branch select
- [ ] Transfer list with status timeline
- [ ] Write-off button on item detail (Manager+ only, confirm dialog)

---

#### F-1.4 — MCX Rate Widget
**Status:** ⏳ Pending  
**Depends on:** F-1.1, B-1.4  
**Files to create:**
```
frontend/src/components/jewellery/shared/RateTicker.tsx
frontend/src/app/jewellery/settings/rates/page.tsx
frontend/src/features/jewellery/rates-api.ts
```
**Checklist:**
- [ ] `RateTicker` component: shows Gold 22K rate, Silver rate, last-updated time, stale indicator
- [ ] Auto-refresh every 60 seconds via RTK Query `pollingInterval`
- [ ] Stale flag turns ticker amber after 5 minutes without update
- [ ] Rate override form: metal, purity, buy/sell rate, reason (Admin only)
- [ ] Rate history mini-chart using existing chart library (or simple table)
- [ ] `RateTicker` placed in jewellery layout so it shows on all billing screens

---

#### F-1.5 — Billing UI
**Status:** ⏳ Pending  
**Depends on:** F-1.3, F-1.4  
**Files to create:**
```
frontend/src/app/jewellery/billing/page.tsx
frontend/src/app/jewellery/billing/new/page.tsx
frontend/src/app/jewellery/billing/[id]/page.tsx
frontend/src/app/jewellery/billing/old-gold/new/page.tsx
frontend/src/features/jewellery/billing-api.ts
frontend/src/components/jewellery/billing/InvoiceLineRow.tsx
frontend/src/components/jewellery/billing/GstBreakdown.tsx
frontend/src/components/jewellery/billing/PaymentSplitTable.tsx
frontend/src/utils/jewellery/formulas.ts       ← TypeScript formula mirrors
frontend/src/validation/jewellery/invoice.validation.ts
```
**Checklist:**
- [ ] `formulas.ts`: TypeScript implementations of formulas 7.1–7.8 (see master spec)
- [ ] Invoice creation page: customer search autocomplete, invoice type toggle
- [ ] Line item row: item scan/search, metal/purity auto-fill, weight fields, rate auto-fill from MCX
- [ ] Line-level computed preview: metal value, making ₹, wastage ₹, GST, line total (real-time)
- [ ] Bill summary panel: taxable, CGST/SGST/IGST, round-off, total payable
- [ ] `POST /calculate/` called on every line change (debounced 300ms)
- [ ] Payment split table: add rows for Cash/UPI/Card/Bank/Advance
- [ ] Old gold section: purity input, weight, auto-computed deduction
- [ ] Save Draft → Issue Invoice → Print PDF flow
- [ ] Cancel invoice: Manager+ role gate, confirm dialog, reason input
- [ ] Invoice list: filter by date range, status, customer; sort by date
- [ ] Invoice detail: all line items, payment breakdown, print/share buttons

---

#### F-1.6 — Customer Management UI
**Status:** ⏳ Pending  
**Depends on:** F-1.1, B-1.5  
**Files to create:**
```
frontend/src/app/jewellery/customers/page.tsx
frontend/src/app/jewellery/customers/new/page.tsx
frontend/src/app/jewellery/customers/[id]/page.tsx
frontend/src/features/jewellery/customers-api.ts
```
**Checklist:**
- [ ] Customer list with search (name, mobile)
- [ ] Customer add/edit form: name, mobile, email, GSTIN, PAN, DOB, anniversary
- [ ] Customer detail: purchase history, outstanding balance, loyalty points
- [ ] KYC upload: photo, signature, address proof (file upload to S3 presign)

---

### Phase 1 completion gate
- [ ] All B-1.x backend tasks completed and unit-tested
- [ ] All F-1.x frontend tasks completed
- [ ] Multi-tenant isolation test passes (Tenant A cannot see Tenant B data)
- [ ] Formula unit tests pass with values matching master spec examples
- [ ] `python manage.py check` clean
- [ ] TypeScript `tsc --noEmit` clean

---

## §6 — Phase 2: Full Business Operations

**Status:** ⏳ NOT STARTED (blocked on Phase 1 completion)  
**Estimated effort:** 10–12 weeks  

> Full task breakdown in `docs/jewellery/01-phase-wise-implementation.md §Phase 2`

### High-level task groups (to expand when Phase 1 is done)

| Task Group | Key Models | Key Services |
|------------|-----------|--------------|
| B-2.1 Order & Karigar | Karigar, CustomerOrder, KarigarIssue, KarigarReceipt | Tunch/wastage reconciliation (formula 7.18) |
| B-2.2 Accounts & Ledger | Account (COA), Voucher, VoucherEntry, BankAccount | Double-entry posting, bank recon |
| B-2.3 GST & Reports | GstFiling, EInvoice | GSTR-1 JSON builder, GSTR-3B |
| B-2.4 Party Outstanding | PartyOutstandingBalance, PartyOutstandingMovement | Dual balance (metal + amount) |
| B-2.5 Gold Pledge Loans | GoldPledgeLoan, PledgeItem, PledgeKYC, LoanRepayment | Interest calc (formulas 7.11–7.17), LTV |
| B-2.6 Multi-Branch | JewelleryBranchConfig | Transfer workflow, branch-wise reporting |
| B-2.7 Notifications | MessageTemplate, Message, Broadcast | Celery tasks, WhatsApp API, SMS DLT |

**Phase 2 gate conditions:**
- [ ] Phase 1 complete
- [ ] Celery + Redis added to `docker-compose.yml`
- [ ] GST reports reviewed by a CA before marking complete
- [ ] Gold pledge interest calculations verified against manual test cases
- [ ] KYC PII encryption (DPDP Act 2023) in place before pledge goes live

---

## §7 — Phase 3: Advanced / Scale

**Status:** ⏳ NOT STARTED (blocked on Phase 2)  

| Task Group | Notes |
|------------|-------|
| Barcode / RFID (Module 11) | Requires RFID hardware compatibility testing |
| Mobile PWA offline mode | Service worker queue + conflict resolution |
| Live MCX rate feed | Requires licensed MCX data feed |
| E-invoice GSP integration | Requires IRP/GSTN GSP credentials |
| WebSocket rate ticker | Django Channels + Redis pub/sub |
| DB partition (monthly) | `stock_movements`, `audit_log` |

---

## §8 — Known Blockers & Open Questions

| # | Blocker | Impact | Resolution |
|---|---------|--------|-----------|
| BL-01 | MCX live rate feed requires paid licensing | Phase 2 live rate feature | Use manual override in Phase 1; source licensed feed before Phase 2 ships |
| BL-02 | GSP credentials for e-invoice (IRN) are tenant-specific | Phase 2 e-invoice | Use mock GSP endpoint in staging; real integration per-tenant in Phase 3 |
| BL-03 | S3 bucket setup for item images and KYC documents | Phase 1 image upload | Configure S3 credentials before F-1.2 (design images) and F-1.6 (KYC) |
| BL-04 | RFID hardware vendor not selected | Phase 3 RFID | Decision deferred to Phase 3 kickoff |
| BL-05 | WhatsApp Business API account approval (Meta) | Phase 2 notifications | Apply for approval during Phase 1 (6–8 week approval time) |

---

## §9 — How to Update This Document

After completing any task block:

1. Change its status from `⏳ Pending` → `🔄 In Progress` → `✅ Done`
2. Fill in the "Files to create" section with actual file paths
3. Update §4 (Files Created / Modified) with each file you touched
4. Update §1 (Current Status) with the current phase state
5. Update §2 (Next Agent Instructions) with the exact next task to resume
6. Add any new decisions to §3 (Decisions Log)
7. If you hit a new blocker, add it to §8

### Status symbols
```
✅  Done / complete
🔄  In progress (you are working on this now)
⏳  Pending (not started)
🚫  Blocked (waiting on external dependency)
❌  Cancelled / descoped
```

---

## §10 — Quick Reference

### Existing backend apps (do not modify structure)
```
apps/common/          ← shared: audit, permissions, pagination, models
apps/accounts/        ← auth (JWT)
apps/users/           ← user model, team management
apps/onboarding/      ← tenant / business profile
apps/borrowers/       ← Loan module: borrowers
apps/loans/           ← Loan module: loans
apps/collections/     ← Loan module: collections
apps/notifications/   ← shared notifications service
apps/notes/           ← Notes app
apps/customer_ledger/ ← Udhhar app: customer ledger
apps/dashboard/       ← dashboard APIs
apps/reports/         ← report APIs
apps/locations/       ← location management
```

### Existing frontend patterns to follow
```
src/features/<module>/<module>-api.ts   ← RTK Query endpoints per module
src/store/api.ts                        ← base RTK apiSlice to extend
src/lib/axios.ts                        ← shared Axios with JWT interceptor
src/components/ui/                      ← Button, Input, Card, Modal, etc.
src/hooks/useRoleAccess.ts             ← role check pattern to follow
src/validation/<module>.validation.ts  ← Zod schemas
```

### Key formulas cheat sheet (from master spec §7)
| Formula | Location |
|---------|---------|
| Gold rate per gram | spec §7.1 |
| Making charge | spec §7.2 |
| Wastage | spec §7.3 |
| GST split (CGST/SGST/IGST) | spec §7.6 |
| Bill discount + round-off | spec §7.7 |
| Old gold deduction | spec §7.8 |
| Pledge loan — simple interest | spec §7.11 |
| Pledge loan — compound interest | spec §7.12 |
| Pledge loan — daily interest | spec §7.13 |
| LTV calculation | spec §7.15 |
| Karigar tunch reconciliation | spec §7.18 |

All formulas with worked examples: `docs/jewellery/DigiKhaato-Jewellery-ERP-COMPLETE.md §7`
