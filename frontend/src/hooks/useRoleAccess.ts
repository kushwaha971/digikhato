"use client";
import { useAppSelector } from "@/store/hooks";

export type AppRole = "super_admin" | "admin" | "collector" | "borrower";

export type Permission =
  | "view:platform"
  | "manage:tenants"
  | "view:dashboard"
  | "view:borrowers"
  | "add:borrower"
  | "edit:borrower"
  | "delete:borrower"
  | "toggle:borrower-status"
  | "view:loans"
  | "create:loan"
  | "edit:loan"
  | "delete:loan"
  | "add:collection"
  | "edit:collection"
  | "delete:collection"
  | "view:reports"
  | "view:team"
  | "manage:team"
  | "view:settings"
  | "view:portal"
  | "view:customer-ledger"
  | "view:modules"
  | "view:notes";

// Collector permissions — Admin inherits all of these (no duplication)
const COLLECTOR_PERMISSIONS: Permission[] = [
  "view:dashboard",
  "view:borrowers",
  "view:loans",
  "add:collection",
  "view:customer-ledger",
  "view:modules",
  "view:notes",
  "view:settings",
];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: [
    "view:platform",
    "manage:tenants",
    "view:dashboard",
    "view:settings",
  ],
  admin: [
    ...COLLECTOR_PERMISSIONS,
    "create:loan",
    "add:borrower",
    "edit:borrower",
    "delete:borrower",
    "toggle:borrower-status",
    "edit:loan",
    "delete:loan",
    "edit:collection",
    "delete:collection",
    "view:reports",
    "view:team",
    "manage:team",
  ],
  collector: COLLECTOR_PERMISSIONS,
  borrower: ["view:portal", "view:settings"],
};

export function useRoleAccess() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const role = (currentUser?.role ?? "borrower") as AppRole;
  const resolvedPermissions = Array.isArray(currentUser?.permissions)
    ? currentUser.permissions
    : ROLE_PERMISSIONS[role];

  const hasPermission = (permission: Permission): boolean =>
    resolvedPermissions?.includes(permission) ?? false;

  return {
    role,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin",
    isCollector: role === "collector",
    isBorrower: role === "borrower",
    isAdminOrCollector: role === "admin" || role === "collector",
    can: hasPermission,
    canAny: (...permissions: Permission[]): boolean =>
      permissions.some((p) => hasPermission(p)),
  };
}

// ── Module-level permission hooks ─────────────────────────────────────────────

/**
 * Returns true if the current user has the given permission code in ANY active
 * module role for the specified module (and optional branch).
 *
 * Example:
 *   const canCreate = useModulePermission("jewellery", "jwl.billing.create")
 *   const canCreate = useModulePermission("jewellery", "jwl.billing.create", "Main Branch")
 */
export function useModulePermission(
  module: string,
  permissionCode: string,
  branchName?: string,
): boolean {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const roles = currentUser?.module_roles ?? [];

  return roles
    .filter((r) => r.module === module && r.is_active)
    .filter((r) => !branchName || r.branch_name === "" || r.branch_name === branchName)
    .some((r) => r.jwl_permissions.includes(permissionCode));
}

/** Convenience hook for all jewellery permissions. */
export function useJwlPermission(permissionCode: string, branchName?: string): boolean {
  return useModulePermission("jewellery", permissionCode, branchName);
}

/**
 * Returns true if the tenant has activated the given module.
 * Reads from feature_flags on the current user (set by the /me endpoint).
 *
 * Example:
 *   const hasJewellery = useFeatureFlag("jewellery")
 */
export function useFeatureFlag(flag: string): boolean {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  return currentUser?.feature_flags?.[flag] === true;
}

/**
 * Returns the jewellery role codes the current user holds.
 * Useful for showing role labels in the UI.
 */
export function useJwlRoles(branchName?: string): string[] {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const roles = currentUser?.module_roles ?? [];

  return roles
    .filter((r) => r.module === "jewellery" && r.is_active)
    .filter((r) => !branchName || r.branch_name === "" || r.branch_name === branchName)
    .map((r) => r.role_code);
}
