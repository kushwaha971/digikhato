# DK-JWL-06 — Multi-Role / Multi-App User System

**Document ID:** DK-JWL-06  
**Version:** 1.0  
**Date:** 2026-05-02  

---

## The Problem

A single user on DigiKhaato can interact with multiple modules in different capacities:

```
User A (akash@shop.com):
  Loan Module     → Admin (can do everything)
  Jewellery ERP   → Cashier (Branch A only)
  Future Gym App  → Owner

User B (collector@shop.com):
  Loan Module     → Collector
  Jewellery ERP   → Salesperson (Branch A + Branch B)
```

The current system has a simple role attached to the user at the tenant level. This doesn't scale to multi-module, multi-branch scenarios.

---

## Solution: Module-Scoped Role Assignments

### Core Design

Introduce a `UserModuleRole` table that maps:
`user × module × role × branch (optional)`

```python
# apps/core/models.py (extend existing)

class ModuleCode(models.TextChoices):
    LOANS      = 'loans',      'Loan Management'
    UDHHAR     = 'udhhar',     'Udhhar App'
    JEWELLERY  = 'jewellery',  'Jewellery ERP'
    GYM        = 'gym',        'Gym Management'    # future
    LIBRARY    = 'library',    'Library'
    # add more modules without schema changes

class UserModuleRole(models.Model):
    user    = models.ForeignKey('core.User', on_delete=models.CASCADE, related_name='module_roles')
    module  = models.CharField(max_length=50, choices=ModuleCode.choices)
    role    = models.ForeignKey('core.Role', on_delete=models.PROTECT)
    branch  = models.ForeignKey('core.Branch', on_delete=models.SET_NULL, null=True, blank=True)
    # null branch = access to ALL branches in this module (tenant-wide role)
    granted_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='+')
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'module', 'role', 'branch')
        indexes = [models.Index(fields=['user', 'module'])]
```

### Permission Model

Permissions remain on `Role` objects but are **module-prefixed**:

```python
# Permission code format: module.resource.action
# Examples:
'loans.loan.view'
'loans.loan.create'
'loans.collection.edit'

'jwl.billing.view'
'jwl.billing.create'
'jwl.billing.cancel'       # requires Manager+
'jwl.inventory.edit'
'jwl.pledge.disburse'      # requires 2FA
'jwl.pledge.approve'       # 2-person approval
'jwl.accounts.post'
'jwl.reports.export'
'jwl.admin.manage'
```

### Predefined Roles per Module

**Jewellery ERP Roles (seeded):**

| Role | Key Permissions |
|------|----------------|
| `jwl_admin` | All jewellery permissions |
| `jwl_manager` | Billing, inventory, orders, reports, cancel invoices, approve transfers |
| `jwl_cashier` | Create invoices, record payments, view reports |
| `jwl_salesperson` | Create estimates, convert to invoice, check stock |
| `jwl_karigar_manager` | Karigar issue/receive, order status updates |
| `jwl_pledge_officer` | Gold pledge loans: create, disburse, repayment |
| `jwl_auditor` | Read-only across all jewellery data |

---

## Permission Check Implementation

### DRF Permission Class

```python
# apps/jewellery/permissions.py
from rest_framework.permissions import BasePermission
from apps.core.models import UserModuleRole

class HasJewelleryPermission(BasePermission):
    def __init__(self, permission_code):
        self.permission_code = permission_code

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Check feature flag
        if not request.tenant.feature_flags.get('jewellery'):
            return False
        # Get user's jewellery roles (for this branch or tenant-wide)
        branch_id = request.headers.get('X-Branch-Id') or request.query_params.get('branch')
        roles = UserModuleRole.objects.filter(
            user=request.user,
            module='jewellery',
        ).filter(
            models.Q(branch_id=branch_id) | models.Q(branch__isnull=True)
        ).select_related('role')

        for umr in roles:
            if umr.role.permissions.filter(code=self.permission_code).exists():
                return True
        return False

# Usage in a view:
class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasJewelleryPermission('jwl.billing.view')]

    @action(detail=True, methods=['post'],
            permission_classes=[IsAuthenticated, HasJewelleryPermission('jwl.billing.cancel')])
    def cancel(self, request, pk=None):
        ...
```

### Frontend Permission Hook

```ts
// src/modules/jewellery/hooks/useJewelleryPermission.ts
export function useJewelleryPermission(code: string): boolean {
  const { user, activeBranch } = useAuth()
  return useMemo(() => {
    return user?.moduleRoles
      ?.filter(r => r.module === 'jewellery')
      ?.filter(r => !r.branchId || r.branchId === activeBranch?.id)
      ?.some(r => r.role.permissions.includes(code))
    ?? false
  }, [user, activeBranch, code])
}

// Usage:
const canCreateInvoice = useJewelleryPermission('jwl.billing.create')
```

---

## Cross-Module Role Visibility

The global user profile page (`/settings/users/:id`) shows all module role assignments:

```
User: Akash Kushwaha
Email: akash@shop.com
─────────────────────────────────────────
Module             Role           Branch
─────────────────────────────────────────
Loan Management    Admin          All branches
Jewellery ERP      Manager        Branch A
Jewellery ERP      Cashier        Branch B
─────────────────────────────────────────
[+ Add Module Role]
```

---

## Workspace / Business Context

For future multi-business support (a user owns two separate jewellery businesses), the `tenant` remains the workspace boundary. Each tenant is a separate business.

The user can be invited to multiple tenants (already supported by `user_branches` / `user_roles` model). The login flow:

1. User logs in with email/mobile + password
2. If user has access to multiple tenants → tenant picker screen
3. Selected tenant context is stored in Redux and sent via JWT or `X-Tenant-Id` header

This is the **workspace model** referenced in the original request.

---

## Future Module Plug-in Pattern

Adding a new module (e.g., Gym Management) requires:

1. Create `apps/gym/` Django app
2. Add `ModuleCode.GYM = 'gym'` to the enum
3. Seed gym roles: `gym_owner`, `gym_staff`, `gym_member`
4. Seed gym permissions: `gym.members.view`, `gym.billing.create`, etc.
5. Register feature flag `gym` on tenants
6. Add frontend module at `/gym` with its own RTK API slice
7. **Zero changes** to auth, users, or existing module code

---

## 2FA Enforcement per Action (not just per role)

Some actions require 2FA regardless of role:

```python
ACTIONS_REQUIRING_2FA = {
    'jwl.pledge.disburse',          # gold pledge loan disbursement
    'jwl.billing.discount_large',   # discount > configurable threshold
    'jwl.accounts.post_adjustment', # ledger adjustment voucher
    'jwl.inventory.write_off',      # write-off items
    'jwl.admin.lock_period',        # lock financial period
}

class Require2FA(BasePermission):
    def has_permission(self, request, view):
        # Check if action is in 2FA-required set
        action_code = get_action_code(view)  # custom mapping
        if action_code in ACTIONS_REQUIRING_2FA:
            # Verify that current request has a valid 2FA token
            return verify_2fa_token(request)
        return True
```

---

## Summary: Multi-App Architecture

```
DigiKhaato Platform
│
├── core/               ← Users, Tenants, Branches, Auth, RBAC
│   └── UserModuleRole  ← The bridge (user × module × role × branch)
│
├── loans/              ← Loan Management module
├── udhhar/             ← Udhhar App module
├── jewellery/          ← Jewellery ERP module (this document)
├── gym/                ← Future: Gym module
└── library/            ← Future: Library module
```

Each module:
- Has its own permission codes (`loans.*`, `jwl.*`, `gym.*`)
- Has its own predefined roles seeded at feature activation
- Checks `HasModulePermission` via shared pattern
- Operates on shared `User`, `Tenant`, `Branch` infrastructure
- Is invisible to users who don't have roles in it
