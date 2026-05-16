# API and Business Logic Notes (Phase 1 + Phase 2)

## Purpose
Developer-facing API/logic notes for reliable implementation and debugging.

## Contract Principles
- Tenant scoping is mandatory on all list/detail/mutation endpoints.
- Branch context must be explicit for branch-sensitive flows.
- All role checks should be server-authoritative; UI checks are convenience only.
- Enum values must come from shared constants; avoid hardcoded strings in logic.
- Nullable/default behavior should prefer `null`/empty-safe handling over hidden hardcoded fallback values.

## Core API Domains

### 1. Billing
- Draft create, issue, cancel, send, pdf, e-invoice, convert estimate.
- Business rules:
  - cannot issue non-in-stock linked items
  - credit note requires valid reference invoice
  - conversion allowed only for estimate workflow
  - old-gold and split-payment totals must reconcile

### 2. Inventory
- Item CRUD, movement history, purity summary, HUID lookup, transfers.
- Rules:
  - HUID format and uniqueness enforcement
  - transfer transitions with branch/item-state guards
  - stock movement posting must be consistent for audit traces

### 3. Outstanding
- Ageing summary and movement log.
- Manual adjustment requires privileged permission + minimum note quality.

### 4. Rates and Compliance
- Live rates + override workflow.
- E-invoice mode currently supports internal/simulated fallback where signed IRN integration is pending.

### 5. Access and Governance
- Module access (`accessible_modules`) and team-role assignment.
- Admin controls and lock-period enforcement are back-office critical paths.
- Jewellery Form Settings metadata management should be exposed as admin CRUD APIs (card-based UI consumers), not script-only workflows.

## Common Validation Notes
- Mobile, PAN, GSTIN, HUID, decimal precision, and date-window checks should use centralized validators.
- Formula calculations should remain in service layer; avoid duplicating logic in views/components.

## Observability/Audit Notes
- High-risk actions require traceability:
  - invoice cancel/issue
  - rate override
  - write-off
  - role grant/revoke
  - lock-period changes

## Open Technical Gaps Before 100% Completion Claim
- External GSP/GSTN signed IRN integration.
- End-to-end notification automation with delivery webhooks.
- Some advanced cross-module analytics/reporting depth.
- Final consistency audit for movement posting across all paths.
- Form Settings metadata card CRUD API + UI path standardization across Jewellery module forms.
