# JWL E2E Failure Triage Template

Date: 2026-05-07  
Repo: `/Users/akashkushwaha/Projects/money-mgmt`

## 1) Purpose
Use this template to triage and resolve Playwright end-to-end failures for Jewellery (JWL) with consistent classification:
- `TEST_SCRIPT`
- `UI`
- `BACKEND_API`
- `VALIDATION_FORMULA`
- `DATA_SEED`
- `DOCKER_ENV`
- `NOT_IMPLEMENTED_PENDING`

This is designed for live local execution with Docker + browser.

## 2) Repo-Specific Brittle Spots (Observed)

1. Auth contract drift likely to break old tests.
- Frontend login currently submits only `mobile_number` (no password field): `frontend/src/app/login/page.tsx`.
- Backend login serializer removed password field: `backend/apps/users/serializers.py` (`MobileTokenObtainSerializer`).
- Existing Playwright specs still use password for signup/login and selectors like `#password`: `frontend/tests/e2e/screens.spec.ts`, `frontend/tests/e2e/portal.sanity.spec.ts`, `frontend/tests/e2e/api.spec.ts`.

2. Redirect contract drift likely to break route assertions.
- Non-super-admin default redirect goes to UdhaarBook root: `frontend/src/app/login/page.tsx`, `frontend/src/lib/routes.ts`.
- Existing tests assert `/dashboard` in multiple places.

3. JWL feature gating + role gating can cause false-failures if setup is incomplete.
- Route/module access guard: `frontend/src/components/layout/RouteGuard.tsx`.
- JWL endpoints require enabled feature + module role permissions: `backend/apps/jewellery/permissions.py`.

4. Data seed dependency for master/rates/billing flows.
- JWL defaults are seeded by command: `backend/apps/jewellery/management/commands/seed_jewellery_defaults.py`.
- Local docker entrypoint does not auto-seed JWL defaults: `backend/entrypoint.sh`.

5. Placeholder pages are present and must not be treated as regressions.
- Multiple JWL routes intentionally render `ModulePlaceholder`: `frontend/src/components/jewellery/shared/ModulePlaceholder.tsx` and pages under `frontend/src/app/jewellery/*`.

6. Selector fragility in JWL.
- JWL screens currently have little/no `data-testid` usage in `frontend/src/components/jewellery` and `frontend/src/app/jewellery`.
- Text/heading based selectors can break with copy/UI changes.

7. Environment/run-mode drift risk.
- Playwright local config uses `3100` with internal webServer: `frontend/playwright.config.ts`.
- Docker config uses `3000` without webServer: `frontend/playwright.docker.config.ts`.
- Backend exposed on `8001` via compose mapping: `backend/docker-compose.yml`.

## 3) Failure Triage Decision Tree

```text
Start
  |
  |-- A. Is failure reproducible with same seed and same command?
  |      |-- No -> classify TEST_SCRIPT (flaky) or DOCKER_ENV (timing/resource)
  |      |-- Yes -> continue
  |
  |-- B. Did test fail before first business action (launch/login/navigation)?
  |      |-- Yes
  |      |   |-- Login/redirect mismatch -> TEST_SCRIPT vs UI/Auth contract drift
  |      |   |-- Service unavailable/timeout -> DOCKER_ENV
  |      |   '-- 401/403 before flow start -> DATA_SEED or BACKEND_API auth setup
  |      '-- No -> continue
  |
  |-- C. Did network show 4xx/5xx for action endpoint?
  |      |-- Yes
  |      |   |-- 400 with field/formula message -> VALIDATION_FORMULA or TEST_SCRIPT payload
  |      |   |-- 401/403 -> DATA_SEED (role/module not provisioned) or BACKEND_API permission bug
  |      |   '-- 5xx -> BACKEND_API
  |      '-- No -> continue
  |
  |-- D. UI state wrong but API success?
  |      |-- Yes -> UI
  |      '-- No -> continue
  |
  |-- E. Feature path is currently placeholder/roadmap only?
  |      |-- Yes -> NOT_IMPLEMENTED_PENDING
  |      '-- No -> TEST_SCRIPT (assertion/selector/data assumptions)
```

## 4) Category Matrix (How to Classify Quickly)

| Category | Primary signals | Quick checks | Owner | Fix strategy |
|---|---|---|---|---|
| `TEST_SCRIPT` | Selector not found, wrong expected URL/text, stale payload contract | Compare spec assumptions vs current UI/API contracts; inspect selector type | QA/Automation | Update selectors to resilient locators, align payloads to current contract, remove stale route assumptions |
| `UI` | API succeeds but rendered totals/buttons/state wrong | Capture screenshot + trace; compare API response to UI widgets | Frontend | Fix rendering/state wiring, stale memoization, wrong mapping |
| `BACKEND_API` | 5xx, incorrect status code, business rule broken server-side | Check backend logs + failing endpoint payload | Backend | Fix serializer/service/view logic, add/adjust tests |
| `VALIDATION_FORMULA` | Amount/GST/old-gold mismatch, validation message mismatch | Compare expected from guide vs `services/billing.py` and frontend formulas | Backend + Frontend | Normalize rounding/precision rules, ensure UI preview matches backend source of truth |
| `DATA_SEED` | Missing masters/rates/customers/roles; 403 for module features | Verify feature flags, module roles, seed commands executed | QA/Setup | Add deterministic setup bootstrap/fixture protocol before run |
| `DOCKER_ENV` | Connection refused, timeout, DB not ready, wrong base URL/port | `docker compose ps/logs`, healthchecks, env vars, port mapping | DevOps/Setup | Fix compose/env/start order; add health wait and preflight checks |
| `NOT_IMPLEMENTED_PENDING` | Route shows placeholder, feature listed as pending roadmap | Confirm with JWL docs and placeholder page | Product + QA | Mark pending, exclude from pass/fail bug count, track separately |

## 5) Preflight Checklist (Run Before Every E2E Cycle)

1. Docker daemon running and healthy.
2. Backend + DB containers up and healthy (`backend/docker-compose.yml`).
3. Frontend run mode chosen and consistent:
- Local Playwright webServer mode: base URL `http://localhost:3100`.
- Docker frontend mode: base URL `http://localhost:3000`.
4. API reachable at `http://localhost:8001/api`.
5. Test account/module provisioning validated:
- User can access JWL module.
- Required role permissions exist.
6. JWL seed defaults present when tests depend on masters/rates/number-series.
7. Browser artifacts enabled (`trace`, `screenshot`, `video`) in Playwright config.
8. Test data uniqueness strategy confirmed (mobile numbers, reference IDs).

## 6) Failure Capture Checklist (Per Failed Test)

Record these for each failure:
- Test name + spec path
- Run command + config file
- Timestamp and environment (`local`/`docker`)
- Screenshot path
- Video path
- Trace path
- Console errors
- Failed network call summary (URL, method, status, response body)
- Backend log excerpt around timestamp
- Category from matrix
- Probable root cause
- Fix owner
- Re-test scope (`single test`/`spec`/`suite`)

## 7) Category-Specific Diagnostic Steps

### A) `TEST_SCRIPT`
1. Verify current UI labels/routes/fields before asserting.
2. Replace brittle selectors with role/label/testid-first strategy.
3. Remove stale auth assumptions (password-driven login).
4. Re-run only failed test with headed + trace.

### B) `UI`
1. Confirm API success and payload correctness.
2. Validate UI computed/derived display vs payload.
3. Check race/loading state and route guard effects.
4. Fix UI; re-run target spec and related specs.

### C) `BACKEND_API`
1. Reproduce failing request via Playwright trace or API client.
2. Inspect backend logs + stack trace.
3. Validate permission/tenant/module role context.
4. Fix backend and run backend tests first, then e2e rerun.

### D) `VALIDATION_FORMULA`
1. Recompute expected values from documented formula.
2. Compare frontend preview (`frontend/src/utils/jewellery/formulas.ts`) vs backend authority (`backend/apps/jewellery/services/billing.py`).
3. Confirm decimal precision/rounding at each step.
4. Update either test expectation or implementation, then rerun affected billing scenarios.

### E) `DATA_SEED`
1. Check tenant feature flags for `jewellery`.
2. Check module roles/permissions for test user.
3. Seed or create required master data (`metals`, `purities`, `tax-slabs`, `number-series`, etc.).
4. Re-run from clean test setup.

### F) `DOCKER_ENV`
1. Confirm containers, ports, and healthchecks.
2. Confirm frontend-to-backend proxy env (`DJANGO_API_URL`, `NEXT_PUBLIC_API_BASE_URL`).
3. Check startup order and readiness (DB first, backend, then frontend/tests).
4. Re-run smoke test before full suite.

### G) `NOT_IMPLEMENTED_PENDING`
1. Confirm route/page is placeholder or roadmap item.
2. Mark as pending in report; do not treat as regression.
3. Link to roadmap/placeholder evidence.

## 8) Rerun Protocol (Strict)

### Step 1: Reproduce
1. Re-run failed test exactly once without changes.
2. If non-reproducible, tag as flaky candidate and run 3 attempts.

### Step 2: Isolate
1. Run single test.
2. Run full spec file.
3. Run minimal impacted group (same feature).

### Step 3: Fix and verify
1. Apply smallest possible fix.
2. Re-run failed test.
3. Re-run impacted spec(s).
4. Re-run full suite (or full JWL subset).

### Step 4: Record before/after
1. Before status: failing count + category.
2. After status: pass/fail + evidence artifact paths.
3. Update open issues list for unresolved/pending items.

## 9) Recommended Rerun Commands

Run from `frontend/`.

```bash
# List tests
npx playwright test --list

# Local webServer mode (3100)
npx playwright test -c playwright.config.ts --headed --workers=1

# Docker frontend mode (3000)
npx playwright test -c playwright.docker.config.ts --headed --workers=1

# Re-run single failed test by name
npx playwright test -c playwright.config.ts --headed --workers=1 -g "<failed test name>"

# Open HTML report
npx playwright show-report playwright-report

# Open trace
npx playwright show-trace test-results/<test-folder>/trace.zip
```

Backend health/log checks:

```bash
cd /Users/akashkushwaha/Projects/money-mgmt/backend
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 db
```

## 10) Failure Report Entry Template

```md
### Failure ID: JWL-E2E-<NNN>
- Test: <name>
- Spec: <path>
- Category: <TEST_SCRIPT|UI|BACKEND_API|VALIDATION_FORMULA|DATA_SEED|DOCKER_ENV|NOT_IMPLEMENTED_PENDING>
- Environment: <local/docker>
- Reproducible: <yes/no>
- Symptom: <what failed>
- Evidence:
  - Screenshot: <path>
  - Video: <path>
  - Trace: <path>
  - Console/Network: <summary>
  - Backend logs: <summary>
- Root cause hypothesis: <1-3 lines>
- Fix applied: <none or change summary>
- Rerun result:
  - Before: <status>
  - After: <status>
- Owner: <QA/Frontend/Backend/DevOps>
- Open/Closed: <status>
```

## 11) Exit Criteria for “Stable to Proceed”

1. No `DOCKER_ENV` blockers in two consecutive runs.
2. No reproducible `TEST_SCRIPT` failures from stale contracts.
3. All `BACKEND_API`/`VALIDATION_FORMULA` critical failures fixed or explicitly waived.
4. `NOT_IMPLEMENTED_PENDING` items separated from true failure metrics.
5. Final report includes artifact links and before/after rerun status.
