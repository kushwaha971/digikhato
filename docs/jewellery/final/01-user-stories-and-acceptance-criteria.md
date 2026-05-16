# Jewellery ERP — Phase 1 & Phase 2 User Stories and Acceptance Criteria

**Document owner:** Agent-2 (Senior BA + Shopkeeper perspective)  
**Baseline:** `docs/jewellery/AGENT-HANDOFF.md` (Last Updated: 2026-05-11)  
**Scope:** Production-ready business stories for implemented Phase 1/2 behavior, plus explicit pending items before Phase 3.

## 1. Status Legend (Pre-Phase-3)
- `Implemented`: Available in current system behavior per 2026-05-11 handoff.
- `Pending (Phase 3+)`: Not complete for operational production flow yet; keep out of current release commitment.

## 2. Personas Covered
- **Shopkeeper/Staff**: Counter billing, stock search, customer handling, payment capture.
- **Branch Manager**: Approval actions, transfer control, operational exceptions.
- **Tenant Admin**: Team access setup, feature control, branch-level governance.
- **Super-Admin**: Platform-level override and unrestricted entry paths.

## 3. User Stories and Acceptance Criteria

### A. Tenant Access, Onboarding, and Approval

**US-ACC-01 (`Implemented`)**  
As a user with no module access, I want to land on a dedicated module-access page so I understand what to do next.
- AC1: Authenticated users with zero accessible modules are redirected to `/module-access`.
- AC2: Redirect excludes super-admin/borrower roles as per current route-guard behavior.
- AC3: Page clearly shows no-access state and next actions.

**US-ACC-02 (`Implemented`)**  
As a tenant user, I want module-specific request/self-onboard actions so I can initiate access without manual back-office confusion.
- AC1: `/module-access` shows actions per module using `module_access_policy`.
- AC2: UI supports both “request access” and “self-onboard” where policy allows.
- AC3: Accessible modules banner appears once access exists.

**US-ACC-03 (`Implemented`)**  
As a tenant admin, I want to approve/reject access by assigning module roles so only authorized staff can use Jewellery ERP.
- AC1: Team role assignment is available via module team-role APIs.
- AC2: Cross-tenant role assignment attempts are blocked.
- AC3: Revocation path is available and confirmation-protected in UI.

**US-ACC-04 (`Implemented`)**  
As a multi-module user, I want to switch modules from desktop/mobile navigation so I can move between apps quickly.
- AC1: Module switcher displays only user’s `accessible_modules`.
- AC2: Selected module persists through Redux + local storage.
- AC3: Mobile nav drawer includes module switch section when multiple modules are available.

---

### B. Jewellery Master, Rates, and Setup

**US-MST-01 (`Implemented`)**  
As a tenant admin, I want to maintain master data (categories, designs, tax slabs, number series) so transactional data stays consistent.
- AC1: Master pages exist with CRUD/inline-edit capabilities where implemented.
- AC2: Number series updates are available from settings/master views.
- AC3: Master configuration is tenant scoped.

**US-RATE-01 (`Implemented`)**  
As a manager/admin, I want to view and override live rate so billing uses correct metal rate.
- AC1: Live rate endpoint is consumable in Jewellery UI.
- AC2: Override action is permission-restricted.
- AC3: Rate values apply to bill calculation preview flow.

**US-ADM-05 (`Pending (Must close before 100%)`)**  
As a tenant admin, I want a **Jewellery Form Settings** area with metadata cards (Brandhub-style) so I can add/update jewellery metadata from UI instead of scripts.
- AC1: Admin sees a list/grid of metadata cards for jewellery only (for example: category attributes, invoice field presets, pledge form metadata, branch metadata presets).
- AC2: Each card supports CRUD operations with validation and audit trail.
- AC3: Metadata changes apply to dependent forms without manual script edits.
- AC4: Script-based edits are restricted to migration/bootstrap scenarios only.

---

### C. Inventory and Stock Integrity

**US-INV-01 (`Implemented`)**  
As staff, I want inventory list/filter/search so I can quickly find saleable stock.
- AC1: Inventory list supports key filters and searchable identifiers.
- AC2: Item detail is viewable with status and metadata.
- AC3: Item state is branch/tenant scoped.

**US-INV-02 (`Implemented`)**  
As staff, I want scan-based lookup so counter operations are faster.
- AC1: Item scan endpoint supports barcode/HUID lookup.
- AC2: Scan behavior respects expected status context (e.g., `IN_STOCK` checks in billing context).

**US-INV-03 (`Implemented`)**  
As a manager, I want controlled write-off actions so stock loss is auditable.
- AC1: Write-off is permission-gated.
- AC2: Stock movement trail remains available.

**US-INV-04 (`Implemented`)**  
As staff, I want stock-take create/complete workflow so physical and system stock can be reconciled.
- AC1: Stock-take start endpoint/action exists.
- AC2: Completion action exists with scoped data updates.

**US-RFID-01 (`Implemented with Phase-3 limitation`)**  
As staff, I want barcode/RFID tagged-item visibility so I can verify item tag data.
- AC1: Tagged-items table supports barcode/HUID text search.
- AC2: Page clearly identifies tag-printing as disabled future scope.

---

### D. Billing, Invoicing, and Counter Sales

**US-BIL-01 (`Implemented`)**  
As staff, I want to create draft invoices with calculation preview so I can prepare bills accurately before issue.
- AC1: Draft create supports customer, line items, old gold, and payments.
- AC2: Calculation preview returns tax split and totals.
- AC3: Draft does not post irreversible stock/outstanding movement.

**US-BIL-02 (`Implemented`)**  
As staff, I want to issue an invoice so sale is finalized and financial impact is recorded.
- AC1: Issue action is explicit on invoice workflow.
- AC2: Stock/outstanding posting occurs on issue event.
- AC3: Invoice state changes are visible in list/detail.

**US-BIL-03 (`Implemented`)**  
As a manager, I want controlled cancellation of issued invoices so mistakes can be legally reversed.
- AC1: Cancel endpoint/action exists for issued invoices.
- AC2: Cancellation reverses prior business impact as per billing movement policy.
- AC3: Cancel flow is permission-aware.

**US-BIL-04 (`Implemented`)**  
As staff, I want estimate/quotation flows so I can quote before final sale.
- AC1: Estimate invoice type is supported.
- AC2: Estimate issue does not create stock posting.
- AC3: Estimate can be converted to tax invoice draft.

**US-BIL-05 (`Implemented`)**  
As staff, I want credit-note flow linked to original invoice so returns and reversals remain compliant.
- AC1: Credit note requires valid `reference_invoice`.
- AC2: Invalid or non-issued references are rejected.

**US-BIL-06 (`Implemented`)**  
As staff, I want to print/share/send invoice and download PDF so customer communication is immediate.
- AC1: Invoice PDF endpoint is available.
- AC2: Send/share payload endpoint exists for WA/SMS/email channels (payload mode).
- AC3: UI exposes print/share actions.

**US-BIL-07 (`Implemented with fallback`)**  
As manager/admin, I want e-invoice generation so B2B compliance flow is available in MVP mode.
- AC1: E-invoice action stores IRN/QR fields on invoice.
- AC2: Current mode uses deterministic in-app IRN fallback.
- AC3: Real GSTN/GSP signed IRN integration is marked pending.

**US-BIL-08 (`Implemented`)**  
As staff, I want split payment entry so mixed payment modes can be captured at billing time.
- AC1: Multi-payment capture is available in invoice flow.
- AC2: Balance visibility supports partial collections.

---

### E. Party Outstanding and Collections

**US-OUT-01 (`Implemented`)**  
As staff/manager, I want party outstanding summaries so I can track receivables.
- AC1: Outstanding APIs and UI are available.
- AC2: Customer detail includes outstanding snapshot indicators.

**US-OUT-02 (`Implemented`)**  
As manager, I want paginated outstanding movement history so old entries are retrievable without heavy page load.
- AC1: Movement endpoint supports pagination.
- AC2: UI provides `Load more movements` affordance.
- AC3: Latest-first sequence is maintained.

---

### F. Inter-Branch Operations

**US-TRF-01 (`Implemented`)**  
As branch staff, I want to request stock transfer between branches so branch demand can be fulfilled.
- AC1: Transfer create supports line-item details.
- AC2: Source and destination branch must differ.

**US-TRF-02 (`Implemented`)**  
As a branch manager, I want approve/dispatch/receive/reject controls so transfer accountability is maintained.
- AC1: Approval/dispatch/receive/reject actions are available.
- AC2: Dispatch enforces stock-state and branch-drift safeguards.
- AC3: Duplicate/invalid line and weight validation errors are blocked.

**US-TRF-03 (`Implemented`)**  
As management, I want multi-branch transfer visibility so pending and in-transit stock can be monitored.
- AC1: Multi-Branch page shows status-filtered transfer list.
- AC2: Summary cards appear when no filter is active.

---

### G. Reports, GST, and Accounts

**US-RPT-01 (`Implemented`)**  
As manager/admin, I want GST filing previews so I can prepare compliance data.
- AC1: GSTR-1 and GSTR-3B endpoints are live with period validation.
- AC2: GSTR-1 UI supports section filtering and summary cards.
- AC3: Export path is permission-gated.

**US-RPT-02 (`Implemented`)**  
As manager, I want a sales register by date range so I can review sales totals and status.
- AC1: Reports hub includes date-range sales register load flow.
- AC2: Table shows voucher/date/type/customer/taxable/GST/grand total/status.

**US-ACC-LED-01 (`Implemented`)**  
As accountant/manager, I want Chart of Accounts visibility so account hierarchy is usable.
- AC1: COA tree endpoint and UI tab are available.
- AC2: Account types are clearly labeled in UI.

**US-ACC-LED-02 (`Implemented`)**  
As accountant/manager, I want voucher create/post controls so manual accounting entries can be captured safely.
- AC1: Voucher list/create/post flows are available.
- AC2: Posting safeguards prevent invalid repeat-post behavior.

**US-ACC-LED-03 (`Implemented`)**  
As management, I want trial balance output so debit/credit health is visible.
- AC1: Trial balance API/UI is available.
- AC2: Report aggregates debit/credit by account.

---

### H. Roles, Admin, Notifications, and Dashboard

**US-ROL-01 (`Implemented`)**  
As tenant admin, I want users and module roles screen so team access can be controlled by function.
- AC1: Team users list is available for Jewellery module.
- AC2: Role chips are clearly visible (admin/manager/others).
- AC3: Revoke action requires explicit confirmation.

**US-ADM-01 (`Implemented`)**  
As tenant admin, I want admin controls (feature flags, lock period, trash restore) so policy can be enforced centrally.
- AC1: Admin control APIs exist under `/api/jwl/v1/admin/`.
- AC2: Billing create/issue/cancel/delete draft paths respect lock period.

**US-NOT-01 (`Implemented in MVP low-cost mode`)**  
As staff/manager, I want in-app notifications so I can track important events without external messaging cost.
- AC1: Notifications list + refresh action are available.
- AC2: Alerts are stored in PostgreSQL and visible on notifications page.
- AC3: External SMS/WhatsApp/email delivery is not active in current MVP.

**US-DSH-01 (`Implemented with limited scope`)**  
As shop owner/manager, I want dashboard/report widgets so I can monitor key operations quickly.
- AC1: Jewellery module shell/dashboard KPI stub exists.
- AC2: Operational report visibility is delivered through Reports, GST, Multi-Branch, and Accounts pages.

---

### I. Explicit Pending User Stories (Not for Pre-Phase-3 Commitment)

**US-KJG-01 (`Pending (Phase 3+)`)**  
As karigar manager, I need full job-card lifecycle (issue, in-progress, complete with stock return) for workmanship tracking.

**US-GLD-01 (`Pending (Phase 3+)`)**  
As pledge officer, I need full gold-loan lifecycle (disburse, accrual, repay, close/forfeit) for lending operations.

**US-EINV-01 (`Pending (Phase 3+)`)**  
As compliance owner, I need real GSTN/GSP signed IRN + QR generation for statutory e-invoice compliance.

**US-NOT-02 (`Pending (Phase 3+)`)**  
As tenant admin, I need automated external delivery (SMS/WhatsApp/email) with delivery tracking.

**US-RFID-02 (`Pending (Phase 3+)`)**  
As operations team, I need barcode/RFID tag printing and RFID reconciliation workflows.

## 4. Release Gate Recommendation (Before starting Phase 3)
- Keep Phase 1/2 release notes tied to `Implemented` stories only.
- Track all `Pending (Phase 3+)` stories in separate backlog/epic to avoid accidental scope leakage.
