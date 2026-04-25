"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { BrandLogo, BookMark } from "@/components/branding/BrandLogo";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLogoutMutation } from "@/features/auth/auth-api";
import { useRoleAccess, type Permission } from "@/hooks/useRoleAccess";
import { getModuleContext, MODULE_META } from "@/lib/moduleNav";
import { ROUTES } from "@/lib/routes";
import { useSidebarState } from "@/lib/sidebar-state";
import { clearAuth } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly permission: Permission;
  readonly icon: ReactNode;
}

export const MAIN_NAV: NavItem[] = [
  {
    href: ROUTES.app.loans.dashboard,
    label: "Loan Management",
    permission: "view:dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2v2h6v-2c0-1.105-1.343-2-3-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h5m6 0h5M4 17h16M4 7h16" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.udhaarbook.root,
    label: "UdhaarBook",
    permission: "view:customer-ledger",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h11a3 3 0 013 3v10a3 3 0 01-3 3H6a2 2 0 00-2 2V6a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h8" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.notes.root,
    label: "Notes",
    permission: "view:notes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

export const LOAN_MODULE_NAV: NavItem[] = [
  {
    href: ROUTES.app.loans.dashboard,
    label: "Dashboard",
    permission: "view:dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.loans.borrowers,
    label: "Borrowers",
    permission: "view:borrowers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.loans.collections,
    label: "Collections",
    permission: "add:collection",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.loans.reports,
    label: "Reports",
    permission: "view:reports",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export const LEDGER_MODULE_NAV: NavItem[] = [
  {
    href: ROUTES.app.udhaarbook.root,
    label: "Parties",
    permission: "view:customer-ledger",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a5 5 0 00-10 0v2M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export const NOTES_MODULE_NAV: NavItem[] = [
  {
    href: ROUTES.app.notes.root,
    label: "All Notes",
    permission: "view:notes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.notes.new,
    label: "Create Note",
    permission: "view:notes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  {
    href: ROUTES.app.superAdmin.dashboard,
    label: "Platform",
    permission: "view:platform",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.superAdmin.tenants,
    label: "Tenants",
    permission: "manage:tenants",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export const BORROWER_NAV: NavItem[] = [
  {
    href: ROUTES.app.portal,
    label: "My Loans",
    permission: "view:portal",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export const SETTINGS_NAV: NavItem = {
  href: ROUTES.app.settings,
  label: "Settings",
  permission: "view:settings",
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function NavLink({
  item,
  isActive,
  collapsed,
}: Readonly<{ item: NavItem; isActive: boolean; collapsed: boolean }>) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={[
        "flex items-center rounded-xl transition-all duration-150 group",
        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)] hover:text-[var(--sidebar-active-text)]",
      ].join(" ")}
    >
      <span className="text-primary-500 flex-shrink-0">{item.icon}</span>
      {!collapsed && <span className="text-sm truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { can, isSuperAdmin, isBorrower } = useRoleAccess();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const { collapsed, toggle } = useSidebarState();

  const moduleCtx = getModuleContext(pathname);
  const showModuleContext = Boolean(moduleCtx) && !isSuperAdmin && !isBorrower;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  let homeHref: string = ROUTES.app.loans.dashboard;
  if (isSuperAdmin) homeHref = ROUTES.app.superAdmin.dashboard;
  else if (isBorrower) homeHref = ROUTES.app.portal;

  let primaryNav: NavItem[] = MAIN_NAV;
  if (isSuperAdmin) primaryNav = SUPER_ADMIN_NAV;
  else if (isBorrower) primaryNav = BORROWER_NAV;

  const moduleItems: NavItem[] = (() => {
    if (!moduleCtx || !showModuleContext) return [];
    if (moduleCtx === "loans") return LOAN_MODULE_NAV.filter((item) => can(item.permission));
    if (moduleCtx === "ledger") return LEDGER_MODULE_NAV.filter((item) => can(item.permission));
    if (moduleCtx === "notes") return NOTES_MODULE_NAV.filter((item) => can(item.permission));
    return [];
  })();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearAuth());
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      router.push(ROUTES.public.login);
    }
  };

  return (
    <aside
      className={`hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col border-r border-border bg-surface transition-all duration-300 ${
        collapsed ? "w-[4rem]" : "w-sidebar"
      }`}
    >
      {/* Logo + collapse toggle */}
      <div className="h-16 px-3 border-b border-border flex items-center justify-between flex-shrink-0">
        {!collapsed && <BrandLogo size="sm" href={homeHref} />}
        {collapsed && (
          <Link href={homeHref} className="w-full flex items-center justify-center">
            <BookMark size="sm" />
          </Link>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            className="w-7 h-7 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={toggle}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full border border-border bg-surface text-muted hover:text-text shadow-sm flex items-center justify-center"
            aria-label="Expand sidebar"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className={`flex-1 overflow-y-auto py-3 space-y-1 ${collapsed ? "px-1.5" : "px-3"}`}>
        {/* Module section FIRST — when inside a module */}
        {showModuleContext && moduleItems.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                {MODULE_META[moduleCtx!].label}
              </p>
            )}
            {moduleItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={collapsed} />
            ))}
            <div className="my-2 border-t border-border" />
          </>
        )}

        {/* Global apps BELOW module section */}
        {!collapsed && (
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            Apps
          </p>
        )}
        {primaryNav.filter((i) => can(i.permission)).map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={collapsed} />
        ))}
      </nav>

      {/* Settings */}
      {can(SETTINGS_NAV.permission) && (
        <div className={collapsed ? "px-1.5 pb-2" : "px-3 pb-2"}>
          <NavLink item={SETTINGS_NAV} isActive={isActive(SETTINGS_NAV.href)} collapsed={collapsed} />
        </div>
      )}

      {/* User profile */}
      {currentUser && (
        <div className={`border-t border-border flex-shrink-0 ${collapsed ? "p-1.5" : "p-3"}`}>
          {collapsed ? (
            <div className="flex justify-center py-1">
              <div
                className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold"
                title={currentUser.full_name}
              >
                {currentUser.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1 py-1">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {currentUser.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{currentUser.full_name}</p>
                  <p className="text-xs text-muted capitalize">{currentUser.role.replace("_", " ")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(true)}
                disabled={isLoggingOut}
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold text-muted hover:text-text hover:bg-surface2 transition-colors border border-border disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={async () => {
          await handleLogout();
          setConfirmLogoutOpen(false);
        }}
        isLoading={isLoggingOut}
        title="Confirm Logout"
        description="Are you sure you want to log out?"
        confirmLabel="Log out"
        confirmVariant="danger"
      />
    </aside>
  );
}
