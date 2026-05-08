# Partially Wired Features - Updated Requirements and Acceptance Criteria

Date: 2026-05-08
Scope source: `docs/jewellery/PARTIALLY-WIRED-PHASE.md`

## Feature Overview
This update completes the highest-risk remaining behavior gaps in the Partially Wired phase: e-invoice compliance gating, invoice item-search confidence indicators, outstanding CSV export/API validation hardening, and karigar operational warning/summary behavior.

## Business Purpose
- Prevent legal/compliance confusion in IRN generation.
- Reduce billing mistakes during fast counter operations.
- Improve operational clarity for receivables and karigar workflows.
- Preserve tenant-safe, module-safe backend behavior.

## User Workflow (Current Implemented)
1. Billing user searches/scans item and gets auto-fill plus warnings (duplicate line, rate overridden, rate unavailable).
2. E-invoice user can generate IRN only when branch e-invoice is enabled and invoice is B2B tax invoice; flow requires disclaimer acknowledgement.
3. Outstanding user can filter, drill down, post manual adjustments, and export CSV.
4. Karigar user can edit/inactivate with explicit warning if open issues exist and view performance summary metrics.
5. Portal users see human-readable account labels (no UUID fragments in headings/cards).

## Field-Level and Validation Behavior
### Invoice item search
- Auto-fills `hsn_code` from selected item category when available.
- Sets `rate_per_gram` from live rate table when available.
- Shows `Rate unavailable - enter manually` when live rate mapping is missing.
- Shows `Rate overridden` when user changes auto-filled rate.
- Shows non-blocking duplicate warning if same item is selected on more than one line.

### E-invoice compliance
- New setting: `einvoice_applicable` per branch admin control (default `false`).
- IRN generation blocked unless:
  - `invoice_type == TAX_INVOICE`
  - customer GSTIN present
  - `total_amount > 0`
  - `einvoice_applicable == true`
- B2B compliance amber banner shown when IRN is missing or simulated.

### Outstanding
- API default behavior now excludes zero-balance parties unless explicitly requested.
- Manual adjustment API enforces notes (required, min length 5).
- Manual adjustment API restricts movement type to `MANUAL_ADJUSTMENT`.
- CSV export endpoint added.

### Karigar
- Karigar API now returns summary fields:
  - `total_pure_issued`
  - `total_pure_received`
  - `avg_wastage_pct`
  - `open_issues`
- UI shows summary on list and edit drawer.
- Inactivation with open issues shows warning confirmation modal.

### Portal account labels
- Portal account cards/details show `Account #{id}` instead of UUID snippets.

## Status Transitions and UI Behavior
- IRN actions now gated and acknowledged before mutation.
- Invoice detail compliance warning handles both pending and simulated IRN states.
- Barcode scan in item search respects invoice context status (`IN_STOCK` vs `SOLD`).

## Backend/API Behavior
- Added `AdminControl.einvoice_applicable` and migration `0013_admin_einvoice_applicable.py`.
- `/api/jwl/v1/admin/feature-flags/` GET/PATCH now includes `einvoice_applicable`.
- `/api/jwl/v1/outstanding/export/` added for CSV.
- `/api/jwl/v1/items/scan/{code}/` now supports `?status=` and enforces status match.
- `generate_e_invoice` now validates B2B + config + amount before issuing simulated IRN.

## Acceptance Criteria (Implemented)
- AC-01: IRN generation cannot proceed without disclaimer acknowledgement in e-invoice list view.
- AC-02: IRN generation fails for non-B2B, zero-amount, or disabled e-invoice branch.
- AC-03: Item line displays rate override and missing-rate warnings.
- AC-04: Duplicate item selection shows non-blocking warning with source line number.
- AC-05: Outstanding CSV export available from page action.
- AC-06: API rejects manual adjustments with short/blank notes.
- AC-07: Karigar inactivation with open issues prompts warning before save.
- AC-08: Karigar cards/drawer show issued/returned/wastage/open metrics.
- AC-09: Borrower portal does not expose UUID fragments in account labels.

## Known Limitations
- Real IRP/GSP GSTN integration is still future scope; current IRN remains simulated.
- Outstanding movements are still retrieved as top 50 in detail payload (no separate paginated movements endpoint yet).
- HUID sold-history linkage and HUID remediation workflow are not fully productized.

## Open Questions
1. Should movement history get a dedicated paginated endpoint in this phase?
2. Should missing HUID on gold invoice lines be warning-only or hard-block?
3. Should CSV export include ageing by oldest unpaid invoice (v2 ledger model) vs last activity date?

## Next-Phase Plan
1. Real GSTN IRP integration and signed QR workflow.
2. Paginated outstanding movements endpoint + stronger reconciliation views.
3. HUID remediation workflow with invoice linkage for sold items.
4. Expanded role/permission E2E matrix around new compliance and adjustment controls.
