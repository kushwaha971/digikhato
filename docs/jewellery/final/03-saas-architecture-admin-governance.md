# DK-JWL-FINAL-03 — SaaS Architecture & Admin Governance Baseline (Phase 1/2)

**Version:** 1.0  
**Date:** 2026-05-16  
**Owner:** Agent-3 (Senior Architect / SaaS Governance)  
**Status:** Baseline for Phase-1/2 completion review

---

## 1. Purpose

This document defines the enterprise governance baseline for DigiKhaato Jewellery SaaS across Phase 1 and Phase 2:
- multi-tenant architecture and centralized management model,
- tenant onboarding and lifecycle governance,
- branch and organization control boundaries,
- admin governance controls,
- security, audit, and activity tracking requirements.

This is a **control baseline**. Teams must not claim “full completion” unless the mandatory controls and closure criteria in Section 12 are satisfied.

---

## 2. Architecture Governance Model

### 2.1 Control Plane vs Tenant Plane

The platform is governed with logical separation:

1. **Control Plane (centralized management):**
   - tenant provisioning,
   - plan/subscription state,
   - feature flags,
   - identity/role catalogs,
   - global policy and audit controls.

2. **Tenant Plane (business operations):**
   - jewellery domain operations (billing, inventory, karigar, accounts, pledge, reports),
   - branch-scoped workflows,
   - tenant-local configuration.

### 2.2 Required Tenant Isolation Controls

Every domain table must enforce tenant scoping with:
- `tenant_id` (mandatory, non-null),
- branch scoping where applicable (`branch_id` nullable only for tenant-wide records),
- API-level tenant filter enforcement,
- PostgreSQL RLS policies or equivalent isolation barrier,
- index strategy including `(tenant_id, branch_id)` for high-volume tables.

Cross-tenant reads/writes are prohibited by design and by query policy.

---

## 3. Centralized Management Baseline

Centralized management must support these governed entities:
- Tenant/Workspace,
- Organization Profile,
- Branch,
- User,
- Role,
- Permission,
- Feature Flag,
- Plan/Subscription,
- Audit Event,
- Security Incident marker,
- Policy Exceptions register.

Minimum control APIs/services:
- tenant lifecycle service,
- role/permission assignment service,
- branch governance service,
- plan state gatekeeper,
- centralized audit/event ingestion.

---

## 4. Tenant Onboarding & Lifecycle Governance

### 4.1 Onboarding Stages

1. `tenant_requested`
2. `tenant_provisioned`
3. `seed_initialized` (masters, default roles, number series)
4. `admin_verified`
5. `trialing` or `active`
6. `operational`

A tenant is not operational until stage 5 or 6 with valid admin ownership.

### 4.2 Mandatory Onboarding Controls

- Unique tenant slug/ID policy.
- Primary admin identity must be validated.
- Baseline seed pack must run idempotently.
- Default permission bundles must be attached (no manual SQL grants).
- Feature activation must be through control-plane flag change with audit event.

### 4.3 Offboarding / Deactivation Controls

- State transition to suspended/cancelled must be explicit and audited.
- Data retention clock must start at termination state change.
- Reactivation must require privileged admin approval and reason code.

---

## 5. Organization and Branch Governance

### 5.1 Branch Control Rules

- Branch-specific transactions must always carry `branch_id`.
- Tenant-wide roles may act across branches only when explicit scope is `ALL_BRANCHES`.
- Inter-branch operations require dual-state workflow (`requested` -> `approved` -> `completed`).

### 5.2 Branch Admin Boundaries

Branch admins can:
- manage branch users/assignments,
- manage branch number series,
- view branch audit trail.

Branch admins cannot:
- edit tenant-wide security policies,
- manage subscription/plan states,
- change global feature flags,
- purge audit records.

### 5.3 Org-Level Overrides

Tenant-level admin settings override branch defaults only through explicit policy fields; implicit inheritance is disallowed.

---

## 6. Admin Governance Baseline

Admin governance is split into:
- **Tenant Administration:** profile, tax defaults, fiscal settings, feature flags.
- **Security Administration:** roles, permissions, MFA policy, session policy.
- **Operational Administration:** branch controls, number series, lock periods.

Mandatory governance controls:
- four-eyes approval for high-risk actions,
- immutable audit records for admin actions,
- policy-driven lock periods (financial close),
- time-bounded elevated access.
- UI-first metadata governance: admin-maintained form metadata via card-based CRUD (Brandhub-style), with scripts reserved for bootstrap/migration emergency use.

---

## 7. Subscription and Plan Governance (Control View)

Subscription state is a control-plane authority. Tenant runtime access must be gated by current state.

Canonical states:
- `trialing`
- `active`
- `grace_period`
- `past_due`
- `suspended`
- `cancel_scheduled`
- `cancelled`
- `expired`

Each state must define:
- feature entitlements,
- read/write policy,
- admin actions allowed,
- notification behavior,
- downgrade/upgrade path.

Detailed state/permission matrix is defined in Document 04.

---

## 8. Security, Audit, and Activity Tracking

### 8.1 Security Controls

Minimum required controls for Phase-1/2 baseline:
- JWT/session validation with tenant context,
- role + permission checks on all protected APIs,
- sensitive action step-up auth (MFA/2FA),
- encryption for sensitive identity fields,
- IP/device-aware anomaly signal capture.

### 8.2 Audit Controls

Audit events must be:
- append-only,
- tamper-evident (hash chain or equivalent),
- actor-attributed,
- tenant and branch tagged,
- queryable for incident investigations.

Mandatory admin audit fields:
- `event_id`, `timestamp`, `actor_user_id`, `tenant_id`, `branch_id`,
- `action`, `resource_type`, `resource_id`,
- `old_value_hash`, `new_value_hash`,
- `ip`, `user_agent`, `request_id`, `outcome`.

### 8.3 Activity Tracking

Track at least:
- login/logout/session refresh,
- role changes,
- permission grants/revokes,
- plan state changes,
- critical domain actions (invoice cancel, ledger adjustment, disbursal approval),
- export/download actions for sensitive reports.

---

## 9. Phase-1/2 Completion Baseline Criteria

A Phase-1/2 governance baseline is considered complete when all are true:
- multi-tenant isolation controls are enforced in schema + API + policy,
- centralized control-plane admin functions exist for tenant/user/role/plan/audit,
- branch and org access boundaries are implemented and tested,
- subscription state gates are enforced in runtime,
- audit trail exists for all admin/security-sensitive actions,
- activity tracking supports forensic reconstruction for key actions.

---

## 10. Governance RACI (Minimal)

- **Platform Admin:** owns control-plane policies, plan states, feature flags.
- **Tenant Owner:** owns tenant governance decisions and delegates admins.
- **Branch Admin:** manages branch operations within tenant policy.
- **Security Officer (or delegated role):** reviews audit anomalies and approvals.
- **Engineering:** enforces technical controls and evidence collection.

---

## 11. Evidence Required for Completion Claim

Required evidence artifacts:
- tenant isolation test report,
- permission boundary test report,
- subscription state-gating test report,
- audit completeness checklist and sample logs,
- branch scope regression tests,
- change-approval logs for high-risk admin actions.

Claims without evidence are non-compliant.

---

## 12. Missing Capabilities Before Full Completion

The following capabilities must be delivered before claiming **full enterprise completion**:

1. Automated policy-as-code checks for tenant and permission misconfiguration.
2. Full SSO/SAML/OIDC enterprise login option with domain enforcement.
3. SCIM/JIT provisioning for user lifecycle automation.
4. Centralized secrets/key rotation governance with rotation evidence.
5. Formal break-glass access workflow with automatic expiry and alerting.
6. Comprehensive anomaly detection on admin actions (behavioral baselines).
7. Immutable audit archival pipeline with legal-hold support.
8. Tenant-facing compliance exports (SOC2-style access/audit report bundle).
9. Fine-grained data retention policy engine (per entity and jurisdiction).
10. Periodic access recertification workflow (manager attestation + evidence).

Until these are completed and verified, status remains: **Phase-1/2 baseline complete, full enterprise governance incomplete**.
