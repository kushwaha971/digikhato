# 06 - Agent Playbook (Current + Future)

## Multi-Agent Mode (Recommended for Major Work)
Use full sequence for major features:
1. Product Architect
2. UX/UI Designer
3. System Architect
4. Backend Engineer
5. Frontend Engineer
6. QA / Reviewer

## Mandatory Baseline Reference
Before planning or coding, every agent must read:
- `docs/09-prd-frd-alignment.md`

This defines:
- what is already implemented now
- what is future scope
- what should be partially implemented with future flags

---

## Agent 1 - Product Architect
### Current implementation delivered
- MVP boundary defined and aligned to rural collection workflow.
- Required modules and screens established.

### Future implementation ownership
- Phase-wise expansion plan (MVP v1.1, v1.2).
- Requirements for penalties, reminders, and branch operations.
- Prioritization of offline-first and reconciliation features.

## Agent 2 - UX/UI Designer
### Current implementation delivered
- Mobile-first route layout with bottom navigation.
- Large touch targets and form-first collection flow baseline.

### Future implementation ownership
- Replace ID-based inputs with searchable selectors.
- Improve reports and settings UX from baseline to production polish.
- Add offline sync conflict resolution UI.

## Agent 3 - System Architect
### Current implementation delivered
- Monorepo split (`backend`, `frontend`, `docs`).
- Modular backend apps and feature-based frontend structure.
- Dockerized environment and env-driven config.

### Future implementation ownership
- Add Redis for caching and queue infrastructure.
- Introduce worker architecture (Celery/RQ) and event hooks.
- Define observability stack (logs/metrics/tracing).

## Agent 4 - Backend Engineer
### Current implementation delivered
- Custom user auth (mobile+password), JWT endpoints.
- Borrower/loan/collection APIs with validation and filters.
- Transaction-safe collection correction recalculation.
- Dashboard/report APIs.

### Future implementation ownership
- Refresh-token blacklist and secure logout hardening.
- Rate limiting and abuse controls.
- Scheduled overdue/penalty jobs.
- Audit trail tables and immutable event logs.

## Agent 5 - Frontend Engineer
### Current implementation delivered
- RTK Query + Axios integration.
- Core screens and CRUD/correction flows.
- RHF + Zod validators and reusable components.
- PWA baseline setup.

### Future implementation ownership
- Offline queue + retry sync state machine.
- Advanced global search and filter UX.
- Better list virtualization/pagination UX for scale.
- Improve a11y and localization (multi-language).

## Agent 6 - QA / Reviewer
### Current implementation delivered
- Functional validations through build checks and route/API wiring review.

### Future implementation ownership
- End-to-end test suite (Playwright/Cypress).
- API contract tests.
- Load and mobile network simulation tests.
- Security checklist execution (auth/session/CORS/logging).

---

## Agent Handoff Template
For every major task, each agent should output:
- What was changed
- Why it was changed
- Risks introduced
- Validation completed
- What next agent must do
