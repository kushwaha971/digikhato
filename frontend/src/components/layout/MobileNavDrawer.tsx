"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLogoutMutation } from "@/features/auth/auth-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getModuleContext, MODULE_META } from "@/lib/moduleNav";
import { ROUTES } from "@/lib/routes";
import { clearAuth } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  BORROWER_NAV,
  LEDGER_MODULE_NAV,
  MAIN_NAV,
  NOTES_MODULE_NAV,
  LOAN_MODULE_NAV,
  SETTINGS_NAV,
  SUPER_ADMIN_NAV,
} from "@/components/layout/Sidebar";

type MobileNavDrawerProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { can, isSuperAdmin, isBorrower } = useRoleAccess();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const moduleCtx = getModuleContext(pathname);
  const showModuleContext = Boolean(moduleCtx) && !isSuperAdmin && !isBorrower;

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  let primaryNav = MAIN_NAV;
  if (isSuperAdmin) primaryNav = SUPER_ADMIN_NAV;
  else if (isBorrower) primaryNav = BORROWER_NAV;
  const visibleItems = primaryNav.filter((item) => can(item.permission));
  const moduleItems = (() => {
    if (!showModuleContext) return [];
    if (moduleCtx === "loans") return LOAN_MODULE_NAV.filter((item) => can(item.permission));
    if (moduleCtx === "ledger") return LEDGER_MODULE_NAV.filter((item) => can(item.permission));
    if (moduleCtx === "notes") return NOTES_MODULE_NAV.filter((item) => can(item.permission));
    return [];
  })();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const homeHref = isSuperAdmin
    ? ROUTES.app.superAdmin.dashboard
    : isBorrower
      ? ROUTES.app.portal
      : ROUTES.app.loans.dashboard;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearAuth());
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      onClose();
      router.push(ROUTES.public.login);
    }
  };

  if (!mounted) return null;

  const transition = "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

  const navLinkClass = (active: boolean) =>
    [
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
      active
        ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
        : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)] hover:text-[var(--sidebar-active-text)]",
    ].join(" ");

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Left-side drawer */}
      <aside
        className={`
          absolute left-0 top-0 h-full w-[86%] max-w-sm
          bg-surface rounded-r-3xl border-r border-border shadow-2xl
          flex flex-col
          ${transition}
          ${visible ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-16 px-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <BrandLogo size="sm" href={homeHref} />
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors flex items-center justify-center"
            aria-label="Close navigation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Module items FIRST */}
          {showModuleContext && moduleItems.length > 0 ? (
            <>
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                {MODULE_META[moduleCtx!].label}
              </p>
              {moduleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={navLinkClass(isActive(item.href))}
                >
                  <span className="text-primary-500">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
            </>
          ) : null}

          {/* Apps BELOW */}
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            Apps
          </p>
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={navLinkClass(isActive(item.href))}
            >
              <span className="text-primary-500">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}

          {can(SETTINGS_NAV.permission) ? (
            <Link
              href={SETTINGS_NAV.href}
              onClick={onClose}
              className={navLinkClass(isActive(SETTINGS_NAV.href))}
            >
              <span className="text-primary-500">{SETTINGS_NAV.icon}</span>
              <span className="text-sm">{SETTINGS_NAV.label}</span>
            </Link>
          ) : null}
        </nav>

        <div className="border-t border-border p-3 space-y-3 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {currentUser.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text truncate">{currentUser.full_name}</p>
                <p className="text-xs text-muted capitalize">{currentUser.role.replace("_", " ")}</p>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            disabled={isLoggingOut}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-border text-sm font-semibold text-muted hover:text-text hover:bg-surface2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

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
    </div>
  );
}
