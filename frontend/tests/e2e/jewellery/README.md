# Jewellery ERP — E2E Automation Framework

Production-grade Playwright framework for DigiKhaato Jewellery ERP covering Phase 1 + Phase 2.

## Quick Start

```bash
cd frontend

# Headless (CI)
npm run test:jwl

# Visible browser (watch live)
npm run test:jwl:headed

# Playwright UI mode (recommended for development)
npm run test:jwl:ui

# Debug mode (step-through with Inspector)
npm run test:jwl:debug

# Slow motion (600ms between actions — great for demos)
npm run test:jwl:slow

# Run only smoke tests (fast check)
npm run test:jwl:smoke

# Smoke tests with visible browser
npm run test:jwl:smoke:headed

# Tablet project only
npm run test:jwl:tablet

# Tablet project with visible browser
npm run test:jwl:tablet:headed

# API-only tests (no browser)
npm run test:jwl:api

# Billing suite
npm run test:jwl:billing

# Open report
npm run test:jwl:report
```

## Prerequisites

Both servers must be running before executing tests:
- **Backend:** `http://localhost:8001` (Django)
- **Frontend:** `http://localhost:3050` (Next.js dev server)

The seeded admin user (`9999999999`) must exist with:
- `role: admin`
- `feature_flags.jewellery: true`
- At least GOLD metal + 22K purity seeded via `seed_jewellery_defaults`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `E2E_BASE_URL` | `http://localhost:3050` | Frontend URL |
| `E2E_API_BASE_URL` | `http://localhost:8001/api` | Backend API URL |
| `E2E_ADMIN_MOBILE` | `9999999999` | Jewellery admin mobile |
| `E2E_SUPERADMIN_MOBILE` | `9794620535` | Platform superadmin |
| `HEADED` | `false` | Set `true` for visible browser |
| `SLOWMO` | `0` | Milliseconds between actions |

## Test Suites

| File | Tags | Description |
|------|------|-------------|
| `01-auth.spec.ts` | `@smoke @auth` | Login, session, guards |
| `02-customers.spec.ts` | `@smoke @customers` | Customer CRUD, search, validation |
| `03-inventory.spec.ts` | `@smoke @inventory` | Item create, scan, write-off |
| `04-billing.spec.ts` | `@smoke @billing` | Full invoice lifecycle |
| `05-outstanding.spec.ts` | `@outstanding` | Adjustments, pagination |
| `06-karigar.spec.ts` | `@karigar` | Karigar management |
| `07-gold-pledge.spec.ts` | `@pledge` | Loan create lifecycle |
| `08-transfers.spec.ts` | `@transfers` | Full transfer workflow |
| `09-accounts.spec.ts` | `@accounts` | COA, vouchers, trial balance |
| `10-reports.spec.ts` | `@reports` | GST reports, sales register |
| `11-admin-rates.spec.ts` | `@admin @rates` | Rates, admin controls |
| `12-tenant-isolation.spec.ts` | `@security @isolation` | Cross-tenant security |

## Framework Structure

```
tests/e2e/jewellery/
├── fixtures/
│   └── index.ts        # Custom fixtures (admin session, master refs, fresh item)
├── helpers/
│   ├── api.ts          # Backend API calls (login, CRUD helpers)
│   └── ui.ts           # Browser interaction helpers
├── pages/              # Page Object Models
│   ├── LoginPage.ts
│   ├── BillingPage.ts
│   ├── CustomersPage.ts
│   ├── InventoryPage.ts
│   ├── OutstandingPage.ts
│   └── AdminPage.ts
├── suites/             # Test files
│   ├── 01-auth.spec.ts
│   ├── 02-customers.spec.ts
│   ├── ...
│   └── 12-tenant-isolation.spec.ts
└── README.md
```

## Viewing Reports

After a run:
```bash
npm run test:jwl:report
# Opens http://localhost:9323 with full HTML report
```

Traces (on failure) are in `test-results/jwl/`.

To open a specific trace:
```bash
npx playwright show-trace test-results/jwl/<test-name>/trace.zip
```

## Coverage Map

| Phase | Feature | UI | API |
|-------|---------|-----|-----|
| P1 | Authentication | ✅ | ✅ |
| P1 | Customer CRUD | ✅ | ✅ |
| P1 | Inventory CRUD | ✅ | ✅ |
| P1 | Item scan (barcode/HUID) | — | ✅ |
| P1 | Item write-off | — | ✅ |
| P1 | Gold rates | ✅ | ✅ |
| P1 | Billing — draft/issue/cancel | ✅ | ✅ |
| P1 | Invoice — GST split calculation | — | ✅ |
| P1 | Invoice — old gold deduction | — | ✅ |
| P1 | Invoice — split payment | — | ✅ |
| P1 | Karigar management | ✅ | ✅ |
| P1 | Gold pledge loan | ✅ | ✅ |
| P1 | Admin controls | ✅ | ✅ |
| P2 | Credit note creation | ✅ | ✅ |
| P2 | Estimate → Invoice convert | ✅ | ✅ |
| P2 | Party outstanding | ✅ | ✅ |
| P2 | Outstanding adjustments | ✅ | — |
| P2 | Movement pagination | ✅ | ✅ |
| P2 | Transfer lifecycle | — | ✅ |
| P2 | Transfer register | ✅ | — |
| P2 | GST Reports (GSTR-1/3B) | ✅ | ✅ |
| P2 | Sales Register | ✅ | — |
| P2 | Accounts & Ledger (COA) | ✅ | ✅ |
| P2 | Vouchers + posting | — | ✅ |
| P2 | Trial balance | ✅ | ✅ |
| P2 | Multi-branch overview | ✅ | — |
| P2 | Barcode/RFID page | ✅ | — |
| P2 | Tenant isolation | — | ✅ |
| P2 | Security (unauth, invalid token) | ✅ | ✅ |
