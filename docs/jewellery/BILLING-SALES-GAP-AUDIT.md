# Billing & Sales Gap Audit (JWL)

Date: 2026-05-05  
Scope: `frontend/src/app/jewellery/billing/*`, shared JWL UI components, billing backend APIs

## 1) What is currently working

- Invoice list fetch (`GET /api/jwl/v1/sales/invoices/`) with paging and status/date filters.
- Invoice list search (`search`) across customer name/mobile and voucher number.
- New invoice creation (`POST /api/jwl/v1/sales/invoices/`) and issue action (`POST /issue/`).
- Invoice calculation preview (`POST /api/jwl/v1/sales/calculate/`) with debounce.
- Invoice detail fetch and cancel action (`POST /cancel/`).
- Invoice printable PDF endpoint (`GET /api/jwl/v1/sales/invoices/{id}/pdf/`) with UI print/download actions.
- Old-gold rows can be added in invoice creation flow.
- Credit note flow: create (`invoice_type=CREDIT_NOTE`), linked reference invoice, issue stock-return handling.

## 2) Missing / broken / incomplete functionality

### Critical (P0)

- Billing sub-features are not truly implemented end-to-end:
  - `einvoice`, `split-payment` (reconciliation/reporting), `messages` are still placeholder-level.
- No share integrations (WhatsApp/SMS) despite menu entries.
- No e-invoice (IRN/QR) generation flow.

### High (P1)

- Billing hierarchy is unclear for staff:
  - menu shows many entries but most route to placeholders.
- New invoice form is large and dense on mobile; requires progressive disclosure.
- Some actions previously looked “available” while feature was not implemented (misleading UX).
- Invoice list has text search, but no dedicated customer picker filter yet.

### Medium (P2)

- Role gates partly client-side heuristics; should be fully driven by backend module permission map.
- Filter/search layer interactions had overlap issues in some layouts.
- No explicit onboarding guidance inside Billing for first-time cashier flow.

## 3) Sub-feature implementation matrix (current)

- Tax invoice (GST): Partial (list + create + issue + cancel + print/pdf; no share integration).
- Estimate / Quotation: Partial (list filtered by type + create via invoice type).
- Sale return / Credit note: Partial (list + create + issue/cancel stock transitions; no settlement reporting).
- Old gold exchange: Partial (inside invoice flow).
- E-invoice (IRN+QR): Missing.
- Split payment modes: Partial (row entry in form; no settlement workflow/report).
- Print templates: Partial (PDF/print exists; no template management layer).
- WhatsApp / SMS send: Missing.

## 4) Canonical user journey (target)

1. Billing Home
   - Choose: New Tax Invoice / New Estimate / New Credit Note.
2. New Invoice (mobile-first step flow)
   - Step 1: Customer + invoice type + basic details.
   - Step 2: Item lines (scan-first).
   - Step 3: Old gold (optional).
   - Step 4: Payment split.
   - Step 5: Review and issue.
3. Invoice Detail
   - Print/PDF, share, cancel (role-based), audit trail.
4. Post-sale
   - Return/credit note linked to original invoice.

## 5) Immediate remediation plan (fix existing before new)

- Phase A (stabilize current)
  - Fix misleading CTA behavior on placeholder sub-features.
  - Mobile progressive disclosure for New Invoice.
  - Resolve search/filter overlay conflicts.
- Phase B (complete core billing)
  - Share actions (WhatsApp/SMS integration adapters).
  - E-invoice and compliance flows.
- Phase C (close menu gaps)
  - Split payment reconciliation/reporting.

## 6) Notes on handoff accuracy

- Prior handoff “done” markers represented route/shell availability in multiple places, not complete business functionality.
- For Billing & Sales, completion should require operational workflows, not just screens/routes.
