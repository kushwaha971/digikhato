# DK-JWL-QA-05 — Phase-1 / Phase-2 QA Test Cases

**Version:** 1.0  
**Date:** 2026-05-16  
**Owner:** Agent-1 (Senior QA/Test Engineer)  
**Scope:** Phase-1 (Core Shop Operations), Phase-2 (Full Business Operations)

## 1) Status and Tag Standards

### 1.1 Execution Status
- `Implemented`: Feature exists and is testable in current build.
- `Pending`: Feature partially wired or blocked by dependency.
- `Future Scope`: Not planned for current release window.

### 1.2 Mandatory Tags
- `POS` (Positive)
- `NEG` (Negative)
- `BND` (Boundary)
- `VAL` (Validation)
- `ROLE` (Role/Permission)
- `TENANT` (Tenant isolation)
- `SEC` (Security)
- `REG` (Regression)

## 2) Requirement Traceability Model

- Requirement IDs use format `REQ-P{phase}-{module}-{feature}`.
- Test Case IDs use format `TC-P{phase}-{module}-{seq}`.
- One requirement can map to multiple test cases.

## 3) Module -> Feature -> Sub-feature Coverage (Phase-1 / Phase-2)

| Phase | Module | Feature | Sub-feature Coverage | Req IDs | Status |
|---|---|---|---|---|---|
| P1 | Auth + Access | Login and module access | Valid login, invalid login, unauthorized module access | REQ-P1-AUTH-01..03 | Implemented |
| P1 | Users/Roles | Jewellery RBAC | Role assignment, role-based action restrictions | REQ-P1-ROLE-01..03 | Implemented |
| P1 | Admin Controls | Tenant setup and controls | GST/PAN/profile, feature flags, number series, soft delete/restore | REQ-P1-ADM-01..04 | Implemented |
| P1 | Admin Controls | Form Settings Metadata | Card-based metadata CRUD for Jewellery module forms (Brandhub-style), script fallback governance | REQ-P1-ADM-05..07 | Pending |
| P1 | Masters | Catalogue setup | Metal/purity/category/design/tax slab/number series CRUD | REQ-P1-MAS-01..06 | Implemented |
| P1 | Inventory | Item lifecycle | Create/edit/list/filter, HUID, stock movement, scan lookup | REQ-P1-INV-01..07 | Implemented |
| P1 | Rates | MCX/live rate operations | Live fetch, override, history visibility, billing sync | REQ-P1-RATE-01..04 | Implemented |
| P1 | Billing (Core) | Invoice lifecycle | Draft/issue/cancel, line calc, GST split, payments, old-gold adjust | REQ-P1-BILL-01..10 | Implemented |
| P2 | Karigar | Job-work lifecycle | Karigar master, issue/receive, order states, reconciliation | REQ-P2-KAR-01..07 | Implemented |
| P2 | Accounts | Core accounting | Voucher posting, books/reports, FY checks | REQ-P2-ACC-01..06 | Implemented |
| P2 | GST + Reports | Statutory and business reports | Sales/purchase/GST reports, export, filing payload checks | REQ-P2-GST-01..06 | Pending |
| P2 | Outstanding | Party balance tracking | Amount+metal balance, ageing, adjustment controls | REQ-P2-OUT-01..06 | Implemented |
| P2 | Gold Pledge | Loan lifecycle | KYC, valuation/LTV, disbursal, repayment, closure | REQ-P2-PLG-01..08 | Implemented |
| P2 | Multi-Branch | Branch-aware operations | Branch filtering, transfer flow, branch-level visibility | REQ-P2-MBR-01..05 | Pending |
| P2 | Notifications | Event notifications | Template, trigger, delivery status, opt-out | REQ-P2-NOT-01..05 | Pending |

## 4) Detailed QA Test Cases

| TC ID | Req ID | Module | Feature | Sub-feature | Test Scenario | Tags | Status |
|---|---|---|---|---|---|---|---|
| TC-P1-AUTH-001 | REQ-P1-AUTH-01 | Auth | Login | Valid credentials | Login succeeds and opens jewellery dashboard | POS,REG | Implemented |
| TC-P1-AUTH-002 | REQ-P1-AUTH-02 | Auth | Login | Invalid credentials | Wrong password rejected with no session | NEG,VAL,SEC,REG | Implemented |
| TC-P1-AUTH-003 | REQ-P1-AUTH-03 | Auth | Access control | Direct URL access | Unauthorized role cannot open jewellery module URL | NEG,ROLE,SEC,TENANT,REG | Implemented |
| TC-P1-ROLE-001 | REQ-P1-ROLE-01 | Users/Roles | Role mapping | Module role assignment | Admin assigns cashier role to user for branch | POS,ROLE,REG | Implemented |
| TC-P1-ROLE-002 | REQ-P1-ROLE-02 | Users/Roles | Permission gate | Rate override action | Non-manager/non-admin cannot override rate | NEG,ROLE,SEC,REG | Implemented |
| TC-P1-ROLE-003 | REQ-P1-ROLE-03 | Users/Roles | Branch-restricted actions | Cross-branch restriction | User can operate only in mapped branch | NEG,ROLE,TENANT,SEC | Implemented |
| TC-P1-ADM-001 | REQ-P1-ADM-01 | Admin | Tenant profile | Configuration save | GSTIN/PAN/profile update persists correctly | POS,VAL,REG | Implemented |
| TC-P1-ADM-002 | REQ-P1-ADM-02 | Admin | Number series | Auto increment | Invoice number increments without duplicates | POS,BND,REG | Implemented |
| TC-P1-ADM-003 | REQ-P1-ADM-03 | Admin | Feature flags | Access toggle | Disabled module not accessible to users | POS,ROLE,SEC,REG | Implemented |
| TC-P1-ADM-004 | REQ-P1-ADM-04 | Admin | Soft delete | Restore flow | Deleted master record can be restored with audit trail | POS,SEC,REG | Implemented |
| TC-P1-ADM-005 | REQ-P1-ADM-05 | Admin | Form settings cards | List visibility | Admin can see metadata card list by jewellery feature/sub-feature | POS,ROLE,REG | Pending |
| TC-P1-ADM-006 | REQ-P1-ADM-06 | Admin | Form settings metadata CRUD | Validation + save | Add/edit/delete metadata via UI with field validation and audit event | POS,VAL,SEC,REG | Pending |
| TC-P1-ADM-007 | REQ-P1-ADM-07 | Admin | Script governance | Policy enforcement | Routine metadata change is blocked outside approved UI path; only bootstrap/migration scripts allowed | NEG,SEC,REG | Pending |
| TC-P1-MAS-001 | REQ-P1-MAS-01 | Masters | Category | CRUD | Create/update/delete category tree nodes | POS,VAL,REG | Implemented |
| TC-P1-MAS-002 | REQ-P1-MAS-02 | Masters | Design | Mandatory field checks | Missing design name/code blocked | NEG,VAL,REG | Implemented |
| TC-P1-MAS-003 | REQ-P1-MAS-03 | Masters | Tax slab | Effective date rules | Overlapping slab effective dates rejected | NEG,BND,VAL,REG | Implemented |
| TC-P1-MAS-004 | REQ-P1-MAS-04 | Masters | Number series | Prefix/year reset | FY boundary resets as configured | POS,BND,REG | Implemented |
| TC-P1-MAS-005 | REQ-P1-MAS-05 | Masters | Metal/purity | Read-only defaults | Seeded metal/purity cannot be corrupted by non-admin | NEG,ROLE,SEC | Implemented |
| TC-P1-INV-001 | REQ-P1-INV-01 | Inventory | Item create | Mandatory attributes | Item creation with required weight/purity fields | POS,VAL,REG | Implemented |
| TC-P1-INV-002 | REQ-P1-INV-02 | Inventory | Item list/filter | Filter matrix | Category/purity/status filters return accurate items | POS,REG | Implemented |
| TC-P1-INV-003 | REQ-P1-INV-03 | Inventory | HUID | Format + uniqueness | Invalid or duplicate HUID blocked in tenant | NEG,VAL,SEC,TENANT,REG | Implemented |
| TC-P1-INV-004 | REQ-P1-INV-04 | Inventory | Stock movement | Movement history | Every stock-in/out creates movement log entry | POS,SEC,REG | Implemented |
| TC-P1-INV-005 | REQ-P1-INV-05 | Inventory | Scan lookup | Barcode/HUID scan | Valid code resolves correct item | POS,VAL,REG | Implemented |
| TC-P1-INV-006 | REQ-P1-INV-06 | Inventory | Tenant isolation | Data leakage | Tenant A cannot fetch Tenant B inventory via API | NEG,TENANT,SEC,REG | Implemented |
| TC-P1-INV-007 | REQ-P1-INV-07 | Inventory | Weight precision | Decimal boundary | Weight precision retained for 3+ decimal entries | BND,VAL,REG | Implemented |
| TC-P1-RATE-001 | REQ-P1-RATE-01 | Rates | Live rate | Fetch + display | Current 22K/18K rates visible and fresh | POS,REG | Implemented |
| TC-P1-RATE-002 | REQ-P1-RATE-02 | Rates | Override | Permission + effect | Admin override applies to billing calculations | POS,ROLE,REG | Implemented |
| TC-P1-RATE-003 | REQ-P1-RATE-03 | Rates | Override guard | Invalid override | Negative/zero/blank override rejected | NEG,BND,VAL,REG | Implemented |
| TC-P1-RATE-004 | REQ-P1-RATE-04 | Rates | History | Change audit | Rate changes logged with user and timestamp | POS,SEC,REG | Implemented |
| TC-P1-BILL-001 | REQ-P1-BILL-01 | Billing | Draft invoice | Draft save | Draft invoice saves with pending status | POS,REG | Implemented |
| TC-P1-BILL-002 | REQ-P1-BILL-02 | Billing | Issue invoice | Finalization | Invoice issue updates status and inventory | POS,REG | Implemented |
| TC-P1-BILL-003 | REQ-P1-BILL-03 | Billing | Cancel invoice | Controlled reversal | Cancel requires reason and reverses stock entries | POS,VAL,SEC,REG | Implemented |
| TC-P1-BILL-004 | REQ-P1-BILL-04 | Billing | Item search | Debounce/min chars | Search API calls start only after threshold chars | POS,BND,REG | Implemented |
| TC-P1-BILL-005 | REQ-P1-BILL-05 | Billing | Invoice formula | GST split | CGST/SGST vs IGST split computed correctly | POS,VAL,REG | Implemented |
| TC-P1-BILL-006 | REQ-P1-BILL-06 | Billing | Payments | Split payments | Multi-payment mode totals equal invoice payable | POS,VAL,REG | Implemented |
| TC-P1-BILL-007 | REQ-P1-BILL-07 | Billing | Old-gold exchange | Deduction flow | Old gold deduction reflected in final payable | POS,REG | Implemented |
| TC-P1-BILL-008 | REQ-P1-BILL-08 | Billing | Estimate mode | Tax behavior | Estimate does not post tax/ledger impact | POS,ROLE,REG | Implemented |
| TC-P1-BILL-009 | REQ-P1-BILL-09 | Billing | Data safety | Unauthorized invoice read | User without permission cannot access invoice details | NEG,ROLE,SEC,TENANT,REG | Implemented |
| TC-P1-BILL-010 | REQ-P1-BILL-10 | Billing | PDF output | Print fidelity | PDF totals/taxes match on-screen invoice | POS,REG | Implemented |
| TC-P2-KAR-001 | REQ-P2-KAR-01 | Karigar | Master data | CRUD + validation | Karigar create/update validates PAN/mobile | POS,VAL,REG | Implemented |
| TC-P2-KAR-002 | REQ-P2-KAR-02 | Karigar | Order lifecycle | State transitions | Invalid stage jumps blocked by workflow rules | NEG,VAL,REG | Implemented |
| TC-P2-KAR-003 | REQ-P2-KAR-03 | Karigar | Issue/receive | Metal movement | Issue and receive quantities reconcile correctly | POS,VAL,REG | Implemented |
| TC-P2-KAR-004 | REQ-P2-KAR-04 | Karigar | Inactivation | Open work restriction | Inactivate blocked/warned when open issues exist | NEG,VAL,REG | Implemented |
| TC-P2-KAR-005 | REQ-P2-KAR-05 | Karigar | Ledger | Payment and balance | Karigar ledger reflects debit/credit accurately | POS,REG | Implemented |
| TC-P2-ACC-001 | REQ-P2-ACC-01 | Accounts | Voucher posting | Double entry | Billing event creates balanced voucher entries | POS,SEC,REG | Implemented |
| TC-P2-ACC-002 | REQ-P2-ACC-02 | Accounts | Manual journal | Validation | Unbalanced voucher save is rejected | NEG,VAL,REG | Implemented |
| TC-P2-ACC-003 | REQ-P2-ACC-03 | Accounts | Reports | Trial balance | Trial balance totals match ledger postings | POS,REG | Implemented |
| TC-P2-ACC-004 | REQ-P2-ACC-04 | Accounts | FY control | Closed period check | Posting into closed FY is blocked | NEG,SEC,REG | Implemented |
| TC-P2-ACC-005 | REQ-P2-ACC-05 | Accounts | Access control | Sensitive voucher edit | Non-authorized role cannot edit approved vouchers | NEG,ROLE,SEC,REG | Implemented |
| TC-P2-GST-001 | REQ-P2-GST-01 | GST/Reports | GSTR-1 | Payload generation | GSTR-1 export includes valid section mappings | POS,VAL,REG | Pending |
| TC-P2-GST-002 | REQ-P2-GST-02 | GST/Reports | GSTR-3B | Summary totals | 3B values reconcile with source invoices | POS,VAL,REG | Pending |
| TC-P2-GST-003 | REQ-P2-GST-03 | GST/Reports | E-invoice | Eligibility checks | B2C/disabled/zero-value invoices blocked for IRN | NEG,VAL,SEC,REG | Pending |
| TC-P2-GST-004 | REQ-P2-GST-04 | GST/Reports | Export | CSV/XLS/PDF | Export file column headers and totals are correct | POS,REG | Implemented |
| TC-P2-GST-005 | REQ-P2-GST-05 | GST/Reports | E-way bill | API integration | External e-way bill API handshake and ack persistence | POS,SEC,REG | Future Scope |
| TC-P2-OUT-001 | REQ-P2-OUT-01 | Outstanding | Balance logic | Amount + metal | Dual balances update correctly per transaction | POS,VAL,REG | Implemented |
| TC-P2-OUT-002 | REQ-P2-OUT-02 | Outstanding | Adjustments | Permission + notes | Unauthorized adjust blocked; note min-length enforced | NEG,ROLE,VAL,SEC,REG | Implemented |
| TC-P2-OUT-003 | REQ-P2-OUT-03 | Outstanding | Ageing | Bucket calculations | Ageing buckets map correctly by due date | POS,BND,REG | Implemented |
| TC-P2-OUT-004 | REQ-P2-OUT-04 | Outstanding | Tenant isolation | Cross-tenant ledger access | API blocks customer/movement access across tenants | NEG,TENANT,SEC,REG | Implemented |
| TC-P2-PLG-001 | REQ-P2-PLG-01 | Gold Pledge | Loan creation | KYC + valuation | Loan create succeeds with mandatory KYC/doc checks | POS,VAL,SEC,REG | Implemented |
| TC-P2-PLG-002 | REQ-P2-PLG-02 | Gold Pledge | LTV guardrail | Threshold validation | Disbursal above allowed LTV is blocked | NEG,BND,VAL,SEC,REG | Implemented |
| TC-P2-PLG-003 | REQ-P2-PLG-03 | Gold Pledge | Interest accrual | Calculation modes | Interest computed as configured scheme mode | POS,VAL,REG | Implemented |
| TC-P2-PLG-004 | REQ-P2-PLG-04 | Gold Pledge | Repayment | Partial/full repayment | Repayments reduce principal/interest correctly | POS,VAL,REG | Implemented |
| TC-P2-PLG-005 | REQ-P2-PLG-05 | Gold Pledge | Security | PII access control | Restricted roles cannot view raw KYC identifiers | NEG,ROLE,SEC,REG | Implemented |
| TC-P2-MBR-001 | REQ-P2-MBR-01 | Multi-Branch | Branch filter | Scoped views | Lists/reports show only selected branch data | POS,TENANT,REG | Pending |
| TC-P2-MBR-002 | REQ-P2-MBR-02 | Multi-Branch | Inter-branch transfer | Workflow integrity | Transfer enforces request/approve/dispatch/receive sequence | POS,VAL,REG | Pending |
| TC-P2-MBR-003 | REQ-P2-MBR-03 | Multi-Branch | Security | Branch tampering | Payload branch_id tampering rejected server-side | NEG,SEC,TENANT,REG | Pending |
| TC-P2-NOT-001 | REQ-P2-NOT-01 | Notifications | Event trigger | Invoice/share trigger | Event creates message job with correct template | POS,REG | Pending |
| TC-P2-NOT-002 | REQ-P2-NOT-02 | Notifications | Consent controls | DND/opt-out | Opted-out recipients are not messaged | NEG,SEC,VAL,REG | Pending |
| TC-P2-NOT-003 | REQ-P2-NOT-03 | Notifications | Delivery tracking | Status webhook | Delivery/failure statuses update correctly | POS,REG | Pending |
| TC-P2-NOT-004 | REQ-P2-NOT-05 | Notifications | Channel resilience | Provider failover | Automatic channel fallback/retry policy verification | NEG,SEC,REG | Future Scope |

## 5) Regression Sections (Run Only After Module is 100%)

### 5.1 Engineering Regression (Post-merge, pre-UAT)

**Entry criteria (all mandatory):**
- Module development complete (`100%` stories accepted).
- Unit/API tests green in CI.
- Migrations applied and smoke checks passed.
- No open Sev-1/Sev-2 defects for module.

**Execution pack:**
- Mandatory tags: `REG + SEC + TENANT + ROLE`.
- Run all `Implemented` cases for module from Section 4.
- Include API contract checks, DB integrity checks, and backward compatibility checks.

### 5.2 BA / Shopkeeper Regression (Business Flow Validation)

**Entry criteria (all mandatory):**
- Engineering regression passed for module.
- UAT data set loaded (realistic SKU/customer/rate data).
- BA sign-off checklist prepared per module.

**Execution pack:**
- Focus tags: `POS + BND + REG`.
- Validate end-to-end business flows: inventory -> billing -> outstanding -> accounts impact.
- Verify printouts/PDFs and operator usability steps.

### 5.3 QA Regression (Release Gate)

**Entry criteria (all mandatory):**
- Module coverage `100%` for planned release cases.
- All blocking defects closed and retested.
- Test evidence attached (screenshots/logs/API payloads).

**Execution pack:**
- Full regression across all `Implemented` cases in Section 4.
- Re-run impacted `Pending` cases promoted to `Implemented` in current build.
- Mandatory sign-off artifacts: execution summary, defect leakage report, risk sign-off.

## 6) QA Execution Log Template

| Module | Planned | Executed | Passed | Failed | Blocked | Pass % | Owner | Last Run Date |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Example: Billing | 10 | 10 | 9 | 1 | 0 | 90% | QA-1 | 2026-05-16 |
