# DK-JWL-01 — Phase-wise Implementation Plan

**Document ID:** DK-JWL-01  
**Version:** 1.0  
**Date:** 2026-05-02  

---

## Overview

Implementation is split into three phases. Each phase is independently shippable and adds value progressively.

| Phase | Theme | Duration (est.) | Modules |
|-------|-------|-----------------|---------|
| Phase 1 | Core Shop Operations | 8–10 weeks | Jewellery Master, Inventory, Billing (basic), MCX Rate, Users/Roles, Admin |
| Phase 2 | Full Business Operations | 10–12 weeks | Karigar, Accounts, GST, Party Outstanding, Gold Pledge Loans, Multi-Branch, Notifications |
| Phase 3 | Advanced / Scale | 6–8 weeks | Barcode/RFID, Mobile PWA enhancements, Advanced Analytics, E-invoice GSP, Offline mode |

---

## Phase 1 — Core Shop Operations

**Goal:** A jeweller can onboard, manage their catalogue and stock, create basic bills, and track inventory.

### Backend Tasks

#### 1.1 Django App Bootstrap
- [ ] Create `jewellery` Django app under `backend/apps/`
- [ ] Register in `INSTALLED_APPS`
- [ ] Add URL namespace `/api/jwl/v1/`
- [ ] Create base model mixin: `TenantBranchModel` (adds `tenant_id`, `branch_id`, `created_at`, `updated_at`, `created_by`, `deleted_at`, `version`)
- [ ] Extend `feature_flags` for jewellery activation per tenant

#### 1.2 Jewellery Master (Module 3)
- [ ] Models: `Metal`, `Purity`, `Category` (tree), `Design`, `TagTemplate`, `TaxSlab`, `NumberSeries`
- [ ] CRUD APIs for all master entities
- [ ] Seed command: default metals (GOLD/SILVER/PLAT), purities, COA, number series
- [ ] HSN code defaults per category

#### 1.3 Item (Inventory) Master (Module 2 — Part)
- [ ] Model: `Item` (all weight columns, purity, design FK, barcode/HUID/QR, status, location_bin)
- [ ] Model: `Diamond`, `Stone` (linked to item)
- [ ] APIs: CRUD, scan-by-code, bulk-import CSV, tag-print endpoint stub
- [ ] `StockMovement` model — records every stock-in/out event
- [ ] Inventory summary API: purity-wise, category-wise

#### 1.4 MCX Live Rate (Module 12)
- [ ] Model: `RateHistory`, `TenantRate`
- [ ] Rate derivation utility (formula 7.1 in master spec)
- [ ] `GET /api/jwl/v1/rates/live` — returns cached rate
- [ ] `POST /api/jwl/v1/rates/override` — per-tenant override
- [ ] Rate polling background task (60s refresh, Celery beat) — Phase 1 uses simple API call; Celery in Phase 2
- [ ] WebSocket endpoint stub (`/ws/jwl/rates/`) for Phase 2

#### 1.5 Basic Billing (Module 1 — Core)
- [ ] Models: `SalesInvoice`, `SalesInvoiceLine`, `SalesInvoicePayment`
- [ ] Models: `OldGoldPurchase`
- [ ] Invoice formula engine in `services/billing.py`: rate derivation, making charge, wastage, GST split, round-off
- [ ] APIs: create draft, issue, cancel, get, PDF (via WeasyPrint/ReportLab)
- [ ] Number series auto-increment service
- [ ] Estimate/Quotation type support (no tax posted to ledger)
- [ ] Multi-payment mode recording
- [ ] Old gold deduction line

#### 1.6 Users & Roles (Module 9 — Phase 1)
- [ ] Extend existing `Role` and `Permission` models with jewellery permission codes
- [ ] Model: `UserModuleRole(user, module_code, role, branch)` — for cross-module RBAC
- [ ] `JewelleryPermission` DRF permission class
- [ ] Predefined roles seeded: Admin, Manager, Cashier, Salesperson
- [ ] API: list/create/update roles, assign permissions, assign user→role

#### 1.7 Admin Controls (Module 15 — Phase 1)
- [ ] Tenant profile endpoints (GSTIN, PAN, logo, FY start)
- [ ] Tax slab configuration with effective dates
- [ ] Number series per voucher type per branch
- [ ] Feature flag management
- [ ] Soft-delete trash + restore APIs

---

### Frontend Tasks

#### 1.8 Module Shell
- [ ] Add `/jewellery` route tree in Next.js
- [ ] Sidebar component (based on `digikhaato_jewellery_sidebar.html` reference — proper React, not static HTML)
- [ ] Module card on global home/dashboard
- [ ] RTK Query base API slice: `jewelleryApi` with base URL `/api/jwl/v1/`
- [ ] Auth guard: check `feature_flags.jewellery` before rendering module

#### 1.9 Jewellery Master UI
- [ ] Category tree management page
- [ ] Design library: grid view, image upload, BOM fields
- [ ] Metal/Purity read-only list (admin-seeded)
- [ ] Tax slab editor
- [ ] Number series editor

#### 1.10 Inventory UI
- [ ] Item list page: filter by branch, category, purity, status
- [ ] Item add/edit form: all weight fields, purity selector, HUID, barcode
- [ ] Scan-to-lookup: camera QR/barcode scan (Phase 1: manual entry fallback)
- [ ] Stock movement history drawer
- [ ] Inventory summary cards (total items, weight by purity, value at MCX rate)

#### 1.11 Billing UI
- [ ] Invoice creation page: customer search, line item builder with rate auto-fill
- [ ] Line item types: gold piece, silver piece, repair, making charge, hallmarking fee
- [ ] Old gold exchange deduction section
- [ ] GST split preview (CGST/SGST/IGST)
- [ ] Multi-payment mode split UI
- [ ] Estimate type toggle (no GST posted)
- [ ] Invoice list, detail view, PDF download button
- [ ] Cancel invoice with reason modal

#### 1.12 MCX Rate Widget
- [ ] Global rate ticker bar (top of jewellery pages)
- [ ] Rate override form (admin only)
- [ ] Rate history mini-chart

---

## Phase 2 — Full Business Operations

**Goal:** Complete end-to-end jeweller operations including karigar workflows, accounting, GST, gold pledge loans.

### Backend Tasks

#### 2.1 Order & Karigar (Module 4)
- [ ] Models: `Karigar`, `CustomerOrder`, `OrderItem`, `KarigarIssue`, `KarigarReceipt`, `KarigarLedger`
- [ ] 9-stage order status machine with transition validation
- [ ] Tunch/wastage reconciliation service (formula 7.18)
- [ ] Labour bill generation
- [ ] Karigar advance/payment/TDS handling
- [ ] Repair/alteration sub-flow

#### 2.2 Accounts & Ledger (Module 5)
- [ ] Models: `Account` (COA tree), `Voucher`, `VoucherEntry`, `BankAccount`, `BankReconciliation`
- [ ] Double-entry posting service: every billing/purchase/karigar event creates voucher entries
- [ ] Trial balance, P&L, Balance Sheet computation APIs
- [ ] Bank reconciliation (manual match + CSV import)
- [ ] Financial year close workflow
- [ ] Two-person approval for adjustment vouchers

#### 2.3 GST & Reports (Module 6)
- [ ] GSTR-1 JSON builder (B2B, B2C-L, B2C-S, HSN summary)
- [ ] GSTR-3B computation
- [ ] E-invoice IRN generation (GSP integration — configurable endpoint)
- [ ] E-way bill data export
- [ ] Sales register, purchase register, HSN-wise report
- [ ] Profitability report by item/party/karigar
- [ ] PDF/Excel/CSV export endpoints

#### 2.4 Party Outstanding (Module 7)
- [ ] Models: `PartyOutstandingBalance`, `PartyOutstandingMovement`, `OutstandingReminder`
- [ ] Dual-balance update service (metal + amount, formula 7.10)
- [ ] Bhav-cut settlement voucher
- [ ] Ageing report
- [ ] Auto-reminder scheduling

#### 2.5 Gold Pledge Loans (Module 8)
- [ ] Models: `GoldPledgeLoan`, `PledgeItem`, `PledgeKYC`, `LoanDisbursal`, `LoanRepayment`, `LoanTopUp`, `LoanRenewal`, `LoanAuction`, `LoanScheme`
- [ ] Interest calculation service: Simple / Compound / Daily / Flat (formulas 7.11–7.14)
- [ ] LTV calculator (formula 7.15)
- [ ] Foreclosure rebate (formula 7.16)
- [ ] Auction P&L (formula 7.17)
- [ ] KYC upload + encrypted PAN/Aadhaar storage
- [ ] Two-person approval for disbursals above threshold
- [ ] Loan statement PDF, pledge slip print
- [ ] Per-state register template stub

#### 2.6 Multi-Branch (Module 10)
- [ ] `Branch` model extensions: per-branch GSTIN, number series, working hours
- [ ] Inter-branch transfer workflow (Request → Approve → Dispatch → Receive)
- [ ] Branch-wise ledger partitioning in all report APIs
- [ ] Central admin roll-up dashboard

#### 2.7 Notifications (Module 13)
- [ ] Celery + Redis setup
- [ ] Models: `MessageTemplate`, `Message`, `Broadcast`
- [ ] WhatsApp Business Cloud API integration
- [ ] SMS DLT gateway integration
- [ ] Amazon SES email
- [ ] Event triggers: invoice sent, payment due, pledge loan due, order status
- [ ] Broadcast with segment query
- [ ] DND/opt-out compliance (TRAI)
- [ ] Delivery report webhook

---

### Frontend Tasks

#### 2.8 Karigar UI
- [ ] Karigar master list/add/edit
- [ ] Order creation wizard (customer → design → advance → karigar assignment)
- [ ] Order kanban view (9 status stages)
- [ ] Issue/Receive metal voucher forms
- [ ] Tunch reconciliation summary panel
- [ ] Karigar ledger view

#### 2.9 Accounts UI
- [ ] COA tree editor
- [ ] Voucher entry form (manual journal)
- [ ] Cash/Bank book list with filters
- [ ] Trial balance page
- [ ] P&L and Balance Sheet pages
- [ ] Bank reconciliation screen

#### 2.10 GST & Reports UI
- [ ] GSTR-1 / GSTR-3B preview + download
- [ ] Sales/purchase register with filters + export
- [ ] Report builder: date range, branch, category filters
- [ ] Dashboard with KPI cards (daily sales, top items, outstanding)

#### 2.11 Gold Pledge Loans UI
- [ ] New loan flow: KYC → Pledge Items → Valuation → Scheme → Disbursal
- [ ] Active loans list with interest accrual preview
- [ ] Repayment recording form
- [ ] Loan detail: timeline, pledge items, interest history
- [ ] Foreclosure/auction flow
- [ ] Loan statement PDF download

#### 2.12 Party Outstanding UI
- [ ] Outstanding table: metal balance + amount balance, ageing columns
- [ ] Bhav-cut settlement form
- [ ] Send reminder action

---

## Phase 3 — Advanced / Scale

**Goal:** Physical tagging, mobile-native enhancements, RFID, advanced analytics, production hardening.

### Backend Tasks

- [ ] RFID bulk read endpoint (receive tag list, reconcile against expected)
- [ ] Tag template designer API (JSON layout)
- [ ] Zebra/SATO label print API
- [ ] Offline write queue: client sends batched mutations, server resolves conflicts
- [ ] Rate WebSocket real-time (Redis pub/sub → Django Channels)
- [ ] Advanced loyalty points engine
- [ ] Multi-currency support (Phase 3+)
- [ ] Performance: partition large tables (`stock_movements`, `audit_log`) by month
- [ ] DR drill runbook implementation

### Frontend Tasks

- [ ] Camera-based QR/barcode scanner component (Phase 1 was manual)
- [ ] Tag template designer UI (drag-and-drop)
- [ ] Bulk tag print UI
- [ ] RFID reconciliation screen
- [ ] Offline-first billing (service worker queue, sync on reconnect)
- [ ] PWA install prompt and push notification setup
- [ ] Owner dashboard mobile view: real-time rate, today's sales, alerts

---

## Definition of Done (per Phase)

| Gate | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| Models + migrations | ✅ Required | ✅ Required | ✅ Required |
| DRF APIs tested (unit) | ✅ Required | ✅ Required | ✅ Required |
| Frontend CRUD flows | ✅ Required | ✅ Required | ✅ Required |
| Formula unit tests | ✅ Required | ✅ Required | ✅ Required |
| Multi-tenant isolation test | ✅ Required | ✅ Required | ✅ Required |
| GST compliance | — | ✅ Required | — |
| Load test (1k concurrent) | — | — | ✅ Required |

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| GSP for e-invoice is a 3rd-party dependency | Use mock GSP in Phase 2; real integration in Phase 3 |
| MCX rate feed licensing | Phase 1: manual override only; Phase 2: paid MCX feed or licensed redistributor |
| RFID hardware compatibility | Phase 3 — test with Zebra and Impinj before committing API contract |
| KYC PII compliance (DPDP 2023) | Implement column-level encryption before Gold Pledge goes live |
| Double-entry accounting correctness | Mandatory: accounting-specific unit tests for every auto-voucher path |
