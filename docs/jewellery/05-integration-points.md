# DK-JWL-05 — Integration Points with Existing System

**Document ID:** DK-JWL-05  
**Version:** 1.0  
**Date:** 2026-05-02  

---

## Overview

The Jewellery ERP is a **new Django app** (`apps/jewellery`) added to the existing monorepo. It shares infrastructure but has no hard code-level coupling to existing modules. Integration happens through shared tables, shared services, and shared UI primitives.

---

## 1. Authentication & User System

### How it integrates

The jewellery module uses the **same `core.User` model, JWT tokens, and auth endpoints** as the existing Loan/Udhhar apps.

- No new login screen — `/login` is shared
- `request.user` in jewellery views is the same Django User object
- JWT payload is extended with jewellery-specific claims only in Phase 1 if needed (e.g., `active_branch_id`)

### Changes required

```python
# core/models.py — add jewellery permission codes to existing permission registry
JEWELLERY_PERMISSIONS = [
    'jwl.billing.view', 'jwl.billing.create', 'jwl.billing.cancel',
    'jwl.inventory.view', 'jwl.inventory.edit',
    'jwl.karigar.view', 'jwl.karigar.manage',
    'jwl.pledge.view', 'jwl.pledge.disburse', 'jwl.pledge.approve',
    'jwl.accounts.view', 'jwl.accounts.post',
    'jwl.reports.view', 'jwl.reports.export',
    'jwl.admin.manage',
]
```

No changes to the auth flow or JWT structure. The `UserModuleRole` table (see `06-multi-role-user-system.md`) maps users to jewellery roles separately.

---

## 2. Tenant Model

### How it integrates

Shared `core.Tenant` model. The jewellery app adds a feature flag to enable the module per tenant.

```python
# Feature flag check in jewellery views
class JewelleryFeatureGuard(BasePermission):
    def has_permission(self, request, view):
        flags = request.tenant.feature_flags or {}
        return flags.get('jewellery', False)
```

### Activation flow

When a tenant subscribes to Jewellery ERP:
1. Set `tenant.feature_flags['jewellery'] = True`
2. Run `seed_jewellery_defaults(tenant_id)` management command:
   - Seed default metals, purities, COA, tax slabs, number series, roles

---

## 3. Branch Model

Jewellery uses the **same `core.Branch` model**. No duplication.

Jewellery-specific branch config (GSTIN per branch, FY start, working hours) is stored in a `JewelleryBranchConfig` model with a OneToOne FK to `Branch` — keeps the core model clean.

```python
class JewelleryBranchConfig(models.Model):
    branch      = models.OneToOneField('core.Branch', on_delete=models.CASCADE, related_name='jwl_config')
    gstin       = models.CharField(max_length=15, blank=True)
    fy_start    = models.CharField(max_length=5, default='04-01')  # MM-DD
    state_code  = models.CharField(max_length=2, blank=True)
```

---

## 4. Customer Records

**Problem:** The same person might be a borrower in Loan Management AND a jewellery customer.

**Solution:** Jewellery has its own `jewellery.Customer` model, **but** includes an optional `loan_borrower` FK:

```python
class Customer(JewelleryBaseModel):
    # ... fields ...
    loan_borrower = models.ForeignKey(
        'loans.Borrower', on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Link to Loan Management borrower if the same person"
    )
```

This allows:
- Independent customer records (most cases)
- Cross-referencing when the same person uses both modules
- Future unified customer identity without a big bang refactor

---

## 5. Notifications Service

### Existing system

The existing system has basic notification plumbing. Phase 2 of Jewellery adds full notification support.

### Integration plan

1. Extend shared `notifications` app (or create `jewellery.notifications` sub-module)
2. Jewellery-specific triggers register as **signal handlers** on jewellery model events:

```python
# apps/jewellery/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=SalesInvoice)
def on_invoice_issued(sender, instance, **kwargs):
    if instance.status == 'ISSUED':
        notify_customer_invoice.delay(instance.id)   # Celery task

@receiver(post_save, sender=GoldPledgeLoan)
def on_loan_due_check(sender, instance, **kwargs):
    # scheduled by Celery beat, not on save
    pass
```

3. WhatsApp templates for jewellery are seeded separately: `jwl_invoice_sent`, `jwl_payment_due`, `jwl_pledge_due`, `jwl_order_ready`

---

## 6. Frontend: Global Navigation

### Dashboard / Home

The global home page shows module cards. A **Jewellery ERP card** is added:

```tsx
// frontend/src/modules/home/components/ModuleGrid.tsx
const modules = [
  { key: 'loans', label: 'Loan Management', icon: '₹', href: '/loans' },
  { key: 'udhhar', label: 'Udhhar', icon: '📒', href: '/udhhar' },
  { key: 'jewellery', label: 'Jewellery ERP', icon: '💎', href: '/jewellery',
    featureFlag: 'jewellery' },
]
```

The card is rendered only when `tenant.feature_flags.jewellery === true`.

### Sidebar / Navigation

The existing global sidebar gets a new "Jewellery" section that expands into the 15-module sub-navigation (using the sidebar reference HTML as the design template).

---

## 7. Shared RTK Query Configuration

The jewellery frontend slice extends the existing `apiSlice` base:

```ts
// src/modules/jewellery/store/jewelleryApi.ts
import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '@/lib/axiosBaseQuery'  // existing shared utility

export const jewelleryApi = createApi({
  reducerPath: 'jewelleryApi',
  baseQuery: axiosBaseQuery({ baseUrl: '/api/jwl/v1' }),
  tagTypes: ['Item', 'Invoice', 'PledgeLoan', 'Customer', 'Rate', 'Order'],
  endpoints: () => ({}),
})
```

This keeps jewellery API state isolated from the loans/udhhar state while reusing the auth/axios setup.

---

## 8. Loan Management ↔ Gold Pledge Loans

These are **two separate modules** that serve different purposes:

| | Loan Management (existing) | Gold Pledge Loans (jewellery) |
|---|---|---|
| Purpose | Cash loans for rural borrowers | Gold-secured pawn/pledge operations |
| Collateral | None (unsecured) | Physical gold ornaments |
| Interest model | Daily EMI | Monthly simple/compound/flat |
| KYC | Basic | Full PAN/Aadhaar/photo/signature |
| Repayment | Daily collection | Bullet/part-release |

They are intentionally kept separate. The shared element is the **user/customer identity** (the `loan_borrower` FK on `jewellery.Customer` noted in section 4).

---

## 9. Audit Log

The existing `audit_log` table is extended to cover jewellery entities:

```python
# Both existing and jewellery modules write to the same audit_log
# Differentiated by entity field: 'loans.Loan' vs 'jewellery.SalesInvoice'
AuditLog.objects.create(
    tenant=request.tenant,
    user=request.user,
    entity='jewellery.SalesInvoice',
    entity_id=invoice.id,
    action='CANCEL',
    before_json=before_state,
    after_json=after_state,
    ip=get_client_ip(request),
)
```

The audit log viewer in Admin Controls shows events from all modules filtered by entity prefix.

---

## 10. Docker / Deployment

No changes to `docker-compose.yml` structure needed. The jewellery app is just another Django app in the same container.

Phase 2 additions (Celery for notifications/tasks):
```yaml
# backend/docker-compose.yml additions
  celery-worker:
    build: .
    command: celery -A config worker -l info
    depends_on: [db, redis]

  celery-beat:
    build: .
    command: celery -A config beat -l info
    depends_on: [db, redis]

  redis:
    image: redis:7-alpine
```

---

## 11. Migration Safety

- Jewellery migrations are in `apps/jewellery/migrations/` — completely separate from `loans/`, `core/` migrations
- Running `python manage.py migrate` will apply all app migrations in dependency order
- Zero-downtime: new tables are additive; no existing table columns are modified
- Rollback: `python manage.py migrate jewellery zero` drops all jewellery tables safely
