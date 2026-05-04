from django.db import models


class RoleChoices(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    ADMIN = "admin", "Admin"
    COLLECTOR = "collector", "Collector"
    BORROWER = "borrower", "Borrower"


class RecordStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"


# ── Module codes ─────────────────────────────────────────────────────────────

class ModuleCode(models.TextChoices):
    LOANS      = "loans",      "Loan Management"
    UDHAAR     = "udhaar",     "Udhaar App"
    JEWELLERY  = "jewellery",  "Jewellery ERP"
    # Add future modules here (gym, library, …)


# ── Jewellery ERP role codes ──────────────────────────────────────────────────

class JwlRoleCode(models.TextChoices):
    ADMIN          = "jwl_admin",          "Admin"
    MANAGER        = "jwl_manager",        "Manager"
    CASHIER        = "jwl_cashier",        "Cashier"
    SALESPERSON    = "jwl_salesperson",    "Salesperson"
    KARIGAR_MGR    = "jwl_karigar_manager","Karigar Manager"
    PLEDGE_OFFICER = "jwl_pledge_officer", "Gold Pledge Officer"
    AUDITOR        = "jwl_auditor",        "Auditor"


# ── Jewellery permission codes ────────────────────────────────────────────────
# Each constant is used both as the canonical value and as the key in
# JWL_ROLE_PERMISSIONS, eliminating repeated string literals.

P_BILLING_VIEW       = "jwl.billing.view"
P_BILLING_CREATE     = "jwl.billing.create"
P_BILLING_CANCEL     = "jwl.billing.cancel"
P_BILLING_DISCOUNT   = "jwl.billing.discount_large"
P_INVENTORY_VIEW     = "jwl.inventory.view"
P_INVENTORY_EDIT     = "jwl.inventory.edit"
P_INVENTORY_WRITEOFF = "jwl.inventory.write_off"
P_MASTER_VIEW        = "jwl.master.view"
P_MASTER_EDIT        = "jwl.master.edit"
P_KARIGAR_VIEW       = "jwl.karigar.view"
P_KARIGAR_MANAGE     = "jwl.karigar.manage"
P_PLEDGE_VIEW        = "jwl.pledge.view"
P_PLEDGE_CREATE      = "jwl.pledge.create"
P_PLEDGE_DISBURSE    = "jwl.pledge.disburse"
P_PLEDGE_APPROVE     = "jwl.pledge.approve"
P_ACCOUNTS_VIEW      = "jwl.accounts.view"
P_ACCOUNTS_POST      = "jwl.accounts.post"
P_ACCOUNTS_ADJUST    = "jwl.accounts.post_adjustment"
P_REPORTS_VIEW       = "jwl.reports.view"
P_REPORTS_EXPORT     = "jwl.reports.export"
P_RATES_VIEW         = "jwl.rates.view"
P_RATES_OVERRIDE     = "jwl.rates.override"
P_ADMIN_MANAGE       = "jwl.admin.manage"

# All defined permission codes — used for validation and documentation.
ALL_JWL_PERMISSIONS: list[str] = [
    P_BILLING_VIEW, P_BILLING_CREATE, P_BILLING_CANCEL, P_BILLING_DISCOUNT,
    P_INVENTORY_VIEW, P_INVENTORY_EDIT, P_INVENTORY_WRITEOFF,
    P_MASTER_VIEW, P_MASTER_EDIT,
    P_KARIGAR_VIEW, P_KARIGAR_MANAGE,
    P_PLEDGE_VIEW, P_PLEDGE_CREATE, P_PLEDGE_DISBURSE, P_PLEDGE_APPROVE,
    P_ACCOUNTS_VIEW, P_ACCOUNTS_POST, P_ACCOUNTS_ADJUST,
    P_REPORTS_VIEW, P_REPORTS_EXPORT,
    P_RATES_VIEW, P_RATES_OVERRIDE,
    P_ADMIN_MANAGE,
]

# Permissions each jewellery role carries.
JWL_ROLE_PERMISSIONS: dict[str, list[str]] = {
    JwlRoleCode.ADMIN: [
        P_BILLING_VIEW, P_BILLING_CREATE, P_BILLING_CANCEL, P_BILLING_DISCOUNT,
        P_INVENTORY_VIEW, P_INVENTORY_EDIT, P_INVENTORY_WRITEOFF,
        P_MASTER_VIEW, P_MASTER_EDIT,
        P_KARIGAR_VIEW, P_KARIGAR_MANAGE,
        P_PLEDGE_VIEW, P_PLEDGE_CREATE, P_PLEDGE_DISBURSE, P_PLEDGE_APPROVE,
        P_ACCOUNTS_VIEW, P_ACCOUNTS_POST, P_ACCOUNTS_ADJUST,
        P_REPORTS_VIEW, P_REPORTS_EXPORT,
        P_RATES_VIEW, P_RATES_OVERRIDE,
        P_ADMIN_MANAGE,
    ],
    JwlRoleCode.MANAGER: [
        P_BILLING_VIEW, P_BILLING_CREATE, P_BILLING_CANCEL,
        P_INVENTORY_VIEW, P_INVENTORY_EDIT, P_INVENTORY_WRITEOFF,
        P_MASTER_VIEW, P_MASTER_EDIT,
        P_KARIGAR_VIEW, P_KARIGAR_MANAGE,
        P_PLEDGE_VIEW,
        P_ACCOUNTS_VIEW,
        P_REPORTS_VIEW, P_REPORTS_EXPORT,
        P_RATES_VIEW,
    ],
    JwlRoleCode.CASHIER: [
        P_BILLING_VIEW, P_BILLING_CREATE,
        P_INVENTORY_VIEW,
        P_MASTER_VIEW,
        P_REPORTS_VIEW,
        P_RATES_VIEW,
    ],
    JwlRoleCode.SALESPERSON: [
        P_BILLING_VIEW, P_BILLING_CREATE,
        P_INVENTORY_VIEW,
        P_MASTER_VIEW,
        P_RATES_VIEW,
    ],
    JwlRoleCode.KARIGAR_MGR: [
        P_KARIGAR_VIEW, P_KARIGAR_MANAGE,
        P_INVENTORY_VIEW,
        P_MASTER_VIEW,
        P_RATES_VIEW,
    ],
    JwlRoleCode.PLEDGE_OFFICER: [
        P_PLEDGE_VIEW, P_PLEDGE_CREATE, P_PLEDGE_DISBURSE,
        P_INVENTORY_VIEW,
        P_REPORTS_VIEW,
        P_RATES_VIEW,
    ],
    JwlRoleCode.AUDITOR: [
        P_BILLING_VIEW,
        P_INVENTORY_VIEW,
        P_KARIGAR_VIEW,
        P_PLEDGE_VIEW,
        P_ACCOUNTS_VIEW,
        P_REPORTS_VIEW, P_REPORTS_EXPORT,
        P_RATES_VIEW,
    ],
}


# ── Module-level feature maps (read / write per feature key) ──────────────────
# These are returned in the login response so the frontend can render
# only the features the user is allowed to access — no hardcoding on client.

# Loan Management feature access per system role.
LOANS_ROLE_FEATURES: dict[str, dict[str, dict[str, bool]]] = {
    RoleChoices.SUPER_ADMIN: {
        "dashboard":   {"read": True,  "write": True},
        "borrowers":   {"read": True,  "write": True},
        "loans":       {"read": True,  "write": True},
        "collections": {"read": True,  "write": True},
        "reports":     {"read": True,  "write": True},
        "team":        {"read": True,  "write": True},
        "settings":    {"read": True,  "write": True},
        "portal":      {"read": False, "write": False},
        "locations":   {"read": True,  "write": True},
    },
    RoleChoices.ADMIN: {
        "dashboard":   {"read": True,  "write": True},
        "borrowers":   {"read": True,  "write": True},
        "loans":       {"read": True,  "write": True},
        "collections": {"read": True,  "write": True},
        "reports":     {"read": True,  "write": False},
        "team":        {"read": True,  "write": True},
        "settings":    {"read": True,  "write": True},
        "portal":      {"read": False, "write": False},
        "locations":   {"read": True,  "write": True},
    },
    RoleChoices.COLLECTOR: {
        "dashboard":   {"read": True,  "write": False},
        "borrowers":   {"read": True,  "write": False},
        "loans":       {"read": True,  "write": False},
        "collections": {"read": True,  "write": True},
        "reports":     {"read": False, "write": False},
        "team":        {"read": False, "write": False},
        "settings":    {"read": True,  "write": False},
        "portal":      {"read": False, "write": False},
        "locations":   {"read": True,  "write": False},
    },
    RoleChoices.BORROWER: {
        "dashboard":   {"read": False, "write": False},
        "borrowers":   {"read": False, "write": False},
        "loans":       {"read": False, "write": False},
        "collections": {"read": False, "write": False},
        "reports":     {"read": False, "write": False},
        "team":        {"read": False, "write": False},
        "settings":    {"read": True,  "write": False},
        "portal":      {"read": True,  "write": False},
        "locations":   {"read": False, "write": False},
    },
}


def _jwl_features_for_role(role_code: str) -> dict[str, dict[str, bool]]:
    """Derive top-level UI feature read/write flags from fine-grained JWL permission codes."""
    perms: set[str] = set(JWL_ROLE_PERMISSIONS.get(role_code, []))
    has_any = len(perms) > 0
    return {
        # dashboard is always visible to any active JWL role
        "dashboard":      {"read": has_any,                      "write": False},
        "billing":        {"read": P_BILLING_VIEW in perms,      "write": P_BILLING_CREATE in perms},
        "inventory":      {"read": P_INVENTORY_VIEW in perms,    "write": P_INVENTORY_EDIT in perms},
        "master":         {"read": P_MASTER_VIEW in perms,       "write": P_MASTER_EDIT in perms},
        "karigar":        {"read": P_KARIGAR_VIEW in perms,      "write": P_KARIGAR_MANAGE in perms},
        "pledge":         {"read": P_PLEDGE_VIEW in perms,       "write": P_PLEDGE_CREATE in perms},
        "accounts":       {"read": P_ACCOUNTS_VIEW in perms,     "write": P_ACCOUNTS_POST in perms},
        "reports":        {"read": P_REPORTS_VIEW in perms,      "write": P_REPORTS_EXPORT in perms},
        "rates":          {"read": P_RATES_VIEW in perms,        "write": P_RATES_OVERRIDE in perms},
        "admin":          {"read": P_ADMIN_MANAGE in perms,      "write": P_ADMIN_MANAGE in perms},
        # customers share billing access — same staff who can bill can view customers
        "customers":      {"read": P_BILLING_VIEW in perms,      "write": P_BILLING_CREATE in perms},
        "gst":            {"read": P_REPORTS_VIEW in perms,      "write": False},
        "outstanding":    {"read": P_ACCOUNTS_VIEW in perms,     "write": False},
        "notifications":  {"read": P_ADMIN_MANAGE in perms,      "write": P_ADMIN_MANAGE in perms},
        "users_roles":    {"read": P_ADMIN_MANAGE in perms,      "write": P_ADMIN_MANAGE in perms},
        "multi_branch":   {"read": P_ADMIN_MANAGE in perms,      "write": P_ADMIN_MANAGE in perms},
        "barcode":        {"read": P_INVENTORY_VIEW in perms,    "write": P_INVENTORY_EDIT in perms},
    }


# Pre-computed feature map for every jewellery role.
JWL_ROLE_FEATURES: dict[str, dict[str, dict[str, bool]]] = {
    role_code: _jwl_features_for_role(role_code)
    for role_code in JwlRoleCode.values
}
