# DK-JWL-QA-06 — Edge Cases and Negative Scenarios (Phase-1 / Phase-2)

**Version:** 1.0  
**Date:** 2026-05-16  
**Owner:** Agent-1 (Senior QA/Test Engineer)  
**Scope:** High-risk negative, boundary, abuse, and resilience scenarios for P1/P2 modules.

## 1) Status and Tag Standards

- Status values: `Implemented`, `Pending`, `Future Scope`
- Tags used: `NEG`, `BND`, `VAL`, `ROLE`, `TENANT`, `SEC`, `REG`

## 2) Edge/Negative Traceability Matrix

| EC ID | Linked Req ID | Module | Feature | Sub-feature | Edge/Negative Scenario | Tags | Status |
|---|---|---|---|---|---|---|---|
| EC-P1-AUTH-001 | REQ-P1-AUTH-02 | Auth | Login | Brute-force guard | Repeated invalid password attempts trigger lock/rate-limit behavior | NEG,SEC,REG | Pending |
| EC-P1-AUTH-002 | REQ-P1-AUTH-03 | Auth | Session control | Stale token reuse | Logged-out/stale token cannot access protected APIs | NEG,SEC,REG | Implemented |
| EC-P1-ROLE-001 | REQ-P1-ROLE-02 | Users/Roles | Permission checks | Privilege escalation | Cashier cannot call manager/admin endpoints using crafted payload | NEG,ROLE,SEC,TENANT,REG | Implemented |
| EC-P1-ROLE-002 | REQ-P1-ROLE-03 | Users/Roles | Branch scoping | Branch override attempt | User cannot access other branch by modifying branch_id in request | NEG,ROLE,TENANT,SEC,REG | Implemented |
| EC-P1-ADM-001 | REQ-P1-ADM-02 | Admin | Number series | Concurrency | Parallel invoice issue requests do not produce duplicate numbers | NEG,BND,SEC,REG | Implemented |
| EC-P1-ADM-002 | REQ-P1-ADM-03 | Admin | Feature flags | Unauthorized toggle | Non-admin user cannot enable restricted features | NEG,ROLE,SEC,REG | Implemented |
| EC-P1-MAS-001 | REQ-P1-MAS-01 | Masters | Category tree | Circular reference | Parent-child circular assignment is rejected | NEG,VAL,REG | Implemented |
| EC-P1-MAS-002 | REQ-P1-MAS-03 | Masters | Tax slab | Overlap boundary | Same-date overlapping slabs for same scope rejected | NEG,BND,VAL,REG | Implemented |
| EC-P1-MAS-003 | REQ-P1-MAS-06 | Masters | Deletion safety | In-use master deletion | Category/design linked to inventory cannot be hard deleted | NEG,SEC,REG | Implemented |
| EC-P1-INV-001 | REQ-P1-INV-03 | Inventory | HUID validation | Format abuse | Lowercase/special-char/short/long HUID values rejected | NEG,BND,VAL,REG | Implemented |
| EC-P1-INV-002 | REQ-P1-INV-03 | Inventory | HUID uniqueness | Duplicate collision | Duplicate HUID rejected within same tenant | NEG,VAL,TENANT,SEC,REG | Implemented |
| EC-P1-INV-003 | REQ-P1-INV-07 | Inventory | Precision | Weight overflow | Extreme decimal precision beyond allowed scale rejected/rounded safely | NEG,BND,VAL,REG | Pending |
| EC-P1-INV-004 | REQ-P1-INV-06 | Inventory | Isolation | Cross-tenant read | Tenant A cannot query item by Tenant B ID | NEG,TENANT,SEC,REG | Implemented |
| EC-P1-INV-005 | REQ-P1-INV-05 | Inventory | Scan lookup | Unknown code | Non-existent barcode/HUID returns controlled not-found response | NEG,VAL,REG | Implemented |
| EC-P1-RATE-001 | REQ-P1-RATE-02 | Rates | Override | Invalid values | Zero/negative/non-numeric rate override blocked | NEG,BND,VAL,REG | Implemented |
| EC-P1-RATE-002 | REQ-P1-RATE-01 | Rates | Live feed fallback | Upstream outage | Rate service outage shows fallback warning without app crash | NEG,SEC,REG | Pending |
| EC-P1-BILL-001 | REQ-P1-BILL-04 | Billing | Item search | 1-char input | No query should fire below min character threshold | NEG,BND,VAL,REG | Implemented |
| EC-P1-BILL-002 | REQ-P1-BILL-05 | Billing | Formula engine | Negative line amount | Negative or inconsistent computed totals blocked | NEG,VAL,SEC,REG | Implemented |
| EC-P1-BILL-003 | REQ-P1-BILL-06 | Billing | Payment split | Mismatch total | Payment splits not equal to net payable are rejected | NEG,VAL,REG | Implemented |
| EC-P1-BILL-004 | REQ-P1-BILL-03 | Billing | Cancel flow | Repeat cancel | Already-cancelled invoice cannot be cancelled again | NEG,VAL,REG | Implemented |
| EC-P1-BILL-005 | REQ-P1-BILL-09 | Billing | Access control | Unauthorized invoice fetch | User without billing permission gets 403/no data | NEG,ROLE,SEC,TENANT,REG | Implemented |
| EC-P1-BILL-006 | REQ-P1-BILL-10 | Billing | PDF output | Data mismatch | PDF totals mismatch with DB values flagged as defect | NEG,REG | Implemented |
| EC-P2-KAR-001 | REQ-P2-KAR-02 | Karigar | Workflow | Invalid transition | Skip-stage transitions are blocked (e.g., Draft -> Delivered) | NEG,VAL,REG | Implemented |
| EC-P2-KAR-002 | REQ-P2-KAR-03 | Karigar | Issue/receive | Over-receipt | Receive quantity greater than issued is rejected | NEG,BND,VAL,REG | Implemented |
| EC-P2-KAR-003 | REQ-P2-KAR-04 | Karigar | Deactivation | Open balance lock | Karigar deactivation blocked when ledger/open jobs exist | NEG,VAL,REG | Implemented |
| EC-P2-ACC-001 | REQ-P2-ACC-01 | Accounts | Voucher posting | Unbalanced entries | Debit/credit mismatch blocks posting | NEG,VAL,SEC,REG | Implemented |
| EC-P2-ACC-002 | REQ-P2-ACC-04 | Accounts | FY close | Closed period posting | Posting in closed FY rejected with clear message | NEG,VAL,SEC,REG | Implemented |
| EC-P2-ACC-003 | REQ-P2-ACC-05 | Accounts | Permission | Voucher edit gate | Non-authorized user cannot edit approved voucher | NEG,ROLE,SEC,REG | Implemented |
| EC-P2-GST-001 | REQ-P2-GST-03 | GST/Reports | E-invoice | Eligibility checks | B2C / non-applicable / zero-value invoices blocked for IRN | NEG,VAL,SEC,REG | Pending |
| EC-P2-GST-002 | REQ-P2-GST-01 | GST/Reports | Payload validity | Schema mismatch | Invalid GST payload structure rejected before export | NEG,VAL,REG | Pending |
| EC-P2-OUT-001 | REQ-P2-OUT-02 | Outstanding | Adjustment | Invalid movement type | Non-manual type rejected on manual adjust API | NEG,VAL,SEC,REG | Implemented |
| EC-P2-OUT-002 | REQ-P2-OUT-02 | Outstanding | Adjustment notes | Min-length | Short/blank notes rejected server-side | NEG,BND,VAL,REG | Implemented |
| EC-P2-OUT-003 | REQ-P2-OUT-04 | Outstanding | Isolation | Cross-party access | Adjust/view blocked for unowned party IDs | NEG,TENANT,SEC,REG | Implemented |
| EC-P2-PLG-001 | REQ-P2-PLG-02 | Gold Pledge | LTV control | Over-limit disbursal | Loan disbursal above configured LTV blocked | NEG,BND,VAL,SEC,REG | Implemented |
| EC-P2-PLG-002 | REQ-P2-PLG-01 | Gold Pledge | KYC | Missing docs | Mandatory KYC/doc fields block loan creation | NEG,VAL,SEC,REG | Implemented |
| EC-P2-PLG-003 | REQ-P2-PLG-03 | Gold Pledge | Interest | Date boundary | Interest across month/FY boundary remains accurate | NEG,BND,VAL,REG | Pending |
| EC-P2-PLG-004 | REQ-P2-PLG-05 | Gold Pledge | Sensitive data | PII leakage | Restricted roles cannot view full PAN/Aadhaar values | NEG,ROLE,SEC,REG | Implemented |
| EC-P2-MBR-001 | REQ-P2-MBR-02 | Multi-Branch | Transfer | Sequence violation | Receive cannot occur before dispatch approval | NEG,VAL,REG | Pending |
| EC-P2-MBR-002 | REQ-P2-MBR-03 | Multi-Branch | Security | Branch tampering | Transfer request with foreign branch IDs rejected | NEG,TENANT,SEC,REG | Pending |
| EC-P2-NOT-001 | REQ-P2-NOT-02 | Notifications | Consent | DND bypass attempt | Opt-out contacts never receive outbound messages | NEG,SEC,VAL,REG | Pending |
| EC-P2-NOT-002 | REQ-P2-NOT-03 | Notifications | Delivery update | Replay webhook | Duplicate webhook payloads handled idempotently | NEG,SEC,REG | Pending |
| EC-P2-NOT-003 | REQ-P2-NOT-05 | Notifications | Channel resilience | Provider failover | Primary channel outage triggers configured fallback without duplicate sends | NEG,SEC,REG | Future Scope |

## 3) Engineering Regression Entry (Edge/Negative Pack)

Execute this section only when module completion is `100%`.

- Build must be deployable with DB migrations applied.
- No open critical defect for target module.
- Security-sensitive APIs must be available in QA environment.
- Minimum run set: all `Implemented` rows with tags containing `SEC` or `TENANT`.

## 4) BA/Shopkeeper Regression Entry (Business Risk Pack)

Execute this section only when module completion is `100%` and engineering regression passed.

- Validate shop-floor misuse scenarios (wrong weights, wrong party, duplicate billing).
- Validate operational fail-safe messages are understandable.
- Validate reversal/correction flows are executable by intended roles.

## 5) QA Regression Entry (Release Gate for Negative Coverage)

Execute this section only when module completion is `100%` and BA regression passed.

- Run full edge/negative suite for in-scope modules.
- Retest all fixed defects mapped to `EC-*` IDs.
- Confirm no unresolved `SEC`/`TENANT` findings remain.

## 6) Execution Log Template

| Run Date | Module | EC Cases Planned | Executed | Passed | Failed | Blocked | Open Defects | QA Owner |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 2026-05-16 | Billing | 6 | 6 | 6 | 0 | 0 | 0 | QA-1 |
