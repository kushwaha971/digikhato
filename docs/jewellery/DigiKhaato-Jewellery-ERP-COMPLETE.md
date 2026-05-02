# DigiKhaato — Jewellery ERP Module
## Complete Master Specification: Index · DB Schema · API · Formulas · Compliance · Glossary

**Document ID:** DK-JWL-00-COMPLETE
**Version:** 1.0 (Draft)
**Date:** 2026-05-01
**Owner:** Product / Engineering
**Platform:** digikhaato.com
**Status:** Draft for Review
**Audience:** Founders, Product Managers, Engineering Leads, Designers, QA, Compliance

---

## Context

DigiKhaato is an existing multi-module business management platform (digikhaato.com) currently serving Loan Management and Library Management use cases. This document is the **complete master specification** for the Jewellery ERP Module — a new vertical being added to the platform. It covers all 15 sub-modules, the full DB schema, the complete API surface, all business formulas, compliance requirements, and the glossary.

---

## Document Control

| Version | Date | Author | Change Summary |
|---------|------|--------|----------------|
| 0.1 | 2026-05-01 | Drafting | Initial outline |
| 1.0 | 2026-05-01 | Drafting | Complete spec — all 15 sub-modules, schema, APIs, formulas, compliance, glossary |

### Related Sub-Module Documents

Each sub-module document contains 9 chapters: PRD, FRD, BRD, Technical Spec, DB Schema, API Spec, UI/UX Spec, Formulas & Calculations, Test Cases.

- DK-JWL-01-Billing-Complete-Spec
- DK-JWL-02-Inventory-Complete-Spec
- DK-JWL-03-Jewellery-Master-Complete-Spec
- DK-JWL-04-Karigar-Complete-Spec
- DK-JWL-05-Accounts-Complete-Spec
- DK-JWL-06-GST-Reports-Complete-Spec
- DK-JWL-07-Party-Ledger-Complete-Spec
- DK-JWL-08-Gold-Pledge-Loans-Complete-Spec
- DK-JWL-09-Users-Roles-Complete-Spec
- DK-JWL-10-Multi-Branch-Complete-Spec
- DK-JWL-11-Barcode-Tagging-RFID-Complete-Spec
- DK-JWL-12-MCX-Rate-Complete-Spec
- DK-JWL-13-Notifications-Complete-Spec
- DK-JWL-14-Mobile-App-Complete-Spec
- DK-JWL-15-Admin-Controls-Complete-Spec

---

## 1. System Overview

### 1.1 Vision

Add a complete, India-first Jewellery ERP vertical to the DigiKhaato platform that manages the entire lifecycle of a jeweller's business — from raw metal procurement and karigar workflows, to retail/wholesale billing, GST-compliant invoicing, multi-branch inventory, customer relationships, gold pledge loan operations, and analytics — across web, desktop, and mobile, in multiple Indian languages, with bank-grade security and offline-tolerant operations.

### 1.2 Target Users

| User Type | Description |
|-----------|-------------|
| Retail Jewellers | Single-store and multi-store showrooms selling gold, silver, diamond, kundan, jadau, gemstone jewellery to end customers. |
| Wholesale Jewellers | Supplying retailers with metal-rate-based transactions, tunch/wastage adjustments, and party-wise ledgers. |
| Manufacturers | Order-to-delivery flows with karigar management, work-in-progress tracking, and metal/labour costing. |
| Gold Pledge / Pawn Operators | Businesses handling KYC, gold-secured loan disbursal, interest calculation, and pledge management. |
| Mixed Businesses | Most Indian jewellers run a combination of the above business types. |

### 1.3 In Scope

- Sales billing (GST, non-GST, estimate, quotation), purchase, sale-return, purchase-return.
- Inventory by metal, purity, item type, design, weight (gross/net/stone weight), tag.
- Item tagging — barcode, QR, RFID — with HUID/BIS hallmark linkage.
- Order management — custom orders, repair orders, alteration orders.
- Karigar (artisan) management — issue/receive metal, labour costing, wastage tracking.
- Customer master with KYC, photo, signature, purchase history, occasions, loyalty.
- Supplier/party master with metal-amount dual ledger (party outstanding).
- Accounts — cash book, bank book, journal, ledger, trial balance, P&L, balance sheet.
- GST — sale/purchase registers, GSTR-1, GSTR-3B, e-invoice, e-way bill data prep.
- Gold Pledge Loans — KYC, loan disbursal, simple/compound interest, top-up, foreclosure, auction. *(Separate module; integrates with existing DigiKhaato Loan Management where applicable.)*
- Multi-branch with central inventory, inter-branch transfers, branch-wise reporting.
- WhatsApp / SMS / Email integration for invoices, estimates, payment reminders, occasion greetings.
- Live MCX gold/silver rate fetch with manual override.
- Cloud backup, audit log, role-based access, multi-tenant SaaS.

### 1.4 Out of Scope (v1)

- Direct e-commerce storefront (catalogue export only).
- Direct integration with bullion exchanges for trading.
- Payroll / HRMS (basic staff master only).
- Manufacturing of bullion / refining workflows.
- Cross-border / FEMA filings.

### 1.5 Success Metrics

| Metric | Target |
|--------|--------|
| Time to create a GST-compliant tax invoice (tagged item) | < 20 seconds |
| Time to onboard a new jewellery shop (including data import) | < 2 hours |
| Inventory accuracy with RFID | ≥ 99.9% |
| Inventory accuracy with Barcode | ≥ 99.5% |
| Customer NPS | ≥ 60 |
| Crash-free sessions | ≥ 99.95% |

---

## 2. Architecture

### 2.1 High-Level Architecture

The Jewellery ERP Module runs within the existing DigiKhaato multi-tenant cloud SaaS infrastructure. It shares the same tenant/branch/user model, auth layer, notification service, and object store already in production for the Loan Management and Library modules. Jewellery-specific domain tables are added under the same `tenant_id` / `branch_id` partitioning scheme.

### 2.2 Multi-Tenancy Model

- **Isolation strategy:** Single shared database, single schema. Every domain table carries `tenant_id` and `branch_id`. Postgres Row-Level Security (RLS) policies prevent cross-tenant reads.
- **Tenant onboarding:** Activating the Jewellery module for a tenant seeds default chart of accounts, tax slabs, item categories, and roles alongside their existing DigiKhaato config.
- **Branch model:** A tenant has 1..N branches. All transactions belong to a branch. Inter-branch transfers are first-class.
- **Per-tenant config:** Theme, GSTIN, billing template, hallmarking preferences, financial-year cutover, default purity.

### 2.3 Security Model

- TLS 1.3 everywhere; HSTS; certificate pinning on mobile.
- Passwords: Argon2id; rotating refresh tokens; device-binding for mobile.
- 2FA mandatory for: admin role, gold pledge loan disburse > ₹50,000, large discounts > 5%, deletion of any voucher, ledger adjustments.
- All sensitive PII (KYC PAN/Aadhaar) encrypted at rest with column-level KMS keys, decrypted only on explicit "view KYC" with audit log entry.
- Aadhaar masking by default (last 4 digits visible).
- Audit log: append-only, immutable, hash-chained per tenant.
- Backup: hourly WAL + nightly snapshot, 35-day retention, restorable to point-in-time.
- DR: cross-region replica, 15-minute RPO, 1-hour RTO.

### 2.4 Deployment Topology

| Environment | Details |
|-------------|---------|
| Production — Primary | ap-south-1 (Mumbai) |
| Production — DR | ap-southeast-1 (Singapore) |
| Staging | Full mirror with anonymized data |
| Data Residency | Indian customers' data stays in India region |

---

## 3. Module Map — Modules 1 to 8

The Jewellery ERP Module is decomposed into 15 sub-modules. Each is a bounded context with its own services, entities, screens, and reports, but shares master tables (tenants, branches, users, items, customers) with the rest of DigiKhaato.

### Module 1 — Billing & Sales

**Purpose:** Create, print, share, and manage all sales-side documents.

- Tax invoice (GST) — B2C, B2B
- Estimate / Quotation (no tax impact)
- Non-GST bill (composition / unregistered shop scenarios)
- Sale return / credit note
- Cash memo (small ticket)
- URD (Unregistered Dealer) purchase invoicing for old gold exchange
- Multi-line items: gold piece, silver piece, diamond piece, kundan, jadau, gemstone, repair charge, making charge as line, hallmarking fee as line
- Live rate-based pricing (per-gram for gold/silver; per-piece for diamond)
- Old gold exchange (deduction line) with purity test entry
- Discounts — line-level and bill-level, percentage or absolute, with admin approval threshold
- Round-off, advance adjustment, cash + bank + UPI + card split-payment
- Print formats — A4, A5, thermal 80mm, thermal 58mm; multiple templates per tenant
- Send via WhatsApp / SMS / email with PDF + payment link (UPI deeplink)
- E-invoice generation (IRN + QR via GSP) for B2B above threshold
- E-way bill data preparation
- Bill cancellation with reason and audit trail

---

### Module 2 — Stock & Inventory

**Purpose:** Track every piece of jewellery and bulk metal across branches in real time.

- Item types — gold, silver, diamond, kundan, jadau, gemstone, imitation, coins, bars, loose stones, findings
- Bulk vs piece-rate inventory
- Multi-attribute weight: gross weight, net weight, stone weight, less weight, charge weight
- Purity tracking per item (e.g., 22K, 18K, 14K, 9K, 92.5 silver, 99.9 silver)
- Tagging — manual tag, barcode tag, QR tag, RFID tag
- HUID linkage and BIS hallmark verification
- Stock-in: from purchase, from karigar receipt, from manufacturing, from inter-branch transfer
- Stock-out: from sale, to karigar issue, to inter-branch transfer, to manufacturing, to write-off (theft/loss/breakage)
- Physical stock-take with discrepancy report
- Live valuation at current MCX rate
- Slow-moving / dead-stock report
- Item history (chain of custody from supplier → karigar → branch → customer)
- Bin/locker location per item

---

### Module 3 — Jewellery Master

**Purpose:** Maintain the catalog of items, designs, categories, and metadata.

- Category, sub-category, design master (e.g., Necklace > Choker > Antique)
- Item master with images (multi-angle), HSN/SAC, default making-charge formula, default wastage %
- Diamond 4Cs master — Cut, Color, Clarity, Carat (with grading certificate file)
- Kundan/Jadau master — stone count, stone description, polish type
- Gemstone master — type (ruby, emerald, sapphire), origin, treatment
- Coin / bar master (denomination, mint, certificate)
- Design library with images, BOM (bill of materials)
- Default print tag template per category
- Variant tracking (same design, different sizes/weights)

---

### Module 4 — Order & Karigar Management

**Purpose:** Manage custom orders end-to-end and the artisans (karigars) who fulfil them.

#### Order Status Workflow

| Stage | Status |
|-------|--------|
| 1 | Booked |
| 2 | Metal Issued to Karigar |
| 3 | Work In Progress (WIP) |
| 4 | Received from Karigar |
| 5 | Quality Control (QC) |
| 6 | Hallmarked |
| 7 | Ready for Delivery |
| 8 | Delivered |
| 9 | Closed |

#### Sub-features

- Customer order — design selection or custom design, advance, expected date
- Order cancellation with refund logic
- Karigar master — name, contact, KYC, specialization, default labour rate, default wastage %
- Issue voucher to karigar — gold/silver issued (gross weight, purity, tunch)
- Receive voucher from karigar — finished piece (gross/net/stone weight, labour, wastage actual)
- Tunch (purity) reconciliation: pure-gold-issued vs pure-gold-received
- Wastage reconciliation: allowed % vs actual %
- Karigar ledger (metal-amount dual)
- Labour bill generation per piece or bulk monthly
- Karigar advance / payment / TDS handling
- Repair / alteration order sub-flow

---

### Module 5 — Accounts & Ledger

**Purpose:** Full double-entry accounting tied to every business transaction.

- Chart of accounts — Indian COA defaults, customizable
- Voucher types — Receipt, Payment, Journal, Contra, Sales, Purchase, Credit Note, Debit Note
- Auto-voucher creation from billing, purchase, karigar receipt, gold pledge loan disbursal
- Cash book, bank book, day book
- Party-wise ledger (with metal-and-amount dual columns where applicable)
- Trial balance, P&L, balance sheet
- Bank reconciliation (manual + auto-import via statement upload CSV/MT940)
- TDS deduction and 26AS reconciliation
- Multi-currency (advanced — phase 2)
- Financial year close, opening-balance carry-forward
- Adjustment voucher with two-person approval
- Audit-locked periods

---

### Module 6 — GST & Reports

**Purpose:** Indian GST compliance plus all business intelligence reporting.

- GSTR-1 prep (B2B, B2C-L, B2C-S, exports, credit notes, HSN summary, document summary)
- GSTR-3B prep
- E-invoice generation (IRN + signed QR) via registered GSP
- E-way bill data export
- TCS on bullion (where applicable)
- Sales register, purchase register, GST register
- HSN-wise sales report (HSN 7113, 7114, 7115, 7117 etc.)
- Item-wise, party-wise, salesperson-wise, branch-wise sales
- Purity-wise stock report
- Slow-moving stock, dead stock, fast-moving
- Profitability — by item, by party, by karigar, by category
- Daily / weekly / monthly / yearly dashboards
- Exportable: PDF, Excel, CSV, JSON; schedulable email delivery

---

### Module 7 — Party Outstanding (Receivables / Payables)

**Purpose:** Manage outstanding metal AND amount with parties — uniquely jewellery-specific.

- Dual-balance ledger (metal weight in fine grams + amount)
- Per-party outstanding with ageing (0–30, 31–60, 61–90, 90+ days)
- Metal-to-amount conversion at agreed rate (bhav cut)
- Outstanding adjustment vouchers
- Reminder workflow — auto WhatsApp/SMS schedule
- Recovery dashboard
- Confirmation letter / outstanding statement printable
- Provision for bad debt

---

### Module 8 — Gold Pledge Loans

**Purpose:** Disburse gold-secured loans, accrue interest, and manage pledged ornaments as a standalone module within DigiKhaato. Designed to complement (not duplicate) the existing DigiKhaato Loan Management system — jewellery-specific pledge, purity, and ornament workflows are handled here.

- KYC capture — PAN, Aadhaar (masked), photo, signature, address proof (scanned)
- Pledge entry — multiple ornaments per loan, gross/net weight per item, purity test, photo of each piece
- Loan calculation — LTV (loan-to-value) % of pledge value at current rate; configurable per scheme
- Disbursal — cash, bank transfer, cheque, UPI; with two-person approval over threshold
- Interest schemes — simple monthly, simple daily, compound monthly, fixed-flat; per-month rates
- Top-up loan (additional disbursement on existing pledge)
- Part-release of items on partial repayment
- Renewal (interest-only, principal carried forward)
- Foreclosure with rebate calculation
- Auction / sale of forfeited pledges with profit/loss tracking
- Loss-making loan report
- Print loan agreement, pledge slip, repayment receipt
- Statutory register (where state law mandates pawn registers)

---


---

## 4. Module Map — Modules 9 to 15 (Detail)

### Module 9 — Users & Roles

**Purpose:** Authenticate users, authorize actions, manage staff lifecycle.

- User master — name, photo, contact, role assignment, branch assignment, joining date, status
- Role master — predefined (Admin, Manager, Cashier, Salesperson, Karigar Manager, Gold Pledge Officer, Auditor) plus custom roles
- Permission matrix — fine-grained per module per action (view/create/edit/delete/approve/print)
- Login methods — email + password, mobile OTP, Google SSO (optional), biometric on mobile
- 2FA enforcement per role / per action
- Session management — concurrent session limit, force-logout, device list
- Activity log per user
- Login from new device → email + WhatsApp alert
- Approval chains — discount approval, large bill approval, ledger adjustment
- Staff attendance (basic) — login as proxy attendance, manual override
- Salesperson commission rules (optional)

---

### Module 10 — Multi-Branch

**Purpose:** Operate multiple physical branches with central oversight.

- Branch master — name, address, GSTIN per branch, contact, working hours, manager
- Per-branch number series for invoices (FY-aware)
- Branch-wise inventory, transactions, ledgers, cashbooks
- Inter-branch transfer — request, approve, dispatch, in-transit, receive, reconcile
- Inter-branch sales (one branch sells from another's stock)
- Central admin dashboard rolling up all branches
- Branch comparison reports
- Per-branch tax configuration (different states → different GSTIN)
- Closure workflow (end-of-day, tray sealing, cash deposit log)

---

### Module 11 — Barcode / Tagging / RFID

**Purpose:** Physical-to-digital binding of every piece of jewellery.

- Tag master — design of tag (paper, plastic, RFID, QR sticker)
- Tag printing — bulk and on-demand, with item details, price, HUID, barcode/QR
- Tag template designer (drag-and-drop)
- Barcode formats — Code128, QR with structured payload (tenant_id|item_id|hash)
- RFID — UHF passive tags; bulk read at counter; reconciliation against expected list
- Tag verification scan (handheld) — show item, weight, last known location
- Tag re-print with audit log
- Tag query — scan any tag → full history
- Tag-to-item-to-customer lifecycle on sale (tag retained / removed)

---

### Module 12 — MCX Live Rate

**Purpose:** Always price at the right rate.

- Live MCX gold (995, 999), silver (999, 925) rate fetch every 60s during market hours
- Caching with stale-while-revalidate
- Manual rate override per branch with reason
- Rate ticker on every billing screen
- Rate history (chart + CSV export)
- Per-purity rate derivation (e.g., 22K = 91.6% of 24K rate × purity factor)
- Buy/Sell/Estimation rate (typically buy < live < sell)
- Per-tenant markup/markdown configuration
- Rate freeze for an open bill (rate locked for 15 minutes)

---

### Module 13 — Notifications (WhatsApp / SMS / Email)

**Purpose:** Reach customers and staff through preferred channels.

- WhatsApp Business Cloud API integration with approved templates
- SMS gateway integration (transactional + promotional separated)
- Email via SES with branded templates
- Triggered notifications: invoice, estimate, payment received, payment due, gold pledge loan due, EMI reminder, occasion (birthday/anniversary), order status, OTP, security alerts
- Manual broadcast — segmented (last visit, lifetime spend, occasion this month)
- Opt-out / DND compliance (TRAI)
- Delivery report tracking
- Per-tenant cost allocation
- Template library with placeholders, multi-language

---

### Module 14 — Mobile App

**Purpose:** Owner / manager / salesperson on the go.

- Owner dashboard — sales, cash, top items, exceptions
- Live rate ticker, set rate
- Quick bill (offline-tolerant) — syncs when online
- Stock check by tag scan (camera barcode/QR)
- Customer lookup, send catalog
- Karigar issue/receive
- Gold pledge loan disbursal approval push
- Push notifications
- Biometric lock; auto-lock after idle
- Offline mode for billing (queued writes, conflict resolution server-side)
- Calculator with metal/labour/GST built-in

---

### Module 15 — Admin Controls

**Purpose:** Tenant-level configuration and governance.

- Tenant profile — legal name, GSTIN, PAN, logo, address
- Financial year start, locked-period configuration
- Default purity, default labour rate, default wastage % per category
- Print template manager
- Tax slab configuration (GST 3% / 5% / 0% rules)
- Number series (per voucher type, per branch, per FY)
- Backup & restore (manual trigger, schedule)
- Data export (full tenant export — JSON + CSV — for portability)
- Audit-log viewer with filters
- Subscription / billing of the SaaS itself
- Feature flags
- Trash / recycle-bin (soft-delete recovery within 30 days)

---

## 5. Master DB Schema

All tables carry implicit columns: `id` (UUID v7, primary key), `tenant_id` (UUID, FK → tenants), `branch_id` (UUID, FK → branches, nullable for tenant-level), `created_at` (timestamptz), `updated_at` (timestamptz), `created_by` (UUID, FK → users), `updated_by` (UUID, FK → users), `deleted_at` (timestamptz, nullable for soft delete), `version` (int, optimistic concurrency).

Money columns are `numeric(18,2)`. Weight columns are `numeric(12,4)` (grams to 4 decimals). Purity is `numeric(6,3)` (e.g., 91.600 for 22K). RLS: every domain table has policy `tenant_id = current_setting('app.tenant_id')::uuid`.

---

### 5.1 Tenancy & Identity

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| tenants | name, legal_name, gstin, pan, logo_url, plan, status, country, currency, fy_start_month, locked_until_date | Top-level tenant |
| branches | tenant_id, code, name, gstin, address, state_code, phone, email, manager_user_id, is_default | Physical branches |
| users | tenant_id, email, mobile, password_hash, name, photo_url, status, two_fa_enabled | Staff accounts |
| user_branches | user_id, branch_id | M:N user ↔ branch |
| roles | tenant_id, name, description, is_system | Roles |
| permissions | code, module, action, description | Permission codes (global) |
| role_permissions | role_id, permission_code | M:N |
| user_roles | user_id, role_id | M:N |
| sessions | user_id, refresh_token_hash, device_id, ip, user_agent, expires_at, revoked_at | Active sessions |
| audit_log | tenant_id, user_id, entity, entity_id, action, before_json, after_json, ip, ts, hash, prev_hash | Hash-chained audit |

---

### 5.2 Master Data

| Table | Key Columns |
|-------|-------------|
| customers | tenant_id, code, name, mobile, email, gstin, pan, address, dob, anniversary, photo_url, kyc_status, loyalty_points |
| customer_addresses | customer_id, label, line1, line2, city, state_code, pincode, is_default |
| suppliers | tenant_id, code, name, gstin, contact, address, default_payment_terms_days |
| karigars | tenant_id, code, name, mobile, kyc_pan, kyc_aadhaar_masked, default_labour_rate, default_wastage_pct, specialization |
| categories | tenant_id, parent_id (self FK), name, hsn_code, default_making_charge_formula_id, default_wastage_pct |
| metals | code (GOLD/SILVER/PLAT), name, default_unit (gram) |
| purities | metal_code, code (24K/22K/18K/14K/9K/S999/S925), pct (numeric 6,3) |
| designs | tenant_id, category_id, code, name, image_urls (jsonb), default_weight, default_stones (jsonb), default_labour |
| items | tenant_id, branch_id, design_id, sku/barcode, huid, metal_code, purity_code, gross_wt, net_wt, stone_wt, less_wt, charge_wt, status (in_stock/sold/issued/transit), location_bin, image_urls (jsonb), tag_id, cost_price, mrp |
| diamonds | item_id (or standalone), cut, color, clarity, carat, certificate_no, certificate_lab |
| stones | item_id, type (kundan/jadau/ruby/...), count, weight_carat, description |
| tag_templates | tenant_id, name, layout_json, paper_size |
| tags | tenant_id, item_id, type (BARCODE/QR/RFID), code, printed_at, printed_by |
| tax_slabs | tenant_id, name, rate_pct, applies_to (gold/making/silver/diamond/repair), effective_from, effective_to |
| number_series | tenant_id, branch_id, voucher_type, fy, prefix, next_number, padding |

---

### 5.3 Inventory Movements

| Table | Key Columns |
|-------|-------------|
| stock_movements | tenant_id, branch_id, item_id, movement_type (PURCHASE_IN/SALE_OUT/KARIGAR_ISSUE/KARIGAR_RECEIVE/TRANSFER_OUT/TRANSFER_IN/ADJUSTMENT/WRITE_OFF/RETURN_IN/RETURN_OUT), reference_type, reference_id, qty, weight, rate, value, ts |
| stock_takes | tenant_id, branch_id, started_at, completed_at, status, conducted_by |
| stock_take_lines | stock_take_id, item_id, system_qty, system_wt, counted_qty, counted_wt, variance |
| transfers | tenant_id, from_branch_id, to_branch_id, status (REQUESTED/APPROVED/IN_TRANSIT/RECEIVED/REJECTED), dispatched_at, received_at |
| transfer_lines | transfer_id, item_id, qty, weight |

---

### 5.4 Sales & Returns

| Table | Key Columns |
|-------|-------------|
| sales_invoices | tenant_id, branch_id, voucher_no, voucher_date, customer_id, type (TAX_INVOICE/ESTIMATE/CASH_MEMO/NON_GST), gross_amount, discount_amount, taxable_amount, cgst, sgst, igst, cess, round_off, total_amount, advance_used, paid_amount, balance_amount, status (DRAFT/ISSUED/CANCELLED), e_invoice_irn, e_invoice_qr, ewb_no, place_of_supply_state_code |
| sales_invoice_lines | invoice_id, line_no, item_id (nullable), description, hsn_code, metal_code, purity_code, gross_wt, net_wt, stone_wt, rate_per_gram, metal_value, making_charge_pct, making_charge_amt, wastage_pct, wastage_amt, hallmarking_fee, stone_value, line_subtotal, gst_rate_pct, gst_amount, line_total |
| sales_invoice_payments | invoice_id, mode (CASH/UPI/CARD/BANK/CHEQUE/CREDIT/ADVANCE), reference, amount, ts |
| sale_returns | tenant_id, branch_id, voucher_no, voucher_date, original_invoice_id, customer_id, reason, refund_mode, total_amount, status |
| sale_return_lines | return_id, line_no, item_id, description, weight, rate, amount |
| old_gold_purchases | tenant_id, branch_id, voucher_no, voucher_date, customer_id, gross_wt, less_wt, net_wt, purity_tested, rate, value, mode (EXCHANGE/CASH) |

---

### 5.5 Purchases

| Table | Key Columns |
|-------|-------------|
| purchase_invoices | tenant_id, branch_id, voucher_no, voucher_date, supplier_id, gross_amount, gst, total, paid, balance, status |
| purchase_invoice_lines | invoice_id, line_no, item_id, hsn_code, metal_code, purity_code, weight, rate, value, gst_rate_pct, gst_amount, line_total |
| purchase_returns | Similar structure to sale_returns |

---

### 5.6 Karigar / Order

| Table | Key Columns |
|-------|-------------|
| customer_orders | tenant_id, branch_id, order_no, order_date, customer_id, design_id, expected_delivery, advance_amount, status |
| order_items | order_id, line_no, design_id, custom_specs_json, expected_weight, expected_amount |
| karigar_issues | tenant_id, branch_id, voucher_no, date, karigar_id, order_id (nullable), pure_gold_wt_issued, tunch_pct, gross_wt_issued, items_json |
| karigar_receipts | tenant_id, branch_id, voucher_no, date, karigar_id, issue_id, gross_wt_received, net_wt, stone_wt, pure_gold_wt_received, wastage_actual_pct, labour_amount, status |
| karigar_ledger | tenant_id, karigar_id, voucher_id, voucher_type, metal_dr, metal_cr, amount_dr, amount_cr, balance_metal, balance_amount |

---

### 5.7 Accounts

| Table | Key Columns |
|-------|-------------|
| accounts | tenant_id, code, name, type (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE), parent_id, is_group, gstin (for party accounts) |
| vouchers | tenant_id, branch_id, voucher_no, voucher_type (RECEIPT/PAYMENT/JOURNAL/CONTRA/SALES/PURCHASE/CN/DN), date, narration, status, locked |
| voucher_entries | voucher_id, line_no, account_id, debit, credit, narration |
| bank_accounts | tenant_id, account_id, bank_name, branch, account_no, ifsc, current_balance |
| bank_reconciliations | bank_account_id, statement_date, opening_balance, closing_balance, status |
| bank_recon_lines | recon_id, voucher_entry_id (nullable), statement_amount, matched, notes |

---

### 5.8 Party Outstanding

Uses the accounts system but with additional metal columns for jewellery-specific dual-balance tracking.

| Table | Key Columns |
|-------|-------------|
| party_outstanding_balances | tenant_id, party_id (customer or supplier), party_type, metal_code, fine_grams_balance, amount_balance, last_movement_at |
| party_outstanding_movements | tenant_id, party_id, party_type, voucher_id, voucher_type, metal_dr, metal_cr, amount_dr, amount_cr, rate_locked |
| outstanding_reminders | tenant_id, party_id, channel, scheduled_at, sent_at, status, message_template_id |

---

### 5.9 Gold Pledge Loans

| Table | Key Columns |
|-------|-------------|
| gold_pledge_loans | tenant_id, branch_id, loan_no, loan_date, customer_id, scheme_id, principal, interest_rate_pct_per_month, interest_method (SIMPLE/COMPOUND/FLAT/DAILY), tenure_months, ltv_pct, status (ACTIVE/RENEWED/CLOSED/AUCTIONED/LOSS) |
| pledge_items | loan_id, line_no, description, metal_code, purity_code, gross_wt, net_wt, stone_wt, photo_urls, valuation_rate, valuation_amount |
| pledge_kyc | loan_id, pan, aadhaar_masked_last4, aadhaar_token (encrypted), photo_url, signature_url, address_proof_url |
| loan_disbursals | loan_id, mode (CASH/BANK/UPI/CHEQUE), reference, amount, disbursed_by, disbursed_at, approved_by |
| loan_repayments | loan_id, date, principal_paid, interest_paid, mode, reference, items_released_json, balance_after |
| loan_top_ups | loan_id, top_up_date, additional_amount, new_principal |
| loan_renewals | loan_id, renewal_date, accrued_interest_collected, new_term_end |
| loan_auctions | loan_id, auction_date, sale_amount, expense, profit_loss, buyer_name |
| loan_schemes | tenant_id, name, ltv_pct, interest_method, interest_rate_pct, min_tenure, max_tenure, late_fee_pct |

---

### 5.10 GST & E-Invoice

| Table | Key Columns |
|-------|-------------|
| gst_filings | tenant_id, branch_id, period (YYYYMM), form (GSTR1/GSTR3B), status, generated_at, file_urls (jsonb) |
| e_invoices | invoice_id, irn, qr_payload, signed_qr_image_url, ack_no, ack_date, status |
| e_way_bills | invoice_id, ewb_no, valid_until, vehicle_no, transporter_id, status |

---

### 5.11 Notifications

| Table | Key Columns |
|-------|-------------|
| message_templates | tenant_id, code, channel (WA/SMS/EMAIL), language, body, placeholders_json, approved_template_id (Meta), category |
| messages | tenant_id, to (mobile/email), channel, template_code, payload_json, status (QUEUED/SENT/DELIVERED/FAILED), provider_message_id, cost |
| broadcasts | tenant_id, name, segment_query, template_code, scheduled_at, status, stats_json |

---

### 5.12 Rates & Misc

| Table | Key Columns |
|-------|-------------|
| rates_history | metal_code, purity_code, source, rate_per_gram, ts |
| tenant_rates | tenant_id, branch_id, metal_code, purity_code, buy_rate, sell_rate, override_at, override_by, override_reason |
| files | tenant_id, owner_user_id, kind (KYC/SIGNATURE/ITEM_IMAGE/INVOICE_PDF/...), s3_key, sha256, size, content_type |
| feature_flags | tenant_id, flag_key, value_json |
| backups | tenant_id, kind, status, started_at, completed_at, size_bytes, s3_key |
| trash | tenant_id, entity, entity_id, snapshot_json, deleted_at, deleted_by, restore_until |

---

### 5.13 Indexing & Partitioning Notes

- Hot tables (`stock_movements`, `voucher_entries`, `messages`, `audit_log`) partitioned monthly by `created_at`.
- Composite index: `sales_invoices(tenant_id, branch_id, voucher_date)`
- Composite index: `items(tenant_id, branch_id, status, design_id)`
- Composite index: `party_outstanding_balances(tenant_id, party_type, party_id)`
- Composite index: `messages(tenant_id, status, created_at)`
- GIN indexes on jsonb columns where filtered (e.g., `karigar_issues.items_json`).
- Full-text indexes on `customers.name`, `items.sku`, `designs.name`.

---

## 6. Master API Surface

### 6.1 Auth & Identity

| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/login | Email/mobile + password → tokens |
| POST | /auth/otp/request | Request mobile OTP |
| POST | /auth/otp/verify | Verify OTP → tokens |
| POST | /auth/refresh | Rotate refresh token |
| POST | /auth/logout | Revoke session |
| POST | /auth/2fa/setup | Begin TOTP enrollment |
| POST | /auth/2fa/verify | Confirm TOTP |
| GET | /me | Current user profile |
| GET | /me/sessions | Active sessions |
| DELETE | /me/sessions/:id | Revoke a session |

### 6.2 Tenant / Branch / Users / Roles

| Method | Path | Purpose |
|--------|------|---------|
| GET | /tenants/current | Read current tenant |
| PATCH | /tenants/current | Update profile / config |
| GET | /branches | List branches |
| POST | /branches | Create branch |
| PATCH | /branches/:id | Update |
| DELETE | /branches/:id | Soft-delete |
| GET | /users | List users |
| POST | /users | Invite user |
| PATCH | /users/:id | Edit |
| POST | /users/:id/disable | Disable |
| GET | /roles | List roles |
| POST | /roles | Create custom role |
| GET | /permissions | List all permission codes |
| POST | /roles/:id/permissions | Set role permissions |
| GET | /audit-log | Filterable audit log |

### 6.3 Master Data

| Method | Path | Purpose |
|--------|------|---------|
| GET | /customers | Search/list customers |
| POST | /customers | Create |
| GET | /customers/:id | Read |
| PATCH | /customers/:id | Update |
| GET | /customers/:id/ledger | Customer ledger (metal+amount) |
| POST | /customers/:id/upload-kyc | Upload KYC |
| GET | /suppliers | List/search |
| POST | /suppliers | Create |
| GET | /karigars | List/search |
| POST | /karigars | Create |
| GET | /karigars/:id/ledger | Karigar metal+amount ledger |
| GET | /categories | Tree |
| POST | /categories | Create |
| GET | /designs | Search |
| POST | /designs | Create with images |
| GET | /tax-slabs | List |
| PATCH | /tax-slabs/:id | Update (with effective date) |
| GET | /number-series | List |
| PATCH | /number-series/:id | Update |

### 6.4 Inventory

| Method | Path | Purpose |
|--------|------|---------|
| GET | /items | Search items by branch, design, status |
| POST | /items | Add item to stock |
| POST | /items/bulk | Bulk import (CSV/Excel) |
| GET | /items/:id | Read with full history |
| PATCH | /items/:id | Update |
| POST | /items/:id/print-tag | Generate tag PDF/Zebra |
| POST | /items/:id/write-off | Write-off (with reason, approval) |
| GET | /items/scan/:code | Resolve barcode/QR/RFID code |
| GET | /stock-movements | Filtered ledger of movements |
| POST | /stock-takes | Start a stock-take |
| POST | /stock-takes/:id/lines | Submit counted line |
| POST | /stock-takes/:id/complete | Finalize with variance accept |
| POST | /transfers | Create transfer request |
| POST | /transfers/:id/approve | Approve |
| POST | /transfers/:id/dispatch | Mark dispatched |
| POST | /transfers/:id/receive | Receive at destination |

### 6.5 Sales & Returns

| Method | Path | Purpose |
|--------|------|---------|
| POST | /sales/quotations | Create quotation |
| POST | /sales/quotations/:id/convert | Quotation → Invoice |
| POST | /sales/invoices | Create invoice (DRAFT) |
| POST | /sales/invoices/:id/issue | Issue (locks number, posts ledger) |
| POST | /sales/invoices/:id/cancel | Cancel with reason |
| GET | /sales/invoices/:id | Read full invoice |
| GET | /sales/invoices/:id/pdf | Download PDF |
| POST | /sales/invoices/:id/send | Send via WhatsApp/SMS/email |
| POST | /sales/invoices/:id/payment | Record payment |
| POST | /sales/invoices/:id/e-invoice | Generate IRN+QR |
| POST | /sales/invoices/:id/e-way-bill | Generate EWB |
| POST | /sales/returns | Create credit note |
| POST | /sales/old-gold-purchases | Old-gold buy-back |

### 6.6 Purchases

| Method | Path | Purpose |
|--------|------|---------|
| POST | /purchases/invoices | Create purchase |
| POST | /purchases/invoices/:id/post | Post to ledger |
| POST | /purchases/returns | Debit note |

### 6.7 Karigar / Order

| Method | Path | Purpose |
|--------|------|---------|
| POST | /orders | Create customer order |
| PATCH | /orders/:id/status | Move status |
| POST | /orders/:id/cancel | Cancel |
| POST | /karigars/issues | Issue metal to karigar |
| POST | /karigars/receipts | Receive piece from karigar |
| GET | /karigars/:id/ledger | Metal + amount ledger |
| POST | /karigars/labour-bill | Generate labour bill |

### 6.8 Accounts

| Method | Path | Purpose |
|--------|------|---------|
| GET | /accounts | COA tree |
| POST | /accounts | Create ledger |
| POST | /vouchers | Create voucher (any type) |
| POST | /vouchers/:id/post | Post |
| POST | /vouchers/:id/cancel | Cancel |
| GET | /reports/cashbook | Cashbook |
| GET | /reports/bankbook/:bank_account_id | Bankbook |
| GET | /reports/ledger/:account_id | Account ledger |
| GET | /reports/trial-balance | TB at date |
| GET | /reports/p-and-l | P&L |
| GET | /reports/balance-sheet | BS |
| POST | /bank-recon | Start recon |
| POST | /bank-recon/:id/match | Match line |

### 6.9 Party Outstanding

| Method | Path | Purpose |
|--------|------|---------|
| GET | /party-outstanding/balances | All party balances (metal+amount) |
| GET | /party-outstanding/:party_type/:party_id | Detail |
| POST | /party-outstanding/adjust | Adjustment voucher |
| POST | /party-outstanding/reminders | Schedule reminder |

### 6.10 Gold Pledge Loans

| Method | Path | Purpose |
|--------|------|---------|
| POST | /gold-pledge-loans | Create loan (KYC + pledge + valuation) |
| POST | /gold-pledge-loans/:id/disburse | Disburse cash/bank (may need approval) |
| POST | /gold-pledge-loans/:id/repay | Record repayment |
| POST | /gold-pledge-loans/:id/top-up | Top-up |
| POST | /gold-pledge-loans/:id/renew | Renew |
| POST | /gold-pledge-loans/:id/foreclose | Foreclose |
| POST | /gold-pledge-loans/:id/auction | Auction |
| GET | /gold-pledge-loans/:id/statement | Statement PDF |
| GET | /gold-pledge-loans/schemes | List schemes |

### 6.11 GST & Reports

| Method | Path | Purpose |
|--------|------|---------|
| GET | /reports/gstr-1?period=YYYYMM | GSTR-1 JSON + Excel |
| GET | /reports/gstr-3b?period=YYYYMM | GSTR-3B |
| GET | /reports/sales-register | Sales register |
| GET | /reports/purchase-register | Purchase register |
| GET | /reports/hsn-summary | HSN summary |
| GET | /reports/stock-summary | Item, purity, weight, value |
| GET | /reports/slow-moving | Slow-moving stock |
| GET | /reports/profitability | By item/party/karigar |
| GET | /reports/dashboard | KPI bundle |

### 6.12 Rates

| Method | Path | Purpose |
|--------|------|---------|
| GET | /rates/live | Latest MCX rates |
| GET | /rates/history?metal=GOLD&purity=22K | Chart data |
| POST | /rates/override | Set tenant override (with reason) |
| WS | /ws/rates | Real-time tick |

### 6.13 Notifications

| Method | Path | Purpose |
|--------|------|---------|
| GET | /messages | List messages with status |
| POST | /messages/send | Send transactional |
| GET | /templates | List templates |
| POST | /templates | Submit new template (Meta approval) |
| POST | /broadcasts | Schedule broadcast |
| GET | /broadcasts/:id/stats | Broadcast stats |

### 6.14 Files

| Method | Path | Purpose |
|--------|------|---------|
| POST | /files/presign | Get S3 presigned PUT URL |
| GET | /files/:id | Get presigned GET URL |

### 6.15 Admin

| Method | Path | Purpose |
|--------|------|---------|
| POST | /admin/backup | Manual backup |
| GET | /admin/backups | List |
| POST | /admin/restore/:backup_id | Restore (DR scenario) |
| GET | /admin/feature-flags | List feature flags |
| PATCH | /admin/feature-flags/:key | Update flag |
| POST | /admin/lock-period | Lock financial period |
| GET | /admin/trash | Soft-deleted items |
| POST | /admin/trash/:entity/:id/restore | Restore |

---

## 7. Master Formula Sheet

> All examples use illustrative values. In production, every input is read from masters (rates, slabs, charge rules) at the time the bill is issued, and the inputs are persisted on the line so historical bills don't change when masters change.

### 7.1 Gold Rate Derivation

**Inputs:** `mcx_rate_per_10g_999_inr`, `purity_pct` (e.g., 91.6 for 22K), `tenant_markup_pct` (e.g., 1.5%)

```
sell_rate_per_gram = (mcx_rate_per_10g_999_inr / 10)
                   × (purity_pct / 99.9)
                   × (1 + tenant_markup_pct / 100)
```

**Example:** MCX 999 = ₹68,500/10g; 22K purity 91.6%; markup 1.5%
- Pure-gold rate per gram: 68,500 ÷ 10 = **6,850**
- 22K base per gram: 6,850 × (91.6 ÷ 99.9) = **6,278.78**
- Sell rate with markup: 6,278.78 × 1.015 = **₹6,373/gram**

---

### 7.2 Making Charges

Three modes — pick one per item/category:

| Mode | Formula |
|------|---------|
| (a) Per-gram fixed | `making_charge = net_wt × mc_per_gram` |
| (b) % of metal value | `making_charge = metal_value × mc_pct / 100` |
| (c) Per-piece flat | `making_charge = mc_per_piece` |

**Example (b):** net_wt = 10g; rate = ₹6,373/g; metal_value = ₹63,730; mc_pct = 12%
→ making_charge = 63,730 × 0.12 = **₹7,647.60**

---

### 7.3 Wastage

```
wastage_grams  = net_wt × wastage_pct / 100
wastage_amount = wastage_grams × sell_rate_per_gram
```

**Example:** net_wt = 10g; wastage 6%; rate ₹6,373
→ wastage_grams = 0.6g; wastage_amount = **₹3,823.80**

---

### 7.4 Stone / Diamond Value

```
stone_value = sum(per_stone_assessed_value)
```

Diamonds and stones are priced per piece based on 4Cs or assessment. Persist the assessed value directly on the line.

---

### 7.5 Hallmarking Fee

```
hallmark_fee = hallmark_fee_master_per_article × articles_count
```

Commonly ₹45 per article + GST (18%). Persisted from charges master.

---

### 7.6 Line Subtotal & GST

**Standard Indian GST treatment (HSN 7113):**
- Metal value + making charge + wastage → **3% GST** (1.5% CGST + 1.5% SGST intra-state; 3% IGST inter-state)
- Hallmarking fee → **18% GST** (service)
- Diamond jewellery → **3% GST**
- Repair labour only → **5% GST**

```
line_metal_part  = metal_value + wastage_amount + making_charge
line_metal_gst   = line_metal_part × 3%   (CGST 1.5% + SGST 1.5%, or IGST 3%)
line_hallmark_gst = hallmark_fee × 18%
line_total       = line_metal_part + line_metal_gst
                 + hallmark_fee + line_hallmark_gst
                 + stone_value
```

**Example (intra-state):**
- metal_value = ₹63,730 + wastage ₹3,823.80 + making ₹7,647.60 → line_metal_part = **₹75,201.40**
- line_metal_gst = 75,201.40 × 0.03 = ₹2,256.04 (CGST ₹1,128.02 + SGST ₹1,128.02)
- hallmark_fee = ₹45; hallmark_gst = ₹8.10
- **line_total = ₹77,510.54**

---

### 7.7 Bill-Level Discount & Round-Off

```
total_taxable  = sum(line_metal_part) + sum(hallmark_fee)
discount       = bill_discount_amount  (allocated proportionally to lines)
total_gst      = sum(line GST after discount allocation)
gross_total    = total_taxable + total_gst − discount + stone_value
round_off      = round(gross_total) − gross_total
total_payable  = gross_total + round_off
```

> Discount must reduce the **taxable value** per line proportionally; GST is recomputed on the reduced base. Persist `discount_allocated` per line.

---

### 7.8 Old-Gold Exchange (Buy-Back)

```
old_gold_pure_grams = old_gross_wt × (tested_purity / 99.9)
old_gold_value      = old_gold_pure_grams × tenant_buy_rate_per_gram_999
new_bill_payable    = total_payable − old_gold_value
```

> GST note: Exchange is a separate URD purchase (no input credit). New-bill GST is computed on the full new price; exchange amount is a payment reduction, not a discount.

---

### 7.9 E-Invoice IRN Trigger (B2B)

Triggered for B2B above threshold (currently ₹5 crore aggregate — keep configurable):

1. On invoice issue → call GSP `generateIrn` with invoice JSON (per GSTN schema)
2. Receive IRN, ack number, signed QR
3. Persist on invoice; render QR on printed copy

---

### 7.10 Party Outstanding — Dual Balance

```
new_balance_metal  = old_balance_metal  + (metal_dr  − metal_cr)
new_balance_amount = old_balance_amount + (amount_dr − amount_cr)
```

**Bhav cut — convert metal balance to amount:**
```
amount_to_settle = balance_metal × agreed_rate_per_gram
```
Posting: `metal_cr = balance_metal; amount_dr = amount_to_settle`

---

### 7.11 Gold Pledge Loan — Simple Interest

```
interest  = principal × (rate_pct_per_month / 100) × months_elapsed
total_due = principal + interest
```

**Example:** ₹50,000 at 2%/month for 6 months → interest = ₹6,000 → total_due = **₹56,000**

---

### 7.12 Gold Pledge Loan — Compound Interest (Monthly)

```
total_due = principal × (1 + rate_pct_per_month / 100) ^ months_elapsed
interest  = total_due − principal
```

**Example:** ₹50,000 at 2% compounded monthly for 6 months → 50,000 × 1.02⁶ = **₹56,308**

---

### 7.13 Gold Pledge Loan — Daily Simple Interest

```
interest = principal × (rate_pct_per_month / 100) × (days_elapsed / 30)
```

**Example:** ₹50,000 at 2%/month for 47 days → **₹1,566.67**

---

### 7.14 Gold Pledge Loan — Flat Fixed Interest

```
interest = principal × flat_rate_pct / 100
```

Apportionment per month for accounting: linear over tenure.

---

### 7.15 LTV (Loan-to-Value)

```
pledge_value = sum(net_wt_pure × pure_gold_buy_rate_per_gram)  [per item]
max_loan     = pledge_value × scheme_ltv_pct / 100
```

**Example:** pledge net pure 80g; rate ₹6,278/g → pledge_value = ₹5,02,240; LTV 75% → max_loan = **₹3,76,680**

---

### 7.16 Gold Pledge Loan — Foreclosure Rebate

```
contracted_interest = interest using full tenure
accrued_interest    = interest using days_elapsed
rebate              = max(0, contracted_interest − accrued_interest) × rebate_factor
amount_due_on_close = principal + accrued_interest − rebate
```

---

### 7.17 Gold Pledge Loan — Auction P&L

```
auction_proceeds = sale_price − expenses
recoverable      = principal + accrued_interest_until_default
profit_or_loss   = auction_proceeds − recoverable
```

If positive → refund to borrower (per state law) or retain per scheme. If negative → write-off and report as loss.

---

### 7.18 Karigar Tunch & Wastage Reconciliation

```
pure_issued            = gross_issued × (issued_tunch_pct / 99.9)
pure_received_in_piece = (gross_received − stone_wt) × (final_purity_pct / 99.9)
allowed_wastage_pure   = pure_issued × allowed_wastage_pct / 100
expected_pure_received = pure_issued − allowed_wastage_pure
diff_pure              = pure_received_in_piece − expected_pure_received
```

- `diff_pure < 0` → debit karigar metal ledger (owes pure gold or equivalent at agreed rate)
- `diff_pure > 0` → credit karigar (rare)

---

### 7.19 Cash / Bank Reconciliation Match

A statement line is matched if all three conditions hold:
1. `|amount − voucher_amount| ≤ 0.01`
2. Date within ±2 days
3. Reference contains voucher_no **OR** fuzzy narration match ≥ 80%

---

### 7.20 Loyalty Points

```
points_earned      = floor(line_total × earn_rate_per_100 / 100)
points_redeemable  = min(points_balance, max_redeem_pct_of_bill × bill_amount / 100)
redeemed_value     = points_redeemable × value_per_point
```

---

## 8. Compliance Notes

### 8.1 Indian GST — Key References

| HSN | Description | GST Rate |
|-----|-------------|----------|
| 7113 | Articles of jewellery and parts (gold/silver/platinum) | 3% |
| 7114 | Articles of goldsmiths'/silversmiths' wares | 3% |
| 7117 | Imitation jewellery | 3% |
| 7102 | Diamonds (rough/cut, without setting) | 0.25% |
| — | Making charge (bundled with article) | 3% (follows principal supply) |
| — | Repair-only labour (no metal) | 5% (job-work) |
| — | Hallmarking fee | 18% (service) |
| — | TCS on bullion | 0.1% (configurable) |

> **Disclaimer:** GST rules change. Treat the above as defaults; the platform must let the tenant configure rates with effective-date versioning. Surface a clear note for the tenant's CA to verify before go-live.

- E-invoice (IRN+QR) currently mandatory for B2B above ₹5 crore aggregate turnover (keep threshold configurable).
- E-way bill mandatory above value thresholds for inter-state movement.

### 8.2 BIS Hallmarking & HUID

- Mandatory hallmarking applies to gold ornaments in notified districts.
- HUID (6-character alphanumeric) is the unique ID per article.
- Verify HUID via BIS lookup at item-master entry; allow override + capture certificate image.
- Print HUID on tag and invoice line.
- Maintain article-wise hallmarking-fee accounting separately for clean reporting.

### 8.3 MCX Rate Sourcing

- Source must be a documented, contractually-licensed feed (MCX itself or a licensed redistributor).
- Cache 60 seconds; serve stale ≤ 5 minutes with a "stale" flag in UI.
- Outside market hours: freeze at last close; tenant manual override allowed with reason captured.

### 8.4 Data Privacy (DPDP Act 2023)

- KYC documents, photos, signatures = **sensitive personal data**.
- Purpose limitation: KYC used only for gold pledge loans, customer onboarding, and statutory reporting.
- Right to erasure: honour deletion requests within 30 days, retaining only what statutory law mandates (tax records 8 years; pawn registers per state).
- Cross-border transfer disabled by default; data residency in India region.

### 8.5 TRAI / Telecom — Notifications

- WhatsApp/SMS templates must be pre-approved by Meta / DLT registered.
- Maintain consent and DND lists.
- Promotional sends: 09:00–21:00 IST only. Transactional: 24×7.
- Each broadcast logs the consent basis.

### 8.6 Pawn / Money-Lending

- Several Indian states require licensure and state-format pawn registers (e.g., Bombay Money-Lenders Act, Tamil Nadu Pawnbrokers Act).
- The platform exposes a **per-state register template** that the tenant prints and binds physically.
- Interest-rate caps where mandated by state law are enforceable as scheme constraints.

---

## 9. Glossary

| Term | Meaning |
|------|---------|
| Karigar | Artisan / goldsmith who converts metal into ornaments under contract |
| Tunch | Purity / fineness of gold expressed in percentage (e.g., 91.6 for 22K) |
| Wastage | Notional loss of metal during making, charged to the customer |
| Party Outstanding | Outstanding receivable/payable tracked in both metal weight and amount |
| Gold Pledge Loan | Pawn / pledge — gold-secured loan |
| Jama | "Credit" / deposit entry in a pledge/outstanding ledger |
| Bhav | Rate/price (metal market rate) |
| Bhav cut | Settlement of a metal balance into amount at an agreed rate |
| Kundan | Traditional Indian glass-set jewellery technique with 24K foil |
| Jadau | Stone-set jewellery (typically uncut diamonds/polki) |
| Polki | Uncut natural diamond used in jadau |
| Hallmark / HUID | BIS purity certification + 6-char unique ID per article |
| MCX | Multi Commodity Exchange (Mumbai) — reference for live bullion rates |
| MRP item | Item billed at fixed printed price (no per-gram calculation) |
| LTV | Loan-to-Value — ratio of loan amount to pledge value |
| IRN | Invoice Reference Number issued by GSTN for e-invoices |
| HUID | Hallmark Unique Identification — 6-char alphanumeric per gold article |
| DLT | Distributed Ledger Technology platform for TRAI SMS registration |

---

*End of DK-JWL-00-API-FORMULAS | Version 1.0 | 2026-05-01*
*Confidential — For Internal Use Only | digikhaato.com*

---

*End of DK-JWL-00-COMPLETE  |  Version 1.0  |  2026-05-01*
*Confidential — For Internal Use Only  |  digikhaato.com*
