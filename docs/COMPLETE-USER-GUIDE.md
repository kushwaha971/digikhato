# DigiKhaato Business User Guide
## Complete User Documentation (Current Implemented System)

**Version:** 1.0  
**Prepared On:** May 7, 2026  
**Audience:** Business users, end users, admins, managers, and stakeholders  
**Coverage:** Loan Management + UdhaarBook + Jewellery ERP (current implemented scope)

---

## Table of Contents

1. Introduction  
2. Current Implemented Features  
3. Detailed Form Documentation  
4. Formula & Calculation Documentation  
5. Workflow & Process Flow  
6. Validation Rules  
7. User Roles & Permissions  
8. API & System Behavior (User Perspective)  
9. Known Limitations / Pending Areas  
10. Next Phase Planning  
11. Business Scenarios & Use Cases  
12. FAQ & Troubleshooting

---

## 1. Introduction

### 1.1 Product Overview
DigiKhaato is a modular business operating platform that currently supports:
- **Loan Management** operations (borrowers, loans, field collections, overdue tracking, reports)
- **UdhaarBook / Customer Ledger** style lightweight account views
- **Jewellery ERP** operations (billing, inventory, customer master, karigar, outstanding, pledge loans)

### 1.2 Purpose of the System
The system is designed to digitize day-to-day business operations with auditability, role-based control, and real-time status visibility. It replaces manual registers, disconnected spreadsheets, and delayed reconciliations.

### 1.3 Target Users
- Shop owner / business admin
- Branch manager
- Cashier / salesperson / field collector
- Karigar manager
- Finance and audit users
- Super admin / platform owner

### 1.4 Business Value
- Faster daily operations with lower manual effort
- Better control over cashflow, stock, and receivables
- Standardized billing and formula-driven calculations
- Role-based permissions to reduce misuse
- Tenant-safe data segregation and operational traceability

---

## 2. Current Implemented Features

### 2.1 Module Status Snapshot

| Module | Current Status | Business Usage Status |
|---|---|---|
| Authentication & Onboarding | Implemented | Live usable |
| Team / User Management | Implemented | Live usable |
| Borrower Management | Implemented | Live usable |
| Loan Management | Implemented | Live usable |
| Loan Collections | Implemented | Live usable |
| Account + Daily Collection | Implemented (core) | Usable with limited UX polish |
| Dashboard & Reports | Implemented | Live usable |
| Jewellery Billing | Implemented (major flows complete) | Live usable |
| Jewellery Inventory | Implemented with tracking views | Live usable |
| Jewellery Customers | Implemented | Live usable |
| Jewellery Karigar & Orders | Implemented (with edit/inactivate) | Live usable |
| Jewellery Outstanding | Implemented | Live usable |
| Jewellery Gold Pledge | Implemented (core flows) | Live usable |
| Multi-Branch / Notifications / Advanced Integrations | Partial / planned | Not fully active |

### 2.2 Feature Guide by Business Area

### 2.2.1 Order Management (Jewellery Customer Orders + Karigar Workflow)
**Purpose:** Track custom orders and production handoff.  
**User benefit:** Visibility from booking to delivery.

**How to use:**
1. Open `Jewellery > Karigar > Orders`.
2. Create a new order by selecting customer and entering order details.
3. Advance status through business stages.
4. Link issue/receipt vouchers for production tracking.

**Expected behavior:**
- Status transitions are controlled.
- Historical order trail remains visible.

**Screenshot Placeholder:** `Order list, status progression, advance-status modal`

### 2.2.2 Product Management (Jewellery Item Master)
**Purpose:** Maintain item-level stock with purity/weight metadata.  
**User benefit:** Accurate billing and stock traceability.

**How to use:**
1. Open `Jewellery > Inventory > Item Master`.
2. Add item with metal, purity, gross/net/stone weights.
3. Set identifiers (SKU, barcode, HUID).
4. Track item status (`IN_STOCK`, `SOLD`, etc.).

**Expected behavior:**
- Stock status updates automatically on invoice issue/cancel and transfer workflows.

**Screenshot Placeholder:** `Item list + item detail + status badges`

### 2.2.3 Supplier / Party Finance (Outstanding Ledger)
**Purpose:** Track party-level dual balances (cash + metal grams).  
**User benefit:** Daily visibility of receivables and credits.

**How to use:**
1. Open `Jewellery > Outstanding`.
2. Review ageing buckets and party balances.
3. Open party drawer for movement history.
4. Post manual adjustments (authorized roles only).

**Expected behavior:**
- Balances are movement-driven and auto-recalculated.
- Last 50 movements are visible in detail.

**Screenshot Placeholder:** `Outstanding ageing cards + adjustment drawer`

### 2.2.4 CRM (Customer Management)
**Purpose:** Central customer profile for billing and relationship tracking.  
**User benefit:** Faster invoice creation, better repeat-customer service.

**How to use:**
1. Open `Jewellery > Customers`.
2. Search by name/mobile.
3. Create or edit customer with GST/state/contact details.

**Expected behavior:**
- Customer can be selected directly in billing forms.

**Screenshot Placeholder:** `Customer form and search selector`

### 2.2.5 Insights & Reporting
**Purpose:** Daily operational and financial visibility.

**Implemented reports include:**
- Daily collections
- Loan/account summaries
- Overdue reporting
- Jewellery operational dashboards and report stubs

**Expected behavior:**
- Filters update results immediately.
- Lists support pagination.

### 2.2.6 Logistics (Transfers + Stock Take)
**Purpose:** Control inter-branch item movement and physical verification.

**How to use:**
1. Create transfer request.
2. Approve/dispatch/receive transfer.
3. Run stock-take session and complete with variance capture.

**Expected behavior:**
- Item status changes to `TRANSIT` then `IN_STOCK` on receive.

### 2.2.7 Finance (Loan + Billing + Pledge)
**Purpose:** Manage lending and retail transaction flows.

**Implemented sub-areas:**
- Loan creation and repayment status
- Collection posting with automatic loan balance recalculation
- Jewellery invoice with GST, old-gold, and split payment
- Gold pledge disbursal/repayment core

### 2.2.8 Design Management
**Purpose:** Manage design catalog and related master data.

**Current capability:**
- Design CRUD pages
- Master categories/tax slab/number series support

### 2.2.9 User Management
**Purpose:** Control module access and operational permissions.

**Current capability:**
- Team member create/edit/activate/deactivate
- Module roles per user with branch scoping
- Super admin tenant administration views

### 2.2.10 Central Services
**Purpose:** Shared identity, audit-ready status updates, and integration-ready architecture.

**Current capability:**
- JWT authentication with refresh behavior
- Role and module-based gating
- Tenant isolation patterns across modules

---

## 3. Detailed Form Documentation

> Note: This section documents the major operational forms currently wired and used in production workflows.

### 3.1 Authentication & Setup Forms

| Form | Field | Purpose | Type | Required | Validation / Accepted Values | Dependencies / Behavior |
|---|---|---|---|---|---|---|
| Login | Mobile Number | User sign-in identity | Text | Yes | Valid mobile format | Must match registered account |
| Login | Password | Authentication credential | Password | Yes | Non-empty | Incorrect values show login failure |
| Signup | Full Name | User display name | Text | Yes | Non-empty | Stored in user profile |
| Signup | Mobile Number | Unique user ID | Text | Yes | Unique mobile | Duplicate mobile blocked |
| Signup | Password | Initial credential | Password | Yes | Policy check | Must be confirmed where applicable |
| Onboarding | Business Name | Tenant/business identity | Text | Yes | Non-empty | Used across module branding |
| Onboarding | Area Name | Locality/branch context | Text | Optional | Free text | Operational display use |
| Onboarding | Currency | Money display convention | Dropdown | Yes | Configured options | Impacts display only |

### 3.2 Borrower & Loan Forms

| Form | Field | Purpose | Type | Required | Validation | Auto-calculation / Notes |
|---|---|---|---|---|---|---|
| Borrower Create/Edit | Name | Borrower identity | Text | Yes | Non-empty | Used across all linked loans |
| Borrower Create/Edit | Mobile | Contact and search key | Text | Yes | Format checks | Supports quick search |
| Borrower Create/Edit | Assignment | Collector assignment | Dropdown | Optional/Role based | Valid user only | Drives collector visibility rules |
| Loan Create/Edit | Borrower | Link loan to borrower | Selector | Yes | Must exist | Cannot mismatch later collections |
| Loan Create/Edit | Principal | Base loan amount | Number | Yes | Positive | Used in total/EMI calculations |
| Loan Create/Edit | Interest Rate % | Flat interest rate | Number | Optional | Numeric, >=0 | Defaults to 0 if empty |
| Loan Create/Edit | Tenure Days | Repayment duration | Number | Optional | Positive integer | If missing, daily EMI stays 0 |
| Loan Create/Edit | Start Date | Loan start date | Date | Yes | Valid date | Used in due/alert logic |

### 3.3 Collection Forms

| Form | Field | Purpose | Type | Required | Validation | Behavior |
|---|---|---|---|---|---|---|
| Collection Entry (Loan) | Loan | Select loan to collect | Selector | Yes | Must match borrower | Borrower-loan mismatch blocked |
| Collection Entry (Loan) | Borrower | Borrower reference | Selector | Yes | Assigned scope checks for collector | Collector can only collect assigned borrowers |
| Collection Entry (Loan) | Amount Paid | Payment value | Number | Yes | >0 recommended | Impacts loan paid/outstanding recalculation |
| Collection Entry (Loan) | Payment Mode | Instrument channel | Dropdown | Yes | Enum values | Cash / UPI variants etc |
| Collection Entry (Loan) | Date | Collection date | Date | Yes | Valid date | Drives reporting day-wise |
| Collection Entry (Loan) | Notes / Reference | Operational trace | Text | Optional | Length bounds | Useful for reconciliation |
| Daily Collection (Account) | Account | Target account | Selector | Yes | Must exist | Updates account amount_paid/outstanding |
| Daily Collection (Account) | Payment | Received amount | Number | Yes | Positive | Auto-closes account at zero outstanding |
| Daily Collection (Account) | Date | Transaction date | Date | Yes | Valid date | Reporting and history index |

### 3.4 Jewellery Billing Forms

#### 3.4.1 Invoice Header Form

| Field | Purpose | Type | Required | Validation / Accepted Values | Dependencies |
|---|---|---|---|---|---|
| Document Type | Invoice mode | Dropdown | Yes | `TAX_INVOICE`, `ESTIMATE`, `CASH_MEMO`, `NON_GST`, `CREDIT_NOTE` | Credit note requires reference invoice |
| Customer | Buyer identity | Search-select | Optional for walk-in | Valid customer id | B2B behavior uses customer GSTIN |
| Seller State / Place of Supply | GST split basis | Dropdown | Yes | Valid state codes | Different states trigger IGST |
| Discount Amount | Bill-level discount | Number | Optional | >=0 | Discount proportionally allocated |
| Notes | Internal/external notes | Textarea | Optional | Length limited | Appears in invoice record |

#### 3.4.2 Invoice Line Form

| Field | Purpose | Type | Required | Validation / Rules | Auto-fill / Auto-calc |
|---|---|---|---|---|---|
| Item Search | Select stock item | Search input | Optional (manual line allowed) | Search by SKU/barcode/HUID | Fills metal/purity/weights/HUID |
| Description | Item description | Textarea | Yes for final line completeness | Non-empty for valid line | Auto-seeded from item when selected |
| HSN Code | Tax code | Text | Optional/Defaulted | Alphanumeric | Defaults from form |
| Metal/Purity | Product classification | Text | Yes for itemized lines | Uppercase code | Auto-filled from item |
| Gross/Net/Stone Weight | Weight basis | Numeric | Net mandatory for complete line | Decimal weight input | Used in value and GST calculations |
| Rate per gram | Pricing base | Numeric | Yes | >=0 | Pulled from live rates when possible |
| Making Mode | Labour model | Dropdown | Yes | `PER_GRAM`, `PCT_METAL`, `PER_PIECE` | Chooses making formula |
| Making Rate | Labour factor | Numeric | Yes | >=0 | Used by selected making mode |
| Wastage % | Wastage factor | Numeric | Optional | >=0 | Converted to wastage amount |
| Hallmark Fee | Compliance service fee | Numeric | Optional | >=0 | 18% hallmark GST applied |
| Stone Value | Non-metal value | Numeric | Optional | >=0 | Added to line total |
| GST % | Metal GST | Numeric | Optional | Usually 3% | Split CGST/SGST or IGST |
| HUID (read-only chip) | Hallmark identifier | Read-only chip | Auto when item selected | Uppercase/format controlled in inventory | Persisted on invoice line |

#### 3.4.3 Payment Split Form

| Field | Purpose | Type | Required | Validation | Behavior |
|---|---|---|---|---|---|
| Mode | Payment channel | Dropdown | Yes | Enum modes | Multiple rows allowed |
| Amount | Paid amount | Number | Yes | >0 for valid row | Sum contributes to paid amount |
| Reference | Trace ID | Text | Optional | Free text | Useful for UPI/card/bank trace |

#### 3.4.4 Old Gold Form

| Field | Purpose | Type | Required | Validation | Auto-calc |
|---|---|---|---|---|---|
| Metal Code | Exchange metal type | Text | Yes | e.g., GOLD | Grouping/reporting reference |
| Gross Weight | Received old-gold weight | Number | Yes | >0 | Used in pure-gram formula |
| Tested Purity | Assay purity | Number | Yes | >0 | `pure_grams = gross * purity / 99.9` |
| Buy Rate per gram | Buyback valuation | Number | Yes | >0 | `deduction_value = pure_grams * buy_rate` |
| Description | Item note | Text | Optional | Free text | Audit note |

### 3.5 Jewellery Inventory Forms

| Form | Key Fields | Mandatory | Rules / Validation |
|---|---|---|---|
| Item Create/Edit | Metal, Purity, Gross Wt, Net Wt, HUID, Hallmark Status | Metal/Purity/Gross/Net required | Weight format (up to 4 decimals), HUID format `[A-Z0-9]{6}` when provided, unique non-empty HUID per tenant |
| Transfer Create | From Branch, To Branch, Item Lines | To + lines required | Status workflow controlled (request/approve/dispatch/receive) |
| Stock Take Create | Notes, branch context | Minimal required | Completion computes variances |

### 3.6 Jewellery Karigar & Order Forms

| Form | Key Fields | Mandatory | Validation Highlights |
|---|---|---|---|
| Karigar Create/Edit | Name, Mobile, PAN, Wastage, Labour, Active Toggle | Name + mobile required | Mobile: 10 digits (`+91` normalized), PAN pattern `AAAAA9999A` if provided |
| Customer Order Create | Customer, Description, Expected Delivery | Customer + description required | Status transitions controlled by workflow |
| Advance Order Status | New Status | Required | Must follow allowed transition path |
| Metal Issue Voucher | Karigar, Metal, Purity, Gross Wt, Tunch %, Date | Required | Numeric checks on weight/tunch |
| Karigar Receipt | Karigar, Issue, Gross/Net Wt, Purity %, Date | Required | Purity range checks, reconciliation outputs |

### 3.7 Jewellery Gold Pledge Forms

| Form | Key Fields | Mandatory | Validation / Behavior |
|---|---|---|---|
| New Pledge Loan | Customer, Scheme, Principal, Tenure, Loan Date, Pledge Items | Required | Principal >0, tenure constraints, item-level weight/rate validations |
| Repayment | Date, Principal Paid, Interest Paid, Mode | Required | Non-negative payment amounts, updates loan balance timeline |

### 3.8 Admin & Access Forms

| Form | Purpose | Validation |
|---|---|---|
| Team Member Create/Edit | User provisioning | Required identity fields, role assignment checks |
| Module Access Review (Super Admin) | Approve/reject module request | Reject reason minimum length |
| Jewellery Feature Flags | Enable/disable features | Admin-permission gated |
| Jewellery Lock Period | Billing period control | Date/business rule validation |

---

## 4. Formula & Calculation Documentation

### 4.1 Loan Management Formulas

| Formula Name | Purpose | Inputs | Output | Explanation |
|---|---|---|---|---|
| Loan Total Amount | Add interest to principal | `principal`, `interest_rate` | `total_amount` | `interest = principal * (rate/100)` and `total = principal + interest` |
| Daily EMI | Daily repayment expectation | `total_amount`, `tenure_days` | `daily_emi` | `daily_emi = total / tenure_days` (if tenure exists) |
| Outstanding Balance | Current due | `total_amount`, `paid_amount` | `outstanding_balance` | `max(total - paid, 0)` |
| Missed Days Indicator | Collection performance proxy | `daily_emi`, elapsed days, paid_amount | integer missed-days | Calculates expected paid by date and compares shortfall |

**Example:**
- Principal: 100,000  
- Interest rate: 12% flat  
- Total: 112,000  
- Tenure: 112 days  
- Daily EMI: 1,000

### 4.2 Loan Collection Status Logic

| Logic | Rule |
|---|---|
| Paid | Amount >= current outstanding |
| Partial | Amount > 0 but < current outstanding |
| Missed | Amount <= 0 |

### 4.3 Account + Daily Collection Logic

| Formula Name | Purpose | Rule |
|---|---|---|
| Account Outstanding Update | Keep account balance current | On new daily collection: `amount_paid += payment`, `outstanding = max(amount_given - amount_paid, 0)` |
| Account Auto Close | Mark fully repaid accounts | If outstanding reaches 0, status becomes `closed` |

### 4.4 Jewellery Billing Formulas

| Formula Name | Purpose | Inputs | Output | Core Rule |
|---|---|---|---|---|
| Metal Value | Base metal valuation | `net_wt`, `rate_per_gram` | `metal_value` | `metal_value = net_wt * rate_per_gram` |
| Making Charge (Per Gram) | Labour cost | `net_wt`, `making_rate` | `making_charge` | `net_wt * making_rate` |
| Making Charge (% Metal) | Labour cost | `metal_value`, `making_rate` | `making_charge` | `metal_value * making_rate/100` |
| Making Charge (Per Piece) | Flat labour | `making_rate` | `making_charge` | `making_rate` |
| Wastage Amount | Wastage valuation | `net_wt`, `wastage_pct`, `rate_per_gram` | `wastage_amount` | `(net_wt * wastage_pct/100) * rate_per_gram` |
| Metal GST | GST on metal part | `line_metal_part`, `gst_rate_pct` | `gst_amount` | `line_metal_part * gst_rate/100` |
| Hallmark GST | GST on hallmark service | `hallmarking_fee` | `hallmark_gst_amount` | `hallmarking_fee * 18%` |
| Discount Allocation | Fair bill-level discount split | bill discount + line taxable weights | `discount_allocated` per line | Proportional allocation by line taxable base |
| Round Off | Currency neat total | `gross_total` | `round_off` | `round(gross_total) - gross_total` |
| Final Payable | Payable amount | all totals | `total_amount` | `gross_total + round_off` |

### 4.5 Old Gold Exchange Formula

| Formula | Purpose |
|---|---|
| `pure_grams = gross_wt * tested_purity / 99.9` | Convert gross old-gold into pure equivalent |
| `deduction_value = pure_grams * buy_rate_per_gram` | Reduce amount payable by exchange value |

### 4.6 Outstanding / Party Ledger Logic

| Rule | Explanation |
|---|---|
| Balance update | Every movement updates amount and metal balances atomically |
| Overdue flag | Based on `last_txn_date` threshold (90+ days bucket) |
| Ageing buckets | `0-30`, `31-60`, `61-90`, `90+` derived from age days |

### 4.7 Gold Pledge Formulas (Implemented Core)

| Formula | Purpose |
|---|---|
| LTV-based valuation usage | Controls principal vs collateral value |
| Interest methods (simple/compound/daily/flat) | Scheme-based loan due computation |
| Repayment split | Principal + interest settlement tracking |

---

## 5. Workflow & Process Flow

### 5.1 End-to-End Loan Business Flow

```text
User Login
  -> Onboarding / Profile Setup
  -> Borrower Creation
  -> Loan Creation
  -> Daily Collections Posting
  -> Loan Balance Auto Recalculation
  -> Overdue Monitoring
  -> Reports / Review
```

### 5.2 End-to-End Jewellery Billing Flow

```text
Customer Selection
  -> Invoice Type Selection
  -> Item Search/Scan + Auto-fill
  -> Line Calculation (rate, making, wastage, GST)
  -> Optional Old-Gold Deduction
  -> Payment Split Entry
  -> Save Draft OR Issue Invoice
  -> Item Status Update (IN_STOCK -> SOLD)
  -> Optional Print/PDF/Share/E-Invoice Reference
```

### 5.3 Credit Note / Reversal Flow

```text
Issued Invoice Selected
  -> Create Credit Note with Reference Invoice
  -> Select return lines
  -> Issue Credit Note
  -> Item Status Reversal (SOLD -> IN_STOCK)
```

### 5.4 Inventory Transfer Flow

```text
Transfer Request
  -> Approve
  -> Dispatch (item status -> TRANSIT)
  -> Receive (item status -> IN_STOCK + branch update)
```

### 5.5 Outstanding Adjustment Flow

```text
Outstanding List
  -> Party Detail Drawer
  -> Manual Adjustment Form (authorized roles)
  -> Movement posted atomically
  -> Balance refresh + history update
```

### 5.6 Approval / Rejection / Cancel Behavior

| Flow Type | Current Behavior |
|---|---|
| Loan/Borrower edit restrictions | Collector is blocked from mutation paths |
| Invoice cancel | Allowed with role check and reason, subject to lock-period rules |
| Draft deletion | Draft invoices only |
| Module access request rejection | Requires reason |
| Status transitions (orders/transfers) | Controlled by allowed transitions only |

### 5.7 Cross-Module Dependencies

| Source Module | Depends On | Why |
|---|---|---|
| Collections | Loans/Borrowers | Payment must map to a valid loan-borrower pair |
| Dashboard | Loans + Collections + Accounts | KPI aggregation |
| Jewellery Billing | Inventory + Customers + Rates | Accurate line pricing and stock movement |
| Outstanding | Billing/Movements | Receivable visibility is movement-driven |
| Pledge | Customers + Scheme + Pledge Items | Loan disbursal and repayment lifecycle |

---

## 6. Validation Rules

### 6.1 Frontend Validations (Examples)

| Area | Rule | Error Condition | Typical Message |
|---|---|---|---|
| Login | Mobile + password required | Empty values | "Required" / login failure |
| Karigar | Mobile must be 10-digit (`+91` supported) | Invalid pattern | "Enter a valid 10-digit mobile" |
| Karigar | PAN pattern check | Wrong format | "Invalid PAN format" |
| Inventory Item | Gross/Net weight required | Missing or bad decimals | "Enter a valid weight" |
| Gold Pledge | Principal must be positive | <=0 | "Principal is required" / "Must be > 0" |
| Outstanding Adjustment | Notes minimum length | too short | "Notes must be at least 5 characters" |
| Invoice | At least one complete line | no valid line | "Add at least one line" |

### 6.2 Backend Validations

| Area | Rule | Error Condition | Behavior |
|---|---|---|---|
| Collections | Loan-borrower consistency | Loan borrower != selected borrower | Reject request |
| Collections | Collector assignment enforcement | Collector collecting unassigned borrower | Reject request |
| Billing | Credit note reference mandatory | Credit note without reference | Reject request |
| Billing | Reference invoice status check | Reference not issued | Reject request |
| Billing | Issue only from draft | Non-draft issue call | Reject request |
| Inventory | HUID format and uniqueness | Invalid format or duplicate HUID | Reject request |
| Karigar | Mobile/PAN normalization rules | Invalid values | Reject request |
| Lock Period | Billing blocked in locked periods | Transaction date in locked range | Reject request |

### 6.3 Business Validations

| Business Rule | Outcome |
|---|---|
| Item must be in correct stock state for issue/cancel flows | Prevents stock corruption |
| Discount affects GST recalculation | Prevents tax inconsistency |
| Balance can never go below zero in loan/account outstanding | Prevents negative due anomalies |
| Role/permission checks before sensitive actions | Prevents unauthorized cancellations/adjustments |

### 6.4 API and Permission Validation Examples

| Endpoint Type | Validation |
|---|---|
| Protected APIs | JWT required |
| Jewellery APIs | Module feature + role permissions required |
| Team management APIs | Admin/super-admin only for create/delete/toggle |
| Outstanding adjustments | Adjustment permission required |

---

## 7. User Roles & Permissions

### 7.1 Primary Roles

| Role | Typical Scope |
|---|---|
| Super Admin | Tenant/platform control |
| Admin / Owner | Full module operations |
| Manager | Supervisory operational control |
| Cashier / Salesperson | Day-to-day billing/sales operations |
| Collector | Field collections with assignment limits |
| Karigar Manager | Karigar/order-related controls |
| Pledge Officer | Gold pledge operations |
| Auditor | Read/export access for review |
| Borrower | Own portal views only |

### 7.2 Key Allowed vs Restricted Actions

| Role | Allowed (examples) | Restricted (examples) |
|---|---|---|
| Collector | Create collection entries for assigned borrowers | Borrower/loan mutation outside scope |
| Cashier | Create bills, view inventory, rate read | High-privilege admin controls |
| Manager | Billing cancel, inventory edits, reporting | Platform tenant-level actions |
| Auditor | View/export reports | Transaction mutation |
| Super Admin | Tenant user lifecycle actions | Day-level shop operations by default workflow |

### 7.3 Tenant & Branch Behavior

- Users are tenant-scoped.
- Jewellery roles are module-scoped and can be branch-scoped.
- Branch matching in permission resolution supports branch-specific operations.

---

## 8. API & System Behavior (User Perspective)

### 8.1 What Happens After User Actions

| User Action | System Behavior (Non-technical) |
|---|---|
| Save a loan collection | Loan outstanding is updated automatically |
| Edit a collection | Old totals are corrected and balance is recalculated |
| Issue a jewellery invoice | Voucher number is assigned and linked items become sold |
| Cancel invoice | Invoice status changes; stock reversal logic applies |
| Generate IRN reference | Simulated IRN data is attached and compliance warning applies |
| Add old-gold row | Deduction is applied to payable balance |
| Post outstanding adjustment | Movement is logged and party balance updates instantly |

### 8.2 Notifications / Auto Updates

- KPI screens refresh via API calls and cache invalidations after write actions.
- Billing, collections, and outstanding updates are reflected in subsequent list/detail fetches.
- Some reminder/notification integrations are partially wired and expanding in roadmap.

### 8.3 Retry & Failure Experience

- If an operation fails validation, the user sees an inline or API message.
- Failed saves do not partially commit financial records in critical transactional paths.
- Users should correct values and retry.

---

## 9. Known Limitations / Pending Areas

### 9.1 Current Limitations

| Area | Limitation |
|---|---|
| Reports UI | Some reports are functional but need richer export/table UX |
| Advanced notifications | Full omnichannel delivery orchestration still maturing |
| Multi-branch advanced controls | Core support exists; deeper governance workflows pending |
| E-invoice | Current IRN generation is reference/simulated, not full GSP legal filing |
| Placeholder routes | Some auxiliary screens are placeholders or partially wired |
| Offline-first collections | Planned; not fully implemented |

### 9.2 Temporary Workarounds

- Use existing list filters and detail screens for operational reconciliation.
- For compliance-sensitive e-invoice use cases, follow manual/legal filing flow until GSP integration is complete.
- Use role-based process controls (manager/admin review) for exceptional transactions.

---

## 10. Next Phase Planning

### 10.1 Near-Term Enhancements

| Theme | Planned Enhancement |
|---|---|
| Usability | Better pickers/search-first forms, stronger report UI, export improvements |
| Controls | Deeper module-isolated access governance and team tooling |
| Compliance | Legal e-invoice GSP integration, richer GST workflows |
| Automation | Improved reminders, approval chains, and lock-period governance |
| Analytics | Profitability, collector/karigar productivity, branch analytics |
| Reliability | Offline queue + retry sync, background processing hardening |

### 10.2 Jewellery-Specific Roadmap Highlights

- Final polish on partially wired areas (if any remain in rollout branch)
- Expanded accounts/ledger depth
- Advanced inventory tagging (barcode/RFID) and print templates
- Stronger multi-branch + audit workflows

### 10.3 Platform-Wide Roadmap

- Throttling, observability, and operational scale controls
- Better tenant onboarding and module activation UX
- More robust integrations and lifecycle automation

---

## 11. Business Scenarios & Use Cases

### 11.1 Scenario A: Field Collector Daily Routine
1. Collector logs in.
2. Opens collections due list.
3. Records payments for assigned borrowers.
4. System updates balances instantly.
5. Manager reviews daily summary at end of day.

**Best Practice:** Always verify borrower identity before posting collection.

### 11.2 Scenario B: Jewellery Counter Billing
1. Salesperson starts new invoice.
2. Selects customer and adds item via search/scan.
3. Reviews auto-calculated charges and GST.
4. Adds split payment and old-gold deduction if applicable.
5. Saves draft for manager review or issues directly based on authority.

**Common Mistake to Avoid:** Issuing invoice before verifying item, purity, and rate.

### 11.3 Scenario C: Month-End Outstanding Cleanup
1. Manager opens outstanding module.
2. Filters by ageing bucket (90+ first).
3. Reviews party movement trail.
4. Posts authorized manual adjustments with clear notes.
5. Exports/communicates reconciled positions.

**Best Practice:** Never adjust without audit note and role approval.

### 11.4 Scenario D: Karigar Lifecycle
1. Create or update karigar profile.
2. Mark inactive if no longer assignable.
3. Continue processing historical issue/receipt records.
4. Avoid duplicate karigar creation by searching first.

---

## 12. FAQ & Troubleshooting

### 12.1 Common Questions

**Q1: Why can I see records but cannot edit them?**  
A: Your role likely has read-only permissions for that feature.

**Q2: Why does a credit note ask for reference invoice?**  
A: Credit notes are legally and operationally tied to an issued invoice.

**Q3: Why did my invoice not issue?**  
A: Typical reasons are incomplete lines, stock-state mismatch, lock-period restriction, or permission limits.

**Q4: Why is a party shown overdue?**  
A: Current ageing is based on last activity date bucket logic.

**Q5: Why can’t I assign a karigar in issue form?**  
A: Inactive karigars are filtered from active assignment dropdowns.

### 12.2 Troubleshooting Steps

| Problem | Recommended Action |
|---|---|
| Validation errors on save | Check required fields, format constraints, and dependent selections |
| Permission denied message | Confirm your role and branch/module assignment with admin |
| Totals look incorrect | Recheck rates, making mode, discount inputs, and line completeness |
| Outstanding mismatch concern | Open movement detail and verify latest adjustments/payments |
| Item not found in billing | Use search with SKU/barcode/HUID and verify item is in correct status |

### 12.3 Escalation Guidance

- **Operational query:** Raise with branch manager.
- **Access issue:** Raise with system admin.
- **Compliance uncertainty (GST/e-invoice):** Escalate to finance/compliance lead before proceeding.

---

## Appendix A: Screen / Screenshot Checklist (To Capture)

1. Login screen  
2. Onboarding screen  
3. Borrower list + loan create  
4. Collections entry + history  
5. Dashboard KPI view  
6. Jewellery billing form (line items)  
7. Invoice detail (IRN panel + QR)  
8. Inventory item list + item create  
9. Karigar list + edit drawer  
10. Outstanding page + detail drawer  
11. Gold pledge create + repayment  
12. Team management + module access screens

---

## Appendix B: Key Status Enums (Business View)

| Domain | Main Status Values |
|---|---|
| Loan | Active, Closed, Overdue |
| Collection | Paid, Partial, Missed |
| Item | In Stock, Sold, Issued, Transit, Written Off |
| Invoice | Draft, Issued, Cancelled |
| Transfer | Requested, Approved, In Transit, Received, Rejected |
| Karigar Order | Booked, Metal Issued, WIP, Karigar Received, QC, Hallmarked, Ready, Delivered, Closed, Cancelled |
| Pledge Loan | Active, Renewed, Closed, Auctioned, Loss |

