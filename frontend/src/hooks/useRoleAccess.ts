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
  | "view:portal";

// Collector permissions — Admin inherits all of these (no duplication)
const COLLECTOR_PERMISSIONS: Permission[] = [
  "view:dashboard",
  "view:borrowers",
  "view:loans",
  "add:collection",
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
