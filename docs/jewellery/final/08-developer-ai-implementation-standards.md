# DK-JWL-FINAL-08 — Developer & AI Implementation Standards (Reuse, No-Duplication, Governance)

**Version:** 1.0  
**Date:** 2026-05-16  
**Owner:** Agent-3 (Senior Architect / SaaS Governance)  
**Status:** Mandatory engineering standard for Phase-1/2 baseline

---

## 1. Purpose

This standard defines implementation rules for human developers and AI agents to ensure:
- zero avoidable duplication,
- reusable component-first development,
- consistent folder/API/state patterns,
- secure and auditable delivery,
- governance-aligned code changes.

These rules are mandatory for all Jewellery module changes.

---

## 2. Foundational Engineering Rules

1. **Reuse-first rule:** extend existing modules/services/components before creating new ones.
2. **No-duplication rule:** do not duplicate domain logic, API clients, validators, constants, or state selectors.
3. **Single source of truth rule:** one canonical implementation for each business rule.
4. **Governed change rule:** any new capability must include permission, audit, and activity tracking impact analysis.
5. **Metadata UI-first rule:** routine **Jewellery module** metadata updates must be done via Admin Form Settings card-based CRUD (Brandhub-style), not recurring script edits.

---

## 3. Reusable Component Standards (Frontend)

### 3.1 Mandatory Component Hierarchy

- `modules/jewellery/components/shared/` for reusable primitives and cross-feature widgets.
- Feature folders (`billing/`, `inventory/`, `karigar/`, etc.) may contain feature-specific composition, not duplicated primitives.

### 3.2 Component Reuse Policy

Before creating a new component, teams must check:
1. existing `shared` component,
2. existing feature component adaptable by props,
3. design token/variant expansion option.

New component creation is allowed only when reuse paths are exhausted and documented in PR notes.

### 3.3 UI Duplication Prohibitions

Prohibited patterns:
- multiple table wrappers with identical behavior,
- repeated form field validation UI logic,
- copied modal shell logic,
- repeated permission-guard rendering snippets.

Required pattern:
- central `PermissionGuard`,
- central `FormField` and validation error display,
- central `DataTable` behavior contract,
- central modal and drawer shells.

---

## 4. Backend Reuse and Domain-Service Standards

### 4.1 Service Layer Policy

Business rules must live in service modules under `backend/apps/jewellery/services/` and not be copied inside views/serializers.

### 4.2 Domain Logic Canonicalization

Each business formula must have one canonical function. Any second implementation is a blocker defect.

### 4.3 Shared Mixins and Query Guards

Use shared mixins/utilities for:
- tenant/branch query scoping,
- soft-delete handling,
- audit metadata attachment,
- pagination/filter conventions.

### 4.4 Metadata Mutation Policy

- Allowed:
  - migrations/seeds for baseline bootstrap,
  - controlled emergency backfill scripts with approval + audit note.
- Required for normal operations:
  - Admin Form Settings card-based CRUD endpoints + UI path for Jewellery module settings.
- Disallowed:
  - manual recurring script edits for routine metadata maintenance.

---

## 5. Folder and Module Conventions

### 5.1 Frontend Folder Contract

`frontend/src/modules/jewellery/`
- `components/` reusable and feature UI,
- `pages/` route containers only,
- `store/` RTK slices and API,
- `hooks/` reusable domain hooks,
- `types/` canonical interfaces/types,
- `utils/` pure utility functions only.

Rules:
- no API calls directly inside presentational components,
- no cross-feature imports bypassing public index files,
- no circular imports across feature folders.

### 5.2 Backend Folder Contract

`backend/apps/jewellery/`
- `models/` entity definitions,
- `serializers/` transport validation/shape,
- `views/` orchestration only,
- `services/` business logic,
- `tasks.py` async jobs,
- `permissions.py` centralized permission checks.

Rules:
- no business math in views,
- no permission bypass in custom actions,
- no direct model mutation outside governed service path for critical flows.

---

## 6. API Standards (No Duplication, Stable Contracts)

1. Use `/api/jwl/v1/` namespace only.
2. No duplicate endpoint behavior under different routes.
3. Request/response contracts must be typed and versioned.
4. Shared error envelope required across endpoints.
5. Permission code and branch scope must be validated before domain execution.
6. Breaking API changes require version bump or compatibility adapter.

---

## 7. State Management Standards (RTK/Redux)

1. One API slice per bounded context; avoid repeated endpoint registration.
2. Derived selectors must be centralized and reused.
3. Do not duplicate local state when server state already exists in cache.
4. Permission/plan-state gating must be computed in shared selectors/hooks.
5. Feature flags and entitlements must flow from canonical auth/session state.

---

## 8. Security and Audit Standards for Implementation

Every change touching admin, billing, accounts, pledge, or permissions must include:
- permission check placement,
- audit event emission path,
- activity tracking event ID mapping,
- negative test for unauthorized action.

No merge without these controls.

---

## 9. AI Agent Coding Contract

AI agents must:
- edit only assigned files,
- avoid refactors outside declared scope,
- search for reusable code paths before writing new code,
- avoid copy-paste generation of near-identical files/functions,
- include concise rationale in PR/commit notes for any new abstraction.

AI agents must not:
- introduce alternative business-rule implementations,
- bypass lint/test/security checks,
- create hidden configuration paths or undocumented flags.

---

## 10. Review and PR Gate Checklist

A change is review-ready only if all are true:

1. Reuse check performed and documented.
2. No duplicate business logic introduced.
3. Folder/API/state conventions followed.
4. Permission and scope validation covered.
5. Audit and activity events mapped and tested.
6. Contract tests updated for changed APIs/selectors.
7. Migration/backfill plan included if data model changed.

---

## 11. Tooling Requirements (Recommended Minimum)

- Duplicate code detector in CI (`jscpd` or equivalent).
- Import boundary linting for module isolation.
- API schema contract validation in CI.
- Permission coverage tests for sensitive endpoints.
- Static check to prevent direct DB access bypass in forbidden layers.

---

## 12. Missing Capabilities Before Full Completion

Required closures before full enterprise completion claim:

1. Automated duplication threshold gate in CI with fail-on-regression policy.
2. Canonical architecture decision records (ADR) for all major domain workflows.
3. Shared component catalog with ownership and deprecation lifecycle.
4. Machine-checked folder boundary rules (frontend and backend).
5. End-to-end permission matrix tests generated from a single source catalog.
6. AI-agent change policy enforcement (scope guard + forbidden file protections).
7. Mandatory traceability link from requirement -> API -> permission -> audit event.
8. Centralized coding-standard lint pack consumed by all contributors.

Until these are done, status remains: **Phase-1/2 implementation standards baseline present, full governance maturity pending**.
