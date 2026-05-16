# Regression Master Plan (Run Only After 100% Module Completion)

## Rule
This regression cycle starts only after all module completion gates are satisfied.

## Entry Criteria
- All functional docs and test docs in `docs/jewellery/final/` finalized.
- All `Pending` items in completion audit resolved or approved deferred.
- Build/test gates green in CI and local docker runs.

## 1) Engineering-Side Regression
Focus: code quality, stability, architecture consistency.
- Backend:
  - full module test suites
  - migration sanity
  - role/tenant security tests
  - formula and ledger consistency checks
- Frontend:
  - unit/integration tests
  - route/access guard tests
  - type/build checks
- E2E:
  - full Playwright run with traces/videos for failures

Deliverables:
- defect list by severity
- root-cause category (test/ui/api/data/env)
- fix + re-run evidence

## 2) BA / Shopkeeper-Side Regression
Focus: business usability and real counter operations.
- Walk all high-frequency workflows:
  - customer to billing to issue to payment to outstanding updates
  - stock lookup, transfer, and reversal scenarios
  - managerial approvals and exception handling
- Validate clarity:
  - labels, warnings, guidance copy
  - no UUID leaks in user-facing UI
  - role-appropriate action visibility

Deliverables:
- user-flow acceptance report
- business mismatch log
- signed acceptance checklist

## 3) QA-Side Regression
Focus: end-to-end traceability and edge coverage.
- Execute full test catalog from:
  - `05-qa-test-cases-phase1-phase2.md`
  - `06-edge-cases-and-negative-scenarios.md`
- Include negative/security/tenant isolation matrix.
- Track: pass/fail/blocked/not-implemented with exact evidence links.

Deliverables:
- final execution report
- open defects and risk register
- go/no-go recommendation

## Exit Criteria
- No critical or high-severity open defects.
- All mandatory flows pass in engineering + BA + QA tracks.
- Stakeholder sign-off recorded.
