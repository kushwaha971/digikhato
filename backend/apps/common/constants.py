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
