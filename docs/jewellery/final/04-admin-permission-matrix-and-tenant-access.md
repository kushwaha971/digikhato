# DK-JWL-FINAL-04 — Admin Permission Matrix & Tenant Access Control (Phase 1/2)

**Version:** 1.0  
**Date:** 2026-05-16  
**Owner:** Agent-3 (Senior Architect / SaaS Governance)  
**Status:** Authoritative baseline for admin and access controls

---

## 1. Scope

This document defines:
- role and permission model for centralized and tenant administration,
- tenant-level and branch-level access rules,
- subscription/plan state access behavior,
- hard deny rules and security/audit obligations.

---

## 2. Access Model

### 2.1 Access Tuple

All runtime authorization must resolve the tuple:
`user_id + tenant_id + module + role + permission + branch_scope + plan_state`

Any missing tuple element must fail closed.

### 2.2 Scope Types

- `TENANT_ALL`: access across all branches in tenant.
- `BRANCH_SET`: access to explicit branch list only.
- `SELF_ONLY`: restricted to self-owned records where applicable.

### 2.3 Enforced Claims/Context

Each request must include validated tenant context and resolved branch context. Branch fallback to tenant-wide access is allowed only when role scope is explicitly `TENANT_ALL`.

---

## 3. Canonical Roles (Governance)

### 3.1 Platform-Level Roles

| Role | Scope | Core Authority |
|---|---|---|
| `platform_super_admin` | Global | Tenant provisioning, plan states, global policy |
| `platform_support_admin` | Scoped global | Operational support with strict audit |
| `platform_security_admin` | Global | Security policy, incident controls, audit governance |

### 3.2 Tenant-Level Roles

| Role | Scope | Core Authority |
|---|---|---|
| `tenant_owner` | Tenant all | Full tenant admin including delegation |
| `tenant_admin` | Tenant all | User/role/branch/admin settings |
| `tenant_auditor` | Tenant all read | Audit and reporting read-only |

### 3.3 Branch-Level Roles

| Role | Scope | Core Authority |
|---|---|---|
| `branch_admin` | Assigned branches | Branch operations and user assignment |
| `branch_manager` | Assigned branches | Operational approvals |
| `cashier` | Assigned branches | Billing/payments within permission set |
| `sales_user` | Assigned branches | Sales/estimate/inventory view-limited |

---

## 4. Permission Matrix (Admin and Governance Actions)

Legend: `A`=Allow, `C`=Conditional allow (approval/MFA/state), `D`=Deny.

| Action | platform_super_admin | platform_security_admin | tenant_owner | tenant_admin | branch_admin | tenant_auditor |
|---|---|---|---|---|---|---|
| Create tenant | A | D | D | D | D | D |
| Activate/deactivate tenant | A | C | D | D | D | D |
| Change subscription plan/state | A | C | D | D | D | D |
| Set global feature flags | A | C | D | D | D | D |
| Set tenant feature flags | C | C | A | A | D | D |
| Manage Form Settings metadata cards (CRUD) | D | C | A | A | C (branch-scoped metadata only) | D |
| Run metadata override scripts (non-bootstrap) | D | C | C (with approval) | D | D | D |
| Invite tenant user | D | D | A | A | C (branch only) | D |
| Assign tenant-wide roles | D | D | A | C | D | D |
| Assign branch roles | D | D | A | A | A (assigned branches only) | D |
| Modify permission bundles | D | C | C | D | D | D |
| Lock/unlock financial period | D | C | A | C | D | D |
| Export full audit logs | C | A | C | D | D | A |
| Purge audit records | D | D | D | D | D | D |
| Raise break-glass access | C | A | C | D | D | D |

---

## 5. Tenant-Level Access Control Rules

1. All data APIs must filter by `tenant_id` at query start.
2. Branch-bound resources must enforce branch scope before action-level permission checks.
3. Soft-deleted records remain tenant-bound and permission-bound.
4. Cross-tenant identifiers in payloads must be rejected.
5. Service accounts must be tenant-scoped and non-human identities must have expiring credentials.

---

## 6. Branch and Org Control Policies

- Branch creation/update requires tenant-admin or above.
- Branch disable action requires reason code and effective timestamp.
- Inter-branch transfers require maker-checker pattern.
- Branch users cannot modify tenant-wide defaults unless explicit delegated capability exists.

---

## 7. Subscription/Plan State Handling Matrix

### 7.1 Canonical States

- `trialing`
- `active`
- `grace_period`
- `past_due`
- `suspended`
- `cancel_scheduled`
- `cancelled`
- `expired`

### 7.2 Runtime Access by State

| Plan State | Login | Read Data | Write Ops | Admin Changes | Notes |
|---|---|---|---|---|---|
| `trialing` | A | A | A | A | Trial feature limits apply |
| `active` | A | A | A | A | Full entitlement |
| `grace_period` | A | A | C | C | Sensitive writes may be restricted |
| `past_due` | A | A | C | C | Billing-critical writes only |
| `suspended` | C | A (limited) | D | C | Recovery actions only |
| `cancel_scheduled` | A | A | C | C | No upgrade/downgrade bypass |
| `cancelled` | C | C | D | C | Read-only with retention policy |
| `expired` | D | C (archive only) | D | D | Access via support exception only |

`C` must be governed by explicit exception policy and audit trail.

---

## 8. Hard Deny Rules (Non-Negotiable)

- No user can grant permissions they do not possess.
- No role can bypass tenant boundary checks.
- No audit event deletion/modification from runtime APIs.
- No subscription bypass flags in tenant plane.
- No hidden superuser behavior without explicit break-glass record.

---

## 9. Security and Audit Requirements for Access Changes

Every identity/access mutation must log:
- actor, target user/role,
- previous state and new state hashes,
- tenant and branch scope,
- reason code,
- approval chain,
- request origin metadata,
- outcome.

Mandatory triggers for additional controls:
- MFA for high-risk role assignment,
- dual approval for permission bundle edits,
- alert to security role on tenant-owner changes.

---

## 10. Activity Tracking Baseline

Track and retain at minimum:
- user invite, accept, disable, enable,
- role assignment and revocation,
- branch-scope changes,
- plan state transitions,
- authentication anomalies,
- policy exceptions.

Retention baseline:
- hot query window: 180 days,
- immutable archival: 7 years or as per compliance policy.

---

## 11. Missing Capabilities Before Full Completion

The following must be completed before full enterprise claim:

1. Row-level policy verifier that continuously scans for tenant/branch policy drift.
2. Just-in-time approval workflow for temporary elevated access.
3. Delegated administration guardrails with policy templates.
4. Automated toxic-permission combination detection.
5. SCIM-based deprovisioning SLA enforcement.
6. Subscription-state simulator tests in CI (all roles x states x critical actions).
7. Centralized exception approval dashboard with expiry enforcement.
8. Machine-readable permission catalog (`permissions.json`) with signed versioning.

Until then: **admin/access baseline is operational for Phase-1/2, but not fully enterprise-complete**.
