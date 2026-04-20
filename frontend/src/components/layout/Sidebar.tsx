"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useLogoutMutation } from "@/features/auth/auth-api";
import { useListNotificationsQuery } from "@/features/notifications/notification-api";
import { useRoleAccess, Permission } from "@/hooks/useRoleAccess";
import { clearAuth } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { useAppSelector } from "@/store/hooks";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly permission: Permission;
  readonly icon: ReactNode;
}

export const MAIN_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    permission: "view:dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/borrowers",
    label: "Borrowers",
    permission: "view:borrowers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/collections",
    label: "Collections",
    permission: "add:collection",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    permission: "view:reports",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/team",
    label: "Team",
    permission: "view:team",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  {
    href: "/super-admin/dashboard",
    label: "Platform",
    permission: "view:platform",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/super-admin/tenants",
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
    href: "/portal",
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
  href: "/settings",
  label: "Settings",
  permission: "view:settings",
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function NavLink({ item, isActive }: Readonly<{ item: NavItem; isActive: boolean }>) {
  return (
    <Link
      href={item.href}
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
        isActive
          ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)] hover:text-[var(--sidebar-active-text)]",
      ].join(" ")}
    >
      <span className={isActive ? "text-[var(--sidebar-active-text)]" : "text-[var(--sidebar-icon)] group-hover:text-[var(--sidebar-active-text)]"}>
        {item.icon}
      </span>
      <span className="hidden xl:block text-sm truncate">{item.label}</span>
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
  const { data: notifications } = useListNotificationsQuery({ active: true, unread: true });
  const unreadCount = notifications?.length ?? 0;

  let primaryNav = MAIN_NAV;
  if (isSuperAdmin) primaryNav = SUPER_ADMIN_NAV;
  else if (isBorrower) primaryNav = BORROWER_NAV;
  const visibleItems = primaryNav.filter((item) => can(item.permission));

  let homeHref = "/dashboard";
  if (isSuperAdmin) homeHref = "/super-admin/dashboard";
  else if (isBorrower) homeHref = "/portal";

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearAuth());
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      router.push("/login");
    }
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col border-r border-border bg-[var(--sidebar-bg)] transition-all duration-300 w-sidebar-sm xl:w-sidebar">
      {/* Logo */}
      <div className="h-16 flex items-center px-3 xl:px-5 border-b border-border flex-shrink-0">
        <div className="xl:block hidden">
          <BrandLogo compact href={homeHref} />
        </div>
        <div className="xl:hidden flex justify-center w-full">
          <Link href={homeHref} aria-label="Go to home">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" />
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 xl:px-3 space-y-1">
        {visibleItems.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
        ))}
      </nav>

      {/* Notifications bell */}
      {!isSuperAdmin && !isBorrower && (
        <div className="px-2 xl:px-3 pb-1">
          <Link
            href="/notifications"
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative",
              isActive("/notifications")
                ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
                : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)] hover:text-[var(--sidebar-active-text)]",
            ].join(" ")}
          >
            <span className="relative">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <span className="hidden xl:block text-sm truncate">Notifications</span>
          </Link>
        </div>
      )}

      {/* Settings always at bottom */}
      {can(SETTINGS_NAV.permission) && (
        <div className="px-2 xl:px-3 pb-2">
          <NavLink item={SETTINGS_NAV} isActive={isActive(SETTINGS_NAV.href)} />
        </div>
      )}

      {/* User profile */}
      {currentUser && (
        <div className="p-2 xl:p-3 border-t border-border flex-shrink-0 space-y-3">
          <div className="flex items-center gap-3 px-2 xl:px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {currentUser.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="hidden xl:block min-w-0">
              <p className="text-sm font-medium text-text truncate">{currentUser.full_name}</p>
              <p className="text-xs text-muted capitalize">{currentUser.role.replace("_", " ")}</p>
            </div>
          </div>
          <div className="px-2 xl:px-3 space-y-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold text-muted hover:text-text hover:bg-surface2 transition-colors border border-border disabled:opacity-50"
              aria-label="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
