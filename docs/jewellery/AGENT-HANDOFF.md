# Jewellery ERP — AI Agent Handoff Document

**Module:** DigiKhaato Jewellery ERP  
**Last Updated:** 2026-05-05  
**Last Agent:** Codex (GPT-5) — completed Phase B billing core flow updates and UX refactor: added `CREDIT_NOTE` invoice type + `reference_invoice` link, sale-return list flow (`?view=sale-return`), backend printable PDF endpoint `GET /api/jwl/v1/sales/invoices/{id}/pdf/`, and invoice detail `Print` + `Download PDF` + `Create credit note` actions. Refactored invoice creation to a **drawer-first flow** (instead of page navigation) using shared `Drawer` + `Input/Select/Button` components aligned with Loan Management; added progressive disclosure via accordion sections (Basic Details, Line Items, Payments, Old Gold, Review), with `Add line item` / `Add payment` actions expanding only when needed. Added backend invoice `search` filter and action-level billing permission checks in create/issue/cancel/pdf endpoints. Frontend build verified (`next build` passed).  
**Next Agent:** Resume **Phase 1, Task B-1.6** (Users & Roles extension), then finish remaining billing gaps: share integrations (WhatsApp/SMS), e-invoice (IRN/QR), and deeper backend-role enforcement for list/retrieve parity.

> **How to use this document**
> Read §1 (Current Status) and §2 (Next Agent Instructions) first. Then read the relevant phase section for context. Update §1 and the task checkbox that you completed before your context ends.

---

## §1 — Current Status

```
PHASE          STATUS
─────────────────────────────────────────────────
Documentation  ✅ COMPLETE
Phase 1        🔄 IN PROGRESS  (B-1.1✅ B-1.2✅ B-1.3✅ B-1.4✅ B-1.5✅ B-1.6⏳ B-1.7⏳)
Phase 2        ⏳ NOT STARTED
Phase 3        ⏳ NOT STARTED
```

### What exists right now

**Backend — Jewellery app: B-1.5 BILLING + PHASE-B EXTENSIONS**  
`backend/apps/jewellery/` billing now includes: `CREDIT_NOTE` type, `reference_invoice` linkage, stock reversal logic for sale-return issue/cancel, invoice search by customer/mobile/voucher (`search` param), and printable PDF generation endpoint at `/api/jwl/v1/sales/invoices/{id}/pdf/`. Migration `0005_credit_note_salesinvoice_reference.py` added on top of `0004_billing`.

**Frontend — Jewellery module: SHELL READY (F-1.1 done)**  
`/jewellery` route tree, module API slice, full 15-module sidebar parity, and dashboard KPI stub are implemented.

**Frontend — Multi-module platform UX: UPDATED (2026-05-02)**  
Default post-auth landing for regular app users is UdhaarBook (`/udhaarbook`). Modules page is simplified to plain module cards (Loan Management + Jewellery ERP only), without status chips or activation messages.

**Frontend — SaaS Messaging Layer: UPDATED (2026-05-02)**  
Landing, modules, and onboarding copy now reflect a modular SaaS model: Notes/UdhaarBook as core included apps, jewellery/loans as activation-based add-ons, and “Django + Postgres first, external integrations later” positioning.

**Frontend — SaaS UI Layer: UPDATED (2026-05-02)**  
Sidebar/mobile app navigation now includes a `Modules` entry at the bottom of the `Apps` list. Jewellery is no longer hidden by frontend feature-flag gating, so users can open/start module flows directly from UI.

**Frontend — Sidebar IA Layer: UPDATED (2026-05-03)**  
Apps in sidebar/drawer now follow SaaS-style hierarchy: each top-level feature can reveal nested sub-features via expand/collapse chevrons, and groups auto-expand on active route.

**Frontend — SaaS Visual Polish Layer: UPDATED (2026-05-03)**  
Shared page layout (`Screen` + `app-container`) now uses wider, left-aligned workspace spacing with stronger heading hierarchy; modules page and jewellery screens now render structured SaaS-style cards/tables instead of sparse centered placeholders.

**Frontend — Jewellery IA + Header Spacing: UPDATED (2026-05-03)**  
In Jewellery module routes, sidebar is now module-first (feature groups with nested sub-features) instead of module-as-feature grouping. Desktop utility header auto-hides when not needed, removing empty top space.

**Frontend — Jewellery Sub-feature Screens: UPDATED (2026-05-03)**  
Billing, Inventory, Karigar, and Gold Pledge screens now map `?view=...` sub-features to contextual page headers and top action/summary presets so selected sub-features no longer render as a single generic page.

**Frontend — Billing UI: PARTIAL IMPLEMENTATION (2026-05-05, updated)**  
Billing now has functional list/new/detail routes with live calculation preview, payments, old-gold entries, issue/cancel actions, sale-return/credit-note list flow, invoice print/download-PDF actions, and drawer-based create flows for invoice/credit note with accordion sections for mobile-first usability. Remaining work is share integrations, e-invoice flow, and stricter permission parity checks across all billing endpoints.

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

### Cross-Module Access Program (NEW — 2026-05-03)

This repo now needs a **module-isolated SaaS access model** across Loans, UdhaarBook, and Jewellery (JWL):

1. Sidebar/drawer must show **only the selected module**.
2. Module visibility and feature visibility must be **API-driven** from `module_roles[].features`.
3. New users with zero module access must land on an **Access Onboarding** screen (no module sidebar features).
4. Module admins can manage users/roles **only within their module**.
5. A user can be `admin` in module A and a constrained role in module B simultaneously.

#### Target behavior

- If `UdhaarBook` is selected, show only UdhaarBook nav + features.
- If `Loan Management` is selected, show only loan nav + features.
- If `Jewellery ERP` is selected, show only JWL nav + features.
- No cross-module role assignment from module admin surfaces.

#### Delivery plan (implementation sequence)

1. **Module selection + isolation in frontend shell**
   - Introduce selected-module state.
   - Sidebar/mobile/bottom nav render only selected module.
   - Module switcher lists only modules user can access.
2. **No-access onboarding flow**
   - Login redirect resolver must route zero-access users to onboarding page.
   - Add page with `Request access` + (policy-gated) `Self-onboard`.
3. **Backend access metadata**
   - Extend `/api/auth/me/` payload with `accessible_modules`, `default_module`, and `module_admin` capability flags.
4. **Module-scoped user management APIs**
   - New endpoints for module team management.
   - Enforce strict server-side checks so module admins cannot grant outside their module.
5. **Frontend API integration**
   - Wire onboarding actions, module selection persistence, and module-scoped team screens.
6. **Guardrails + tests**
   - Block module route access if no active role for that module.
   - Add tests for cross-module assignment denial and zero-access redirects.

### Mandatory reading (in this order)
1. `docs/jewellery/00-overview-and-architecture.md` — architecture decisions
2. `docs/jewellery/02-database-schema.md` — exact model definitions
3. `docs/jewellery/03-api-design.md` — API contracts
4. `docs/jewellery/DigiKhaato-Jewellery-ERP-COMPLETE.md` Section 7 — all business formulas

### Current task to resume
**Phase 1 — Users & Roles Extension (B-1.6) AND Billing UI (F-1.5 remaining)**

Two parallel tracks. Pick based on priority:

**Track A — B-1.6 Backend: Users & Roles**  
Add `UserModuleRole` model to `apps/users/`, expose CRUD endpoints, seed 7 jewellery roles.

**Track B — F-1.5 Frontend: Billing UI**  
Build the billing UI: new invoice page, line item form with real-time calculation preview, payment split, old gold section, issue/cancel flows.

### Exact next steps (B-1.6 — recommended first)
1. Add `UserModuleRole(user, module, role, branch, granted_by, expires_at)` to `apps/users/models.py`
2. Create serializers + `GET/POST /users/{id}/module-roles/` endpoints
3. Seed 7 roles: `jwl_admin`, `jwl_manager`, `jwl_cashier`, `jwl_salesperson`, `jwl_karigar_manager`, `jwl_pledge_officer`, `jwl_auditor`
4. Tests: cashier cannot cancel (403), manager can cancel (200)

### Exact next steps (F-1.5 — Billing UI)
1. Add WhatsApp/SMS share integrations in Billing & Sales and wire real action handlers
2. Implement e-invoice (IRN/QR) API + UI workflow
3. Tighten read/list/retrieve role gates to backend module permissions (`jwl_permissions`) everywhere, not only create/issue/cancel/pdf
4. Add frontend tests for calculate debounce, issue/cancel gating, and credit-note submit flow

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
| D-11 | Jewellery base model uses `tenant` FK to `AUTH_USER_MODEL` and `branch_name` string in this repo | Current platform has no `core.Tenant/core.Branch` models; branch context is string/header based | 2026-05-02 |
| D-12 | Add `/api/jwl/v1/system/bootstrap/` as initial backend↔frontend handshake endpoint | Enables end-to-end module integration before full business APIs are implemented | 2026-05-02 |
| D-13 | Master data (`Metal`, `Purity`) is tenant-scoped in this repo and seeded per tenant by command | Keeps strict tenancy boundaries while honoring `JewelleryBaseModel` requirement | 2026-05-02 |
| D-14 | Default post-auth landing for regular app users is `/udhaarbook` | UdhaarBook is the default working module; additional modules are optional via Modules section | 2026-05-02 |
| D-15 | Notes and UdhaarBook remain on existing list routes (no separate dashboard entrypoint) | These two modules are free/common flows and should stay simple for all internal users | 2026-05-02 |
| D-16 | Module cards trigger self-service activation endpoint before navigation | Users can start modules without pre-assigned membership; jewellery auto-assigns `jwl_admin` role to starter user | 2026-05-02 |
| D-17 | Sidebar uses expandable parent→sub-feature navigation for module apps | Matches expected SaaS information architecture and makes module capabilities discoverable without route guessing | 2026-05-03 |
| D-18 | Use shared wide workspace layout + structured placeholder templates for unfinished jewellery screens | Keeps visual consistency and avoids incomplete/empty-feeling pages while backend modules are still being implemented | 2026-05-03 |
| D-19 | In Jewellery routes, sidebar IA is module-first (feature groups + sub-features); desktop utility header hides when empty | Matches requested SaaS navigation semantics and removes unnecessary header whitespace | 2026-05-03 |
| D-20 | Sidebar active-state matching must include query params for sub-feature links (`?view=...`) | Ensures only the selected sub-feature is highlighted and auto-expanded correctly in SaaS-style feature trees | 2026-05-03 |
| D-21 | Navigation must be selected-module scoped (never mixed-module sidebar) | Prevents accidental exposure/confusion and enforces platform-within-platform UX | 2026-05-03 |
| D-22 | Zero-access users must land on Access Onboarding (not a module route) | Explicitly handles first-login without module assignment and avoids dead-end UX | 2026-05-03 |
| D-23 | Module admins can assign roles only inside their module | Enforces hard authorization boundaries across modules in shared SaaS tenant | 2026-05-03 |

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

### Code files (updated 2026-05-02)
| File | Status | Description |
|------|--------|-------------|
| `backend/apps/jewellery/__init__.py` | ✅ Created | Jewellery app package |
| `backend/apps/jewellery/apps.py` | ✅ Created | Django app config |
| `backend/apps/jewellery/urls.py` | ✅ Modified | Registered `system/bootstrap` + B-1.2 master routes |
| `backend/apps/jewellery/models/__init__.py` | ✅ Created | Base model export |
| `backend/apps/jewellery/models/base.py` | ✅ Created | `JewelleryBaseModel` abstract model |
| `backend/apps/jewellery/permissions.py` | ✅ Created | `JewelleryFeatureGuard`, `HasJewelleryPermission` |
| `backend/apps/jewellery/services/__init__.py` | ✅ Created | Services package init |
| `backend/apps/jewellery/tests/__init__.py` | ✅ Created | Tests package init |
| `backend/apps/jewellery/migrations/__init__.py` | ✅ Created | Migrations package init |
| `backend/apps/jewellery/models/master.py` | ✅ Modified | Implemented B-1.2 master models |
| `backend/apps/jewellery/models/inventory.py` | ✅ Implemented | B-1.3 Item, Diamond, Stone, StockMovement, Transfer, TransferLine, StockTake, StockTakeLine |
| `backend/apps/jewellery/models/billing.py` | ✅ Created | B-1.5 placeholder file |
| `backend/apps/jewellery/models/rates.py` | ✅ Created | B-1.4 placeholder file |
| `backend/apps/jewellery/models/karigar.py` | ✅ Created | Phase 2 placeholder file |
| `backend/apps/jewellery/models/accounts.py` | ✅ Created | Phase 2 placeholder file |
| `backend/apps/jewellery/models/gst.py` | ✅ Created | Phase 2 placeholder file |
| `backend/apps/jewellery/models/pledge.py` | ✅ Created | Phase 2 placeholder file |
| `backend/apps/jewellery/models/notifications.py` | ✅ Created | Phase 2 placeholder file |
| `backend/apps/jewellery/serializers/__init__.py` | ✅ Created | Serializers package |
| `backend/apps/jewellery/serializers/master.py` | ✅ Created | B-1.2 serializers |
| `backend/apps/jewellery/serializers/system.py` | ✅ Created | Bootstrap response serializer |
| `backend/apps/jewellery/views/__init__.py` | ✅ Created | Views package |
| `backend/apps/jewellery/views/master.py` | ✅ Created | B-1.2 viewsets |
| `backend/apps/jewellery/views/system.py` | ✅ Created | `JewelleryBootstrapView` |
| `backend/apps/jewellery/tests/test_system_api.py` | ✅ Created | Integration tests for bootstrap endpoint |
| `backend/apps/jewellery/tests/test_master.py` | ✅ Created | B-1.2 tests (category tree, seed idempotency) |
| `backend/apps/jewellery/management/commands/seed_jewellery_defaults.py` | ✅ Created | Tenant-wise default master seeding command |
| `backend/apps/jewellery/migrations/0001_initial.py` | ✅ Created | Initial jewellery migration (B-1.2 models) |
| `backend/apps/jewellery/serializers/inventory.py` | ✅ Created | B-1.3 serializers (Item list/detail/write, Diamond, Stone, StockMovement, Transfer, StockTake) |
| `backend/apps/jewellery/views/inventory.py` | ✅ Created | B-1.3 viewsets: ItemViewSet (write-off, scan), StockMovementViewSet, StockTakeViewSet, TransferViewSet |
| `backend/apps/jewellery/services/inventory.py` | ✅ Created | B-1.3 services: write_off_item, scan_item, complete_stock_take, dispatch_transfer, receive_transfer |
| `backend/apps/jewellery/migrations/0002_inventory.py` | ✅ Created | B-1.3 inventory models migration |
| `backend/apps/jewellery/tests/test_inventory.py` | ✅ Created | B-1.3 tests: write-off, scan (barcode/sku/huid), tenant isolation |
| `docs/jewellery/USER-GUIDE.md` | ✅ Created | Step-by-step user guide for implemented features (updated as phases complete) |
| `backend/apps/jewellery/models/rates.py` | ✅ Created | B-1.4 RateHistory (global) + TenantRate (tenant override) models |
| `backend/apps/jewellery/serializers/rates.py` | ✅ Created | B-1.4 serializers: LiveRateSerializer, RateHistorySerializer, RateOverrideSerializer, TenantRateSerializer |
| `backend/apps/jewellery/views/rates.py` | ✅ Created | B-1.4 views: LiveRatesView, RateHistoryViewSet, RateOverrideView |
| `backend/apps/jewellery/services/rates.py` | ✅ Created | B-1.4 services: calculate_gold_rate (formula §7.1), get_live_rates (stale flag), record_rate_override (atomic upsert) |
| `backend/apps/jewellery/migrations/0003_rates.py` | ✅ Created | B-1.4 hand-written migration for RateHistory + TenantRate |
| `backend/apps/jewellery/tests/test_rates.py` | ✅ Created | B-1.4 tests: formula spec example, zero markup, 24K, override upsert, stale flag, API endpoint |
| `frontend/src/components/jewellery/shared/InfiniteTable.tsx` | ✅ Created | Generic infinite-scroll table with IntersectionObserver; skeleton rows; EmptyState fallback |
| `frontend/src/components/jewellery/shared/StatusBadge.tsx` | ✅ Created | Maps JWL item status to Badge variant (IN_STOCK→success, SOLD→neutral, etc.) |
| `frontend/src/components/jewellery/shared/WeightInput.tsx` | ✅ Created | Input wrapper: type=number, step=0.0001, rightAddon gram unit, react-hook-form compatible |
| `frontend/src/components/jewellery/shared/RateTicker.tsx` | ✅ Created | Polls /rates/live/ every 60s; green/amber dot for live/stale; shows sell_rate per metal/purity |
| `backend/apps/jewellery/models/billing.py` | ✅ Implemented | B-1.5 Customer, SalesInvoice, SalesInvoiceLine, SalesInvoicePayment, OldGoldPurchase |
| `backend/apps/jewellery/serializers/billing.py` | ✅ Created | B-1.5 serializers + write serializers for create/calculate/cancel |
| `backend/apps/jewellery/views/billing.py` | ✅ Created | B-1.5 CustomerViewSet, SalesInvoiceViewSet (issue/cancel), CalculateInvoiceView |
| `backend/apps/jewellery/services/billing.py` | ✅ Created | All formulas §7.2-7.8; calculate_invoice, issue_invoice, cancel_invoice, create_invoice |
| `backend/apps/jewellery/services/number_series.py` | ✅ Created | get_next_number with select_for_update() — race-condition safe |
| `backend/apps/jewellery/migrations/0004_billing.py` | ✅ Created | B-1.5 hand-written migration (5 models) |
| `backend/apps/jewellery/tests/test_billing.py` | ✅ Created | B-1.5 tests: making charge, wastage, GST split, discount, old gold, issue→SOLD, cancel→IN_STOCK, API |
| `docs/jewellery/USER-GUIDE.md` | ✅ Rewritten | Plain-English guide for sales staff: step-by-step billing, payments, old gold exchange, stock take, transfers, FAQ |
| `backend/config/settings/base.py` | ✅ Modified | Added `apps.jewellery` to `INSTALLED_APPS` |
| `backend/config/urls.py` | ✅ Modified | Added jewellery API include and user module self-activation route |
| `backend/apps/users/serializers.py` | ✅ Modified | Added `view:jewellery` to admin/collector permissions |
| `backend/apps/users/views.py` | ✅ Modified | Added `POST /api/users/modules/activate/` for self-service module activation and jewellery owner-role assignment |
| `frontend/src/store/jewellery-api.ts` | ✅ Modified | Full JWL RTK slice including billing/rates; fixed mutation payload transport (`data` instead of `body`) so create/update/calculate/cancel requests send correctly |
| `frontend/src/app/jewellery/layout.tsx` | ✅ Created | Module shell + route guard (feature/permission redirect removed) |
| `frontend/src/app/jewellery/page.tsx` | ✅ Created | Redirects to dashboard |
| `frontend/src/app/jewellery/dashboard/page.tsx` | ✅ Modified | Removed all hardcoded static/fake data; KPIs driven by bootstrap API; activity + stock sections show empty state |
| `frontend/src/components/jewellery/shared/ModulePlaceholder.tsx` | ✅ Modified | Replaced all fake table rows/amounts with empty state messages; presets define structure only (columns, side panel items, actions) |
| `frontend/src/app/jewellery/billing/page.tsx` | ✅ Modified | Real billing list for Tax Invoice/Estimate using `useListInvoicesQuery` + `InfiniteTable` + status/date filters; retained mapped placeholders for unimplemented billing sub-features |
| `frontend/src/app/jewellery/billing/new/page.tsx` | ✅ Created | Full invoice creation form: customer search/select, line editor, scan fill, debounced `/sales/calculate/`, GST summary, payment split, old-gold rows, Save Draft + Save/Issue |
| `frontend/src/app/jewellery/billing/[id]/page.tsx` | ✅ Created | Invoice detail page with lines/payments/totals view and issue/cancel actions (cancel reason modal) |
| `frontend/src/app/jewellery/billing/old-gold/new/page.tsx` | ✅ Created | Entry route to start old-gold-enabled invoice flow |
| `frontend/src/components/jewellery/billing/InvoiceLineRow.tsx` | ✅ Created | Reusable line-item editor with item search/select, weight/rate/making/wastage inputs, and computed line preview |
| `frontend/src/components/jewellery/billing/PaymentSplitTable.tsx` | ✅ Created | Add/remove payment rows with mode/amount/reference and paid-vs-balance summary |
| `frontend/src/utils/jewellery/formulas.ts` | ✅ Created | TypeScript mirrors for key billing formulas (rate, making, wastage, GST split, old-gold deduction, discount allocation, round-off) + INR formatter |
| `frontend/src/validation/jewellery/invoice.validation.ts` | ✅ Created | Yup schema for invoice draft structure (lines, payments, old-gold) |
| `frontend/src/features/jewellery/billing-api.ts` | ✅ Created | Feature-level billing API hook/type re-export |
| `frontend/src/validation/index.ts` | ✅ Modified | Re-exported jewellery invoice validation schema |
| `frontend/src/lib/routes.ts` | ✅ Modified | Added billing-specific route helpers (`billingNew`, `billingInvoice`, `billingOldGoldNew`) |
| `frontend/src/app/jewellery/inventory/page.tsx` | ✅ Modified | Item master view now wired to real `/api/jwl/v1/items/` API; other sub-views use updated placeholder |
| `frontend/src/app/jewellery/master/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/customers/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/karigar/page.tsx` | ✅ Modified | `?view`-driven sub-feature mapping (Customer order, Metal issue voucher, Receipt, Reconciliation, etc.) with contextual headers/presets |
| `frontend/src/app/jewellery/pledge/page.tsx` | ✅ Modified | Legacy redirect to `/jewellery/gold-pledge` |
| `frontend/src/app/jewellery/accounts/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/gst-reports/page.tsx` | ✅ Modified | Updated subtitle/copy to match SaaS GST report context and reference layout language |
| `frontend/src/app/jewellery/outstanding/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/users-roles/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/multi-branch/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/barcode-rfid/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/notifications/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/mobile/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/gold-pledge/page.tsx` | ✅ Modified | Keeps module title while mapping `?view` sub-features to contextual presets |
| `frontend/src/app/jewellery/reports/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/settings/rates/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/app/jewellery/admin/page.tsx` | ✅ Created | Placeholder screen |
| `frontend/src/features/jewellery/jewellery-api.ts` | ✅ Created | Re-export for feature-level imports |
| `frontend/src/lib/routes.ts` | ✅ Modified | Added jewellery route constants; Notes/Udhaar continue using existing root routes |
| `frontend/src/lib/moduleNav.ts` | ✅ Modified | Added jewellery context/meta; Notes/Udhaar keep existing module menu routes |
| `frontend/src/hooks/useRoleAccess.ts` | ✅ Modified | Added `view:jewellery` permission |
| `frontend/src/components/layout/Sidebar.tsx` | ✅ Modified | In Jewellery routes, sidebar now follows module-first IA (Overview, Modules 1-8, Modules 9-15) with feature-level expand/collapse, nested sub-feature lists, and query-aware active-state matching |
| `frontend/src/components/layout/BottomNav.tsx` | ✅ Modified | Shows jewellery tab without feature-flag hiding |
| `frontend/src/components/layout/MobileNavDrawer.tsx` | ✅ Modified | Mobile drawer mirrors Jewellery module-first feature/sub-feature tree with query-aware active-state matching; keeps previous app-group behavior outside module context |
| `frontend/src/components/layout/AuthBootstrap.tsx` | ✅ Modified | Public-route authenticated redirect now lands regular app users on `/udhaarbook` |
| `frontend/src/features/auth/auth-api.ts` | ✅ Modified | Added `activateModule` mutation used by Modules cards before navigation |
| `frontend/src/store/api.ts` | ✅ Modified | Added `Jewellery` RTK tag type |
| `frontend/src/app/modules/page.tsx` | ✅ Modified | Re-styled as full-width structured SaaS modules screen using shared `Screen` layout; plain cards retained (no status labels/messages) |
| `frontend/src/components/layout/Screen.tsx` | ✅ Modified | Sticky header now uses responsive dynamic top offset so page header aligns correctly when desktop utility header is hidden/shown |
| `frontend/src/components/layout/AppShell.tsx` | ✅ Modified | Desktop utility header auto-hides when unused (no search/notifications), removing unnecessary blank top space |
| `frontend/src/app/globals.css` | ✅ Modified | Updated `.app-container` to wide responsive workspace spacing (reduced unnecessary side whitespace) |
| `frontend/src/app/loans/dashboard/page.tsx` | ✅ Modified | Module switch cards keep Notes/Udhaar on existing routes |
| `frontend/src/app/login/page.tsx` | ✅ Modified | Post-login redirect now defaults regular app users to `/udhaarbook` |
| `frontend/src/components/layout/RouteGuard.tsx` | ✅ Modified | Default role redirect now points regular app users to `/udhaarbook` |
| `frontend/src/app/signup/page.tsx` | ✅ Modified | Post-signup redirect now defaults regular app users to `/udhaarbook` |
| `frontend/src/app/reset-password/page.tsx` | ✅ Modified | Post-reset redirect now defaults regular app users to `/udhaarbook` |
| `frontend/src/app/page.tsx` | ✅ Modified | Landing copy updated for modular SaaS + phased integrations message |
| `frontend/src/components/home/FeatureGrid.tsx` | ✅ Modified | SaaS roadmap language with simplified UI labels (no Core/Add-on badges) |
| `frontend/src/app/onboarding/page.tsx` | ✅ Modified | Onboarding success copy now explains included core apps + future add-ons |
| `frontend/src/app/settings/page.tsx` | ✅ Modified | Added SaaS-style Workspace & Access section with simplified app grouping labels |

---

## §5 — Phase 1: Core Shop Operations

**Estimated effort:** 8–10 weeks  
**Goal:** Jeweller can onboard, manage catalogue, manage stock, create basic bills.

---

### BACKEND TASKS

#### B-1.1 — Django App Bootstrap
**Status:** ✅ Done  
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
- `backend/config/settings/base.py` — add `'apps.jewellery'` to `INSTALLED_APPS`
- `backend/config/urls.py` — add `path('api/jwl/v1/', include('apps.jewellery.urls'))`

**Checklist:**
- [x] App created and registered
- [x] `JewelleryBaseModel` abstract model created (see `02-database-schema.md §Base Model`)
- [x] `JewelleryFeatureGuard` permission class created
- [x] `HasJewelleryPermission(code)` permission class created
- [x] URL namespace `/api/jwl/v1/` registered
- [x] `python manage.py check` passes with no errors

---

#### B-1.2 — Master Data Models (Module 3)
**Status:** ✅ Done  
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
- [x] `Metal`, `Purity` models created (read-only; seeded by management command)
- [x] `Category` model created (self-referencing tree via `parent` FK)
- [x] `Design` model created (`image_urls` JSONField, `bom` JSONField)
- [x] `TaxSlab` model created (with `effective_from`, `effective_to`)
- [x] `NumberSeries` model created (with `prefix`, `next_number`, `padding`)
- [x] Initial migration created and tested
- [x] `seed_jewellery_defaults` command seeds: GOLD/SILVER/PLAT metals, all purities, default tax slabs (3%/5%/18%), default number series
- [x] CRUD ViewSets for Category, Design, TaxSlab, NumberSeries
- [x] GET-only endpoints for Metal, Purity
- [x] All endpoints require `JewelleryFeatureGuard`
- [x] Unit test: category tree returns parent→child correctly
- [x] Unit test: seed command is idempotent (safe to run twice)

---

#### B-1.3 — Item (Inventory) Models (Module 2 — Part)
**Status:** ✅ Done  
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
- [x] `Item` model created with all weight/purity fields and `status` choices
- [x] `StockMovement` model created (reference_type + reference_id generic FK pattern)
- [x] `StockTake` + `StockTakeLine` models created
- [x] `Transfer` + `TransferLine` models created (5-stage status)
- [x] Migrations created and tested (0002_inventory.py)
- [x] `ItemViewSet`: list (with filters: branch, design, status, purity), create, retrieve, update
- [x] `POST /items/{id}/write-off/` — sets status=WRITTEN_OFF, records StockMovement
- [x] `GET /items/scan/{code}/` — resolves barcode/QR/HUID to item detail
- [x] `POST /stock-takes/` + update lines + complete endpoints
- [x] Transfer CRUD + approve/dispatch/receive/reject actions
- [x] Unit test: write-off creates StockMovement with type WRITE_OFF
- [x] Unit test: scan endpoint resolves by barcode, sku, and huid
- [x] Unit test: tenant A cannot see tenant B items (isolation)

---

#### B-1.4 — MCX Rate Service (Module 12)
**Status:** ✅ Done  
**Depends on:** B-1.2  
**Files created:**
```
backend/apps/jewellery/models/rates.py
backend/apps/jewellery/serializers/rates.py
backend/apps/jewellery/views/rates.py
backend/apps/jewellery/services/rates.py    ← gold rate derivation formula
backend/apps/jewellery/migrations/0003_rates.py
backend/apps/jewellery/tests/test_rates.py
frontend/src/components/jewellery/shared/RateTicker.tsx
frontend/src/components/jewellery/shared/InfiniteTable.tsx
frontend/src/components/jewellery/shared/StatusBadge.tsx
frontend/src/components/jewellery/shared/WeightInput.tsx
```
**Models:** `RateHistory`, `TenantRate`

**Checklist:**
- [x] `RateHistory` model created (index on `metal, purity, ts`)
- [x] `TenantRate` model created (`buy_rate`, `sell_rate`, `override_reason`)
- [x] `GET /rates/live/` — returns latest rate per metal/purity with `is_stale` flag
- [x] `GET /rates/history/` — filterable by metal, purity, date range
- [x] `POST /rates/override/` — Admin only; records to TenantRate + audit log
- [x] `calculate_gold_rate(mcx_rate, purity_pct, markup_pct)` in `services/rates.py`
- [x] Unit test: formula matches master spec example (MCX 68500, 22K, 1.5% markup → ₹6,373)
- [x] Phase 1: rate is manually entered; no external API call (Phase 2 concern)
- [x] Frontend: `RateTicker` polls `/rates/live/` every 60s; amber dot on stale (>5min)
- [x] Frontend: `InfiniteTable<T>` with IntersectionObserver on-scroll pagination
- [x] Frontend: `StatusBadge` maps item status to Badge variant
- [x] Frontend: `WeightInput` wraps Input with 4dp validation + gram unit
- [x] Frontend: Inventory page refactored to use InfiniteTable + StatusBadge
- [x] Frontend: RateTicker wired into jewellery layout (shows on all module screens)

---

#### B-1.5 — Billing Service (Module 1 — Core)
**Status:** ✅ Done  
**Depends on:** B-1.3, B-1.4  
**Files created:**
```
backend/apps/jewellery/models/billing.py
backend/apps/jewellery/serializers/billing.py
backend/apps/jewellery/views/billing.py
backend/apps/jewellery/services/billing.py    ← ALL invoice formulas here
backend/apps/jewellery/services/number_series.py
backend/apps/jewellery/migrations/0004_billing.py
backend/apps/jewellery/tests/test_billing.py
```
**Models:** `Customer`, `SalesInvoice`, `SalesInvoiceLine`, `SalesInvoicePayment`, `OldGoldPurchase`

**Formula implementations completed** (from `DigiKhaato-Jewellery-ERP-COMPLETE.md §7`):
- `7.2` — Making charge (3 modes: PER_GRAM, PCT_METAL, PER_PIECE)
- `7.3` — Wastage amount
- `7.5` — Hallmarking fee (flat + 18% GST)
- `7.6` — Line subtotal + GST split (CGST/SGST/IGST)
- `7.7` — Bill-level discount + round-off
- `7.8` — Old gold exchange deduction

**Checklist:**
- [x] All billing models created with migrations (0004_billing.py)
- [x] `calculate_invoice()` service function: takes lines + discount → returns all computed fields
- [x] `POST /sales/calculate/` — stateless preview endpoint
- [x] `POST /sales/invoices/` — creates DRAFT invoice
- [x] `POST /sales/invoices/{id}/issue/` — atomically: assigns voucher_no (number series, locked), updates item status → SOLD
- [x] `POST /sales/invoices/{id}/cancel/` — reverses item to IN_STOCK, records reason
- [x] Estimate type: creates invoice with `invoice_type=ESTIMATE`; no stock movement on issue
- [x] Old gold: inline on invoice creation; deduction calculated via `calc_old_gold_deduction`
- [x] Number series: `get_next_number(tenant, branch, voucher_type)` uses `select_for_update()`
- [x] Unit test: intra-state GST: CGST 1.5% + SGST 1.5% (not 3% IGST)
- [x] Unit test: inter-state GST: IGST 3% (not CGST/SGST)
- [x] Unit test: discount allocated proportionally per line
- [x] Unit test: issuing invoice sets item status → SOLD
- [x] Unit test: cannot issue invoice for item with status ≠ IN_STOCK
- [x] Frontend: all billing TypeScript interfaces + RTK hooks in `store/jewellery-api.ts`
- [x] USER-GUIDE.md rewritten in plain English for sales staff (step-by-step with examples)
- [ ] `GET /sales/invoices/{id}/pdf/` — PDF generation (WeasyPrint/ReportLab) — Phase 1.5 enhancement

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
**Status:** ✅ Done  
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
- [x] `/jewellery` route tree created in Next.js app router
- [x] `jewelleryApi` RTK slice created (base URL `/api/jwl/v1/`)
- [x] Initial feature-flag guard was implemented in F-1.1; later UX pass removed frontend hard-redirect to allow module self-start flow
- [x] Sidebar: jewellery section with all 15 sub-module nav items (collapsed by default)
- [x] Sidebar nav matches structure from `digikhaato_jewellery_sidebar.html`
- [x] Module card on `/modules` page shows Jewellery ERP (gold icon; currently shown as plain selectable card)
- [x] Dashboard page renders 4 KPI cards (stubs with loading state)
- [x] Mobile bottom nav: jewellery module entry

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
**Status:** ✅ Done (partial — core ticker + endpoints done; override form + rate history chart pending)  
**Depends on:** F-1.1, B-1.4  
**Files created:**
```
frontend/src/components/jewellery/shared/RateTicker.tsx
frontend/src/components/jewellery/shared/InfiniteTable.tsx
frontend/src/components/jewellery/shared/StatusBadge.tsx
frontend/src/components/jewellery/shared/WeightInput.tsx
```
**Checklist:**
- [x] `RateTicker` component: shows all metal/purity rates, green/amber stale dot, last-updated tooltip
- [x] Auto-refresh every 60 seconds via RTK Query `pollingInterval`
- [x] Stale flag turns ticker amber after 5 minutes without update
- [x] `RateTicker` placed in jewellery layout so it shows on all billing screens
- [x] Rate RTK endpoints: `getLiveRates`, `getRateHistory`, `overrideRate` in `store/jewellery-api.ts`
- [ ] Rate override form: metal, purity, buy/sell rate, reason (Admin only) — B-1.5 pre-requisite, build with billing UI
- [ ] Rate history mini-chart — Phase 2 enhancement

---

#### F-1.5 — Billing UI
**Status:** 🔄 In Progress  
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
- [x] `formulas.ts`: TypeScript implementations of formulas 7.1–7.8 (see master spec)
- [x] Invoice creation page: customer search autocomplete, invoice type toggle
- [x] Line item row: item scan/search, metal/purity auto-fill, weight fields, rate auto-fill from MCX
- [x] Line-level computed preview: metal value, making ₹, wastage ₹, GST, line total (real-time)
- [x] Bill summary panel: taxable, CGST/SGST/IGST, round-off, total payable
- [x] `POST /calculate/` called on every line change (debounced 300ms)
- [x] Payment split table: add rows for Cash/UPI/Card/Bank/Advance
- [x] Old gold section: purity input, weight, auto-computed deduction
- [ ] Save Draft → Issue Invoice → Print PDF flow (draft + issue done, print/pdf pending)
- [x] Cancel invoice: Manager+ role gate, confirm dialog, reason input
- [ ] Invoice list: filter by date range, status, customer; sort by date (customer filter pending)
- [ ] Invoice detail: all line items, payment breakdown, print/share buttons (print/share pending)

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
