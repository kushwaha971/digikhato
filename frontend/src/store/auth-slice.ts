import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { APP_MODULES, normalizeModuleCode, type AppModuleCode } from "@/lib/routes";

export type UserRole = "super_admin" | "admin" | "collector" | "borrower";

export type JwlRoleCode =
  | "jwl_admin"
  | "jwl_manager"
  | "jwl_cashier"
  | "jwl_salesperson"
  | "jwl_karigar_manager"
  | "jwl_pledge_officer"
  | "jwl_auditor";

export interface ModuleFeatureAccess {
  read: boolean;
  write: boolean;
}

export interface UserModuleRole {
  id: number | null;
  module: string;           // "jewellery" | "loans" | "udhaar" | …
  role_code: string;
  branch_name: string;      // "" = all branches
  is_active: boolean;
  jwl_permissions: string[]; // resolved permission codes for this role
  // Top-level feature access map: { billing: { read, write }, inventory: { read, write }, … }
  // Populated by the backend from the role's permission set — frontend must never hardcode this.
  features: Record<string, ModuleFeatureAccess>;
}

export interface AuthUser {
  id: number;
  mobile_number: string;
  full_name: string;
  role: UserRole;
  must_reset_password?: boolean;
  branch_name?: string;
  theme_preference: "light" | "dark" | "system";
  onboarding_completed: boolean;
  is_active?: boolean;
  permissions?: string[];
  capabilities?: {
    can_approve_tenants?: boolean;
    can_manage_tenants?: boolean;
    can_manage_team?: boolean;
  };
  // Per-module role assignments (multi-module RBAC)
  module_roles?: UserModuleRole[];
  // Activated modules for this tenant: { jewellery: true, gym: false, … }
  feature_flags?: Record<string, boolean>;
  // Backend-driven module access metadata (new API contract).
  accessible_modules?: string[];
  default_module?: string | null;
  // Can be a map {module: true/false} or list of module codes.
  module_admin?: Record<string, boolean | {
    can_manage_users?: boolean;
    can_assign_roles?: boolean;
    can_self_onboard?: boolean;
  }> | string[];
  module_access_policy?: {
    allow_request_access?: boolean;
    allow_self_onboard?: boolean;
    requestable_modules?: string[];
    self_onboardable_modules?: string[];
  };
}

interface AuthState {
  // Only the short-lived access token lives in JS memory + localStorage.
  // The refresh token is stored exclusively in a Django-issued httpOnly cookie
  // and is never accessible from JavaScript.
  accessToken: string | null;
  currentUser: AuthUser | null;
}

const initialState: AuthState = {
  accessToken: null,
  currentUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ access: string; user: AuthUser }>) => {
      state.accessToken = action.payload.access;
      state.currentUser = action.payload.user;
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.currentUser = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.currentUser = null;
    },
  },
});

export const { setAuth, setAccessToken, setCurrentUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;

function uniqueModules(modules: AppModuleCode[]): AppModuleCode[] {
  return Array.from(new Set(modules));
}

export function getAccessibleModules(user: AuthUser | null | undefined): AppModuleCode[] {
  if (!user) return [];

  const explicitModules = (user.accessible_modules ?? [])
    .map((module) => normalizeModuleCode(module))
    .filter((module): module is AppModuleCode => Boolean(module));
  if (explicitModules.length > 0) {
    return uniqueModules(explicitModules);
  }

  const modulesFromRoles = (user.module_roles ?? [])
    .filter((role) => role.is_active)
    .map((role) => normalizeModuleCode(role.module))
    .filter((module): module is AppModuleCode => Boolean(module));

  if ((user.permissions ?? []).includes("view:customer-ledger")) {
    modulesFromRoles.push("udhaar");
  }

  for (const module of APP_MODULES) {
    if (user.feature_flags?.[module]) {
      modulesFromRoles.push(module);
    }
  }

  return uniqueModules(modulesFromRoles);
}

export function resolveDefaultModule(user: AuthUser | null | undefined): AppModuleCode | null {
  if (!user) return null;

  const accessibleModules = getAccessibleModules(user);
  if (accessibleModules.length === 0) return null;

  const backendDefault = normalizeModuleCode(user.default_module);
  if (backendDefault && accessibleModules.includes(backendDefault)) {
    return backendDefault;
  }

  // Prefer Udhaar as fallback when available to match current product behavior.
  if (accessibleModules.includes("udhaar")) return "udhaar";
  return accessibleModules[0];
}

export function isModuleAdmin(
  user: AuthUser | null | undefined,
  module: AppModuleCode,
): boolean {
  if (!user) return false;

  if (Array.isArray(user.module_admin)) {
    return user.module_admin
      .map((mod) => normalizeModuleCode(mod))
      .filter((mod): mod is AppModuleCode => Boolean(mod))
      .includes(module);
  }

  if (user.module_admin && typeof user.module_admin === "object") {
    const value = user.module_admin[module];
    if (typeof value === "boolean") return value;
    if (value && typeof value === "object") {
      return value.can_manage_users === true || value.can_assign_roles === true;
    }
  }

  // Safe fallback: infer likely admin capability from current role assignments.
  if (module === "loans") {
    return user.role === "admin" || user.role === "super_admin";
  }
  if (module === "jewellery") {
    return (user.module_roles ?? []).some((role) => role.module === "jewellery" && role.is_active && (
      role.role_code === "jwl_admin" || role.role_code === "jwl_manager"
    ));
  }
  return false;
}
