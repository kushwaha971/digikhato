# Partially Wired Features - Execution Report

Date: 2026-05-08
Environment: Docker backend + frontend `http://localhost:3000`
Source specification: `docs/jewellery/PARTIALLY-WIRED-PHASE.md`

## What Was Executed
1. Frontend production build validation.
2. Backend migration for `einvoice_applicable`.
3. Backend targeted + shared API regression tests.
4. Full Playwright suite (`run all`) including JWL, portal, screens, and API specs.
5. Failure triage, fixes, and full re-run.

## Commands
- `npm run build` (frontend)
- `docker compose -f backend/docker-compose.yml exec -T backend python manage.py migrate jewellery`
- `docker compose -f backend/docker-compose.yml exec -T backend python manage.py test apps.common.tests.test_api_end_to_end apps.jewellery.tests.test_outstanding apps.jewellery.tests.test_karigar apps.jewellery.tests.test_billing`
- `npx playwright test -c playwright.docker.config.ts --workers=1`

## Results
### Backend tests
- Total: 62
- Passed: 62
- Failed: 0

### Playwright E2E
- Total scenarios: 27
- Passed: 26
- Failed: 0
- Skipped/Pending: 1 (`TC-JWL-ROADMAP-001..005`, intentionally pending)

## Failed Test Analysis and Fixes Applied
Initial full-suite failures were in legacy `api.spec.ts`, `portal.sanity.spec.ts`, and `screens.spec.ts` due drift from current auth and routing behavior.

### Root causes
- Tests assumed password-based login and password-in-signup.
- Tests assumed older route behavior for borrower/admin redirects.
- Tests used brittle assertions around formatted portal values/dates.
- Loan code generation could collide globally (`LN-001` style) across tenants due global unique constraint.
- Collection code generation could collide in edge cases.
- Shared backend regression tests had outdated assumptions (password policy path, loan code format, detail lookup keys).

### Fixes
- Updated Playwright API/portal/screens specs to current contracts and route behavior.
- Added collision-safe code paths:
  - loan code allocation now uses global max `LN-*` progression.
  - collection code allocation now retries uniqueness before create.
- Updated login/guard redirects for borrower portal consistency:
  - `frontend/src/app/login/page.tsx`
  - `frontend/src/components/layout/RouteGuard.tsx`
  - `frontend/src/components/layout/AuthBootstrap.tsx`
- Removed UUID display from portal account labels in UI:
  - `frontend/src/app/portal/page.tsx`
  - `frontend/src/app/portal/accounts/[id]/page.tsx`
- Updated `apps.common.tests.test_api_end_to_end` to current API behavior.

## Re-run After Fixes
- Playwright full suite: `26 passed`, `1 skipped`, `0 failed`.
- Backend regression bundle: `62 passed`, `0 failed`.

## Implementation/Fix Summary
Completed in this cycle:
- Added branch-level `einvoice_applicable` control with migration and API support.
- Enforced e-invoice generation eligibility in backend (B2B + enabled + non-zero amount).
- Added IRN disclaimer gating flow in e-invoice list view.
- Improved invoice detail compliance banner behavior for pending/simulated IRN.
- Added line-level PDF HUID output and simulated IRN labeling.
- Added outstanding CSV export endpoint and UI action.
- Hardened outstanding adjustment API validation (notes + movement type).
- Added status-aware scan behavior for item scan endpoint.
- Added item-search confidence behaviors: HSN autofill, duplicate warning, rate override note, rate unavailable note.
- Added karigar performance summary fields and inactivation warning confirmation.
- Fixed RTK query param mappings for karigar/order/issue/receipt list filters.
- Fixed borrower redirect and portal access consistency after login.
- Removed user-facing UUID fragments from borrower portal account labels.
- Stabilized legacy E2E and API regression tests to current auth/route contracts.

## Completed vs Pending
### Completed
- Compliance gating for simulated IRN flows.
- Item-search operational safeguards.
- Outstanding export + validation hardening.
- Karigar summary + inactivation warning UX.

### Pending
- Real GSTN IRP integration and signed QR lifecycle.
- Dedicated paginated outstanding movement endpoint.
- HUID sold-history + remediation workflows.

### Blockers
- None for current scope completion.

### Open Questions
- Warning vs blocking policy for missing gold HUID during billing.
- Exact v2 ageing model (last activity vs oldest unpaid invoice line).
- IRP integration strategy and branch-level compliance rollout policy.

## Artifacts
- Playwright report: `frontend/playwright-report/index.html`
- Playwright raw artifacts: `frontend/test-results/`

## Next-Phase Roadmap
1. Real IRP/GSP integration + official e-invoice payload/signature handling.
2. Outstanding movement pagination endpoint and advanced reconciliation analytics.
3. HUID exception resolution flow with invoice linkage and audit trail.
4. Expanded compliance and role-matrix E2E coverage.
