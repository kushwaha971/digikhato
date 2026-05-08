# Partially Wired Features - QA Test Cases

Date: 2026-05-08

## Coverage Scope
Focused on remaining partially wired behaviors after initial phase rollout.

## Test Case Set (Pending/Extended)
Total defined in this set: 29

### Feature 1 - Invoice Item Search
- F1-POS-01: Debounce/min chars behavior (1-char no request, 2+ chars request)
- F1-POS-02: Item select auto-fill includes HUID/HSN/weights/rate
- F1-NEG-01: Credit note search only SOLD status
- F1-EDGE-01: Barcode burst uses scan endpoint path
- F1-EDGE-02: Duplicate item warning appears and allows continue
- F1-REG-01: Rate overridden indicator appears after manual edit
- F1-REG-02: Missing live rate shows manual-entry warning

### Feature 2 - E-Invoice Compliance
- F2-POS-01: Disclaimer + checkbox required before generate
- F2-POS-02: Simulated badge/banner rendering after generation
- F2-NEG-01: B2C invoice does not offer generate action
- F2-NEG-02: einvoice_applicable=false suppresses generation
- F2-NEG-03: Zero-value invoice rejected for IRN generation
- F2-EDGE-01: Repeat generate call is idempotent
- F2-REG-01: Invoice detail banner for pending/simulated IRN

### Feature 3 - Outstanding / Party Ledger
- F3-POS-01: Filter matrix (`ageing`,`customer`,`branch`,`include_zero`)
- F3-POS-02: Drill-down shows latest 50 movements
- F3-POS-03: CSV export generates valid file with required columns
- F3-NEG-01: Notes min-length enforced server-side
- F3-NEG-02: Non-manual movement type rejected on adjust API
- F3-REG-01: Admin/manager adjust permission behavior

### Feature 4 - Karigar Edit + Detail
- F4-POS-01: Edit drawer prefill and save
- F4-POS-02: Performance summary fields visible on card/drawer
- F4-POS-03: Active-only list filtering behavior
- F4-NEG-01: PAN/mobile validation on update
- F4-EDGE-01: Inactivate with open issues shows warning confirmation

### Feature 5 - Purity + HUID
- F5-POS-01: HUID validation normalization
- F5-POS-02: Purity summary totals consistency
- F5-POS-03: Invoice line HUID propagation and PDF line rendering
- F5-NEG-01: Duplicate HUID blocked in tenant
- F5-REG-01: Hallmark status filter results consistency

## QA Execution Checklist
- Verify tenant isolation on all new/updated endpoints.
- Verify role gates for adjust/compliance actions.
- Verify mobile view for drawers, warnings, and action buttons.
- Verify warning copy is explicit and non-ambiguous for compliance.
- Verify all money/weight fields preserve decimal precision.

## Summary Template
- Executed:
- Passed:
- Failed:
- Blocked:
- Not Run:
- Critical defects:
- Recommendation:
