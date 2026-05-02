# DK-JWL-00 — Jewellery ERP: Overview & Architecture

**Document ID:** DK-JWL-00  
**Version:** 1.0  
**Date:** 2026-05-02  
**Status:** Active  

---

## 1. Context

DigiKhaato is a modular SaaS platform. Existing modules: **Loan Management**, **Udhhar App**, **Notes**, **Library**.  
The Jewellery ERP is a new vertical module — same platform, same auth, same tenancy model, new domain tables and frontend section.

### 1.1 Platform Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + TypeScript + Tailwind + Redux Toolkit + RTK Query + Axios |
| Backend | Django + Django REST Framework + SimpleJWT |
| Database | PostgreSQL |
| Runtime | Docker Compose (split `backend/` and `frontend/`) |
| Storage | S3-compatible (item images, KYC docs, invoice PDFs) |
| Queue | Celery + Redis (Phase 2) |
| Notifications | WhatsApp Business API + SMS DLT + Amazon SES (Phase 2) |

---

## 2. Module Map (15 Sub-Modules)

| # | Module | Complexity | Phase |
|---|--------|-----------|-------|
| 1 | Billing & Sales | High | 1 |
| 2 | Stock & Inventory | High | 1 |
| 3 | Jewellery Master (Catalogue) | Medium | 1 |
| 4 | Order & Karigar Management | High | 2 |
| 5 | Accounts & Ledger | High | 2 |
| 6 | GST & Reports | High | 2 |
| 7 | Party Outstanding | Medium | 2 |
| 8 | Gold Pledge Loans | High | 2 |
| 9 | Users & Roles | Medium | 1 |
| 10 | Multi-Branch | Medium | 2 |
| 11 | Barcode / Tagging / RFID | Medium | 3 |
| 12 | MCX Live Rate | Medium | 1 |
| 13 | Notifications | Medium | 2 |
| 14 | Mobile App (PWA+ / Native) | High | 3 |
| 15 | Admin Controls | Low | 1 |

---

## 3. Architecture

### 3.1 Multi-Tenancy

Same model as existing DigiKhaato — shared schema, every table carries `tenant_id`.  
PostgreSQL Row-Level Security enforces cross-tenant isolation.

Activating Jewellery for a tenant:
1. Runs a seeder: default COA, tax slabs, item categories, roles, number series
2. Sets `feature_flags['jewellery'] = true` for that tenant

### 3.2 Django App Structure

```
backend/
  apps/
    core/          # tenants, users, auth, RBAC — existing
    loans/         # existing
    udhhar/        # existing
    jewellery/     # NEW
      apps.py
      models/
        __init__.py
        master.py       # categories, designs, metals, purities, items, tags
        inventory.py    # stock_movements, stock_takes, transfers
        billing.py      # sales_invoices, invoice_lines, payments, returns
        karigar.py      # karigars, orders, issues, receipts
        accounts.py     # COA, vouchers, bank_recon
        gst.py          # gst_filings, e_invoices, e_way_bills
        pledge.py       # gold_pledge_loans, pledge_items, repayments
        rates.py        # rates_history, tenant_rates
        notifications.py
      serializers/
      views/
      urls.py
      services/         # business logic (interest calc, tunch recon, GST prep)
      tasks.py          # Celery async tasks
      admin.py
```

### 3.3 Frontend Module Structure

```
frontend/src/
  modules/
    jewellery/
      components/
        billing/
        inventory/
        karigar/
        accounts/
        pledge/
        reports/
        shared/
      pages/           # Next.js route-mapped pages
      store/           # RTK slices + API endpoints
      hooks/
      types/
      utils/
        formulas.ts    # all business formula implementations
        validators.ts  # Zod schemas
```

### 3.4 URL Namespace

All jewellery API endpoints under `/api/jwl/v1/`.  
Frontend routes under `/jewellery/*`.

---

## 4. Security Model

| Concern | Approach |
|---------|---------|
| Auth | Same JWT (SimpleJWT) as existing system |
| RBAC | Per-module permission codes, checked in DRF permission classes |
| KYC PII | Encrypted at DB level (django-encrypted-fields); last-4 Aadhaar visible only |
| 2FA triggers | Large loan disbursal, voucher cancellation, discount > threshold |
| Audit log | Append-only `audit_log` table with hash-chain; existing pattern extended |
| Soft delete | `deleted_at` on all domain tables; 30-day trash recovery |

---

## 5. Integration with Existing Modules

| Integration Point | Details |
|-------------------|---------|
| Auth / User | Shared `users` table, same JWT flow, same login screen |
| Tenants | Shared `tenants` table; Jewellery is a feature flag on the tenant |
| RBAC | `roles` + `permissions` tables extended with jewellery permission codes |
| Notifications | Shared notification service; jewellery adds its own templates and triggers |
| Loan Management | Gold Pledge Loans (Module 8) is jewellery-specific; existing Loan module is for cash loans — they remain separate but share customer records |
| Dashboard | Global home page shows module cards — Jewellery card links to `/jewellery/dashboard` |

---

## 6. Multi-App / Multi-Role User Design

See `06-multi-role-user-system.md` for the full RBAC design.

**TL;DR:** A single user account can hold different roles in different modules.

```
User A (akash@shop.com):
  Loan Module     → Admin
  Jewellery ERP   → Manager (Branch A), Cashier (Branch B)
  Future Gym App  → Owner
```

Implemented via:
- `user_module_roles(user_id, module, role_id, branch_id)` junction table
- Module-aware permission check middleware

---

## 7. Related Documents

| Doc | File |
|-----|------|
| Phase-wise Implementation | `01-phase-wise-implementation.md` |
| Database Schema | `02-database-schema.md` |
| API Design | `03-api-design.md` |
| UI/UX Mapping | `04-ui-ux-mapping.md` |
| Integration Points | `05-integration-points.md` |
| Multi-Role User System | `06-multi-role-user-system.md` |
| AI Agent Playbook | `07-ai-agent-playbook.md` |
| Master ERP Spec | `DigiKhaato-Jewellery-ERP-COMPLETE.md` |
| Sidebar Reference | `digikhaato_jewellery_sidebar.html` |
