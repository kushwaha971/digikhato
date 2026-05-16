# Jewellery ERP — Phase 1 & Phase 2 Functional Requirements and Feature Flows

**Document owner:** Agent-2 (Senior BA + Shopkeeper perspective)  
**Baseline:** `docs/jewellery/AGENT-HANDOFF.md` (Last Updated: 2026-05-11)  
**Scope:** Functional requirements for current production behavior and explicit pre-Phase-3 pending boundaries.

## 1. Scope and Control
- This document is authoritative for what is considered delivered in **Phase 1 + Phase 2**.
- Any item marked `Pending (Phase 3+)` is out of current operational commitment.
- MVP infra guardrail remains active: PostgreSQL-backed in-app workflows first; external paid integrations deferred unless already approved.

## 2. Actor Model
- **Shopkeeper/Staff**: Creates invoices, manages item lookup, captures payments, handles customer-facing actions.
- **Branch Manager**: Performs approvals/cancellations/dispatch controls, validates branch-level exceptions.
- **Tenant Admin**: Owns module access governance, role assignment, feature controls, lock policy.
- **Super-Admin**: Platform oversight and unrestricted access path.

## 3. Requirement Matrix (Pre-Phase-3)

| Req ID | Area | Requirement | Status |
|---|---|---|---|
| FR-ACC-01 | Module Access | Users with zero module access must be redirected to a dedicated module-access journey. | Implemented |
| FR-ACC-02 | Module Access | Module access page must expose request/self-onboard actions by policy. | Implemented |
| FR-ACC-03 | Approvals | Tenant admins must grant/revoke Jewellery roles through team-role governance. | Implemented |
| FR-ACC-04 | Navigation | Multi-module users must switch module from desktop and mobile navigation. | Implemented |
| FR-MST-01 | Masters | Master entities must support tenant-scoped management for billing/inventory dependencies. | Implemented |
| FR-RATE-01 | Rates | Live rate read and authorized override must be available. | Implemented |
| FR-INV-01 | Inventory | Item list/detail/filter/scan flows must support saleable stock lookup. | Implemented |
| FR-INV-02 | Inventory | Write-off and stock-take lifecycle must be permission controlled and auditable. | Implemented |
| FR-BIL-01 | Billing | Draft create, issue, cancel, credit-note, estimate conversion must be supported. | Implemented |
| FR-BIL-02 | Billing | Print/download/share/send invoice artifacts must be available. | Implemented |
| FR-BIL-03 | Billing | E-invoice generation must persist IRN/QR with deterministic fallback mode. | Implemented (fallback mode) |
| FR-OUT-01 | Outstanding | Outstanding summary and paginated movement history must be available. | Implemented |
| FR-TRF-01 | Transfers | Inter-branch transfer workflow must support request→approve→dispatch→receive/reject with guards. | Implemented |
| FR-RPT-01 | Reports | GST GSTR-1/GSTR-3B preview and sales register reporting must be available. | Implemented |
| FR-ACCNT-01 | Accounts | COA, voucher create/post, trial balance must be available. | Implemented |
| FR-ROL-01 | Team Roles | Users & Roles view must support safe revoke and role visibility. | Implemented |
| FR-ADM-01 | Admin Controls | Feature flags, lock-period enforcement, and trash restore must be active. | Implemented |
| FR-ADM-02 | Admin Form Settings | Admin must manage **Jewellery module metadata** via **card-based Form Settings CRUD UI** (Brandhub-style), not script-only operations. | Pending (Must close before 100%) |
| FR-NOT-01 | Notifications | In-app notification list + manual refresh must be operational. | Implemented |
| FR-DSH-01 | Dashboard | Dashboard/report expectations must be met via module dashboard + report hubs. | Implemented (limited dashboard) |
| FR-KJG-01 | Karigar Job Cards | Full job-card lifecycle with stock issue/return must exist. | Pending (Phase 3+) |
| FR-GLD-01 | Gold Pledge Lifecycle | Full loan disburse/accrual/repay/close/forfeit lifecycle must exist. | Pending (Phase 3+) |
| FR-EINV-01 | GSTN Signed IRN | Real GSP/GSTN signed IRN integration must replace fallback-only mode. | Pending (Phase 3+) |
| FR-NOT-02 | External Automation | WhatsApp/SMS/Email automated delivery with status tracking. | Pending (Phase 3+) |
| FR-RFID-01 | Tag Printing | Barcode/RFID print and reconciliation workflow. | Pending (Phase 3+) |

## 4. Tenant Onboarding and Admin Approval Flow

### 4.1 Primary Journey: User Has No Module Access
1. User logs in successfully.
2. System checks `accessible_modules` from auth profile context.
3. If empty and user is not exempt role, user is redirected to `/module-access`.
4. User sees module cards with action type controlled by `module_access_policy`.
5. User either requests access or self-onboards per policy.
6. Tenant admin reviews and grants role using team-role management API/UI.
7. On refresh/login, module appears in switcher; user can enter Jewellery routes.

### 4.2 Tenant Admin Approval Responsibilities
- Validate user identity and branch mapping before role grant.
- Assign role code based on least-privilege model.
- Revoke access with confirmation when role is no longer valid.
- Ensure no cross-tenant assignment is performed.

### 4.3 Super-Admin Behavior
- Super-admin is not blocked by zero-access module guard intended for standard users.
- Super-admin can inspect module behavior for support/governance scenarios.

## 5. Functional Feature Flows

### 5.1 Billing Flow (Shopkeeper/Staff + Manager)
1. Staff creates draft invoice with customer, item lines, old-gold and payment details.
2. System calculates pricing/tax summary via billing calculation service.
3. Staff validates totals and saves/updates draft.
4. Issue action finalizes invoice.
5. System posts stock/outstanding movements per issue rules.
6. Manager may cancel issued invoice when correction is required.
7. System performs reversal-consistent handling for cancelled/return scenarios.
8. Optional actions: PDF print/download, send/share payload, e-invoice generation.

**Controls**
- Draft lifecycle is non-final until issue.
- Credit note creation requires legal `reference_invoice`.
- Estimate conversion creates invoice draft; posting occurs only when issued.

### 5.2 Inventory and Scan Flow
1. Staff opens inventory list and applies branch/category/status filters.
2. Staff scans or searches barcode/HUID/SKU.
3. System returns item detail and current status.
4. Item is used in billing only when status rules permit.
5. Write-off and stock-take actions remain permission protected.

### 5.3 Inter-Branch Transfer Flow (Branch Manager Perspective)
1. Source branch raises transfer request with destination branch and item lines.
2. Approval action confirms transfer intent.
3. Dispatch validates source/destination separation, item state, tenant scope, and line validity.
4. Destination branch receives items and updates transfer lifecycle state.
5. Reject path is available for invalid/non-receivable consignments.
6. Multi-branch page shows status summaries and filter-driven list visibility.

### 5.4 Outstanding and Collections Flow
1. Team opens outstanding list/snapshot context from customer or outstanding module.
2. User checks current balances.
3. User enters detail movement timeline for a party.
4. Latest movements load first; user fetches older pages using `Load more movements`.
5. Manager uses this trail for collection and audit checks.

### 5.5 Accounts and Reconciliation Flow
1. Accountant/manager opens COA tab for hierarchy visibility.
2. Creates voucher entries for required accounting events.
3. Posts voucher to lock journal impact.
4. Reviews trial balance totals for debit-credit consistency.

### 5.6 GST and Report Consumption Flow
1. Manager navigates to reports hub.
2. Selects GSTR-1 or GSTR-3B path using filing cards.
3. Enters period (`YYYYMM`) and optional sections (for GSTR-1).
4. System returns computed summary and detail rows.
5. Export allowed only for authorized roles.
6. Sales register is loaded using date-range controls in reports hub.

### 5.7 Users & Roles Administration Flow
1. Tenant admin opens Jewellery users/roles page.
2. Reviews current assignments and branch/role profile.
3. Grants new role via team-role creation flow.
4. Revokes old role through explicit confirmation dialog.
5. System updates view without cross-tenant leakage.

### 5.8 Notifications and Automation Behavior
1. User opens `/jewellery/notifications`.
2. User manually clicks refresh.
3. System fetches latest PostgreSQL-backed in-app alerts.
4. User opens notification and navigates to linked workflow.

**MVP automation boundary**
- Implemented: in-app record generation + refresh/read behaviors.
- Not implemented: external delivery channels (SMS/WhatsApp/email), webhook delivery statuses.

### 5.9 Admin Form Settings Metadata Flow (Brandhub-style)
1. Tenant admin opens **Admin → Form Settings**.
2. UI renders metadata cards grouped by jewellery feature/sub-feature.
3. Admin selects a card and performs CRUD on metadata definitions (labels, required flags, default values, field visibility, help text, option lists).
4. System validates payload and permission scope, then saves metadata with audit log.
5. Dependent forms read latest metadata and render updated behavior without script edits.

**Control rule**
- Script-based metadata changes are fallback-only for bootstrap, migration, or emergency repair; day-to-day jewellery metadata operations must use card-based admin CRUD.

## 6. Dashboard and Reporting Expectations

### 6.1 Current Expected Behavior (Implemented)
- Jewellery module dashboard shell exists (KPI stub-level visibility).
- Operational insight is delivered through specialized pages:
  - Reports hub (GST cards + Sales Register table).
  - Multi-branch summary cards + status filters.
  - Accounts trial balance.
  - Billing list/detail operational indicators.

### 6.2 Non-Goals Before Phase 3
- Advanced branch comparison analytics and richer owner dashboards are not release blockers for Phase 1/2 closure.

## 7. Implemented vs Pending Summary (Before Phase 3)

### 7.1 Implemented and Release-Ready
- Module access onboarding + role-governed approval.
- Masters, inventory, billing lifecycle, outstanding history pagination.
- Inter-branch workflow with validation hardening.
- Reports (GSTR-1/GSTR-3B + Sales Register).
- Accounts (COA, vouchers, trial balance).
- Users/roles hardening, admin controls, in-app notifications.
- Barcode/RFID informational listing UI.

### 7.2 Pending (Phase 3+)
- Karigar job-card lifecycle with stock issue/receipt integration.
- Gold pledge full lending lifecycle.
- Real GSTN/GSP signed IRN integration.
- External message automation channels and delivery tracking.
- Barcode/RFID printing + reconciliation workflows.
- Admin Form Settings metadata card-based CRUD implementation and rollout.

## 8. Operational Readiness Notes
- For business sign-off, treat this document and the user-story document as the production baseline until Phase 3 starts.
- Any QA/UAT checklist for current release must not fail the build for features listed under `Pending (Phase 3+)`.
