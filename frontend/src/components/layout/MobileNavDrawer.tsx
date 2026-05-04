"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLogoutMutation } from "@/features/auth/auth-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getModuleContext, getModuleLabel } from "@/lib/moduleNav";
import { ROUTES } from "@/lib/routes";
import { clearAuth } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  BORROWER_NAV,
  JEWELLERY_FEATURE_SECTIONS,
  LEDGER_MODULE_NAV,
  LOAN_MODULE_NAV,
  MODULE_LIST_NAV,
  MODULE_SWITCH_NAV,
  NOTES_MODULE_NAV,
  SETTINGS_NAV,
  SUPER_ADMIN_NAV,
  buildCanSeeItem,
  isPathActive,
} from "@/components/layout/Sidebar";

type MobileNavDrawerProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { can, isSuperAdmin, isBorrower } = useRoleAccess();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [expandedJewelleryGroups, setExpandedJewelleryGroups] = useState<Record<string, boolean>>({});
  const [expandedAppGroups, setExpandedAppGroups] = useState<Record<string, boolean>>({});
  const currentRoute = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const moduleRoles = currentUser?.module_roles ?? [];
  const canSeeItem = buildCanSeeItem(moduleRoles, can);
  const moduleContext = getModuleContext(pathname);

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

  const visibleItems = isSuperAdmin
    ? SUPER_ADMIN_NAV.filter(canSeeItem)
    : isBorrower
      ? BORROWER_NAV.filter(canSeeItem)
      : moduleContext === "loans"
        ? LOAN_MODULE_NAV.filter(canSeeItem)
        : moduleContext === "ledger"
          ? LEDGER_MODULE_NAV.filter(canSeeItem)
          : moduleContext === "notes"
            ? NOTES_MODULE_NAV.filter(canSeeItem)
            : [];
  const visibleAppsTools = [
    NOTES_MODULE_NAV[0],
    MODULE_SWITCH_NAV,
  ].filter(canSeeItem);
  const visibleModuleList = MODULE_LIST_NAV.filter(canSeeItem);

  const isActive = (href: string) => {
    return isPathActive(currentRoute, href);
  };
  const inJewelleryModule = moduleContext === "jewellery" && !isSuperAdmin && !isBorrower;
  const visibleJewellerySections = JEWELLERY_FEATURE_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(canSeeItem),
  })).filter((section) => section.items.length > 0);

  useEffect(() => {
    if (!inJewelleryModule) return;
    setExpandedJewelleryGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const section of visibleJewellerySections) {
        for (const item of section.items) {
          const children = item.children ?? [];
          const shouldExpand = isActive(item.href) || children.some((child) => isActive(child.href));
          if (shouldExpand && !next[item.href]) {
            next[item.href] = true;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [currentRoute, inJewelleryModule, visibleJewellerySections]);
  const homeHref = isSuperAdmin
    ? ROUTES.app.superAdmin.dashboard
    : isBorrower
      ? ROUTES.app.portal
      : ROUTES.app.modules;

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
          {inJewelleryModule ? (
            visibleJewellerySections.map((section, sectionIndex) => (
              <div key={`${section.title}-${sectionIndex}`} className="space-y-1">
                {section.items.map((item) => {
                  const children = item.children ?? [];
                  const expanded = expandedJewelleryGroups[item.href] ?? false;
                  const childIsActive = children.some((child) => isActive(child.href));
                  const groupIsActive = isActive(item.href) || childIsActive;
                  return (
                    <div key={item.href} className="space-y-1">
                      <div className={navLinkClass(groupIsActive)}>
                        <Link
                          href={item.href}
                          onClick={(event) => {
                            if (children.length > 0) {
                              event.preventDefault();
                              setExpandedJewelleryGroups((prev) => ({
                                ...prev,
                                [item.href]: !(prev[item.href] ?? false),
                              }));
                              return;
                            }
                            onClose();
                          }}
                          className="flex-1 flex items-center gap-3 min-w-0"
                        >
                          <span className="text-primary-500">{item.icon}</span>
                          <span className="text-sm truncate">{item.label}</span>
                        </Link>
                        {children.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedJewelleryGroups((prev) => ({
                                ...prev,
                                [item.href]: !(prev[item.href] ?? false),
                              }))
                            }
                            className="px-1 py-1 text-muted hover:text-text transition-colors"
                            aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            aria-expanded={expanded}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                      {expanded && children.length > 0 ? (
                        <div className="ml-6 border-l border-border pl-2 space-y-0.5">
                          {children.map((child) => (
                            <Link
                              key={`${item.href}-${child.label}`}
                              href={child.href}
                              onClick={onClose}
                              className={[
                                "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                                isActive(child.href)
                                  ? "text-[var(--sidebar-active-text)] font-medium"
                                  : "text-muted hover:text-text",
                              ].join(" ")}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <>
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                {isSuperAdmin ? "Apps" : isBorrower ? "My Loans" : getModuleLabel(moduleContext)}
              </p>
              {visibleItems.map((item) => {
                const groupIsActive = isActive(item.href);
                return (
                  <div key={item.href} className="space-y-1">
                    <div className={navLinkClass(groupIsActive)}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="flex-1 flex items-center gap-3 min-w-0"
                      >
                        <span className="text-primary-500">{item.icon}</span>
                        <span className="text-sm truncate">{item.label}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}

            </>
          )}

          {!isSuperAdmin && !isBorrower && moduleContext ? (
            <div className="mt-3 pt-3 border-t border-border/70 space-y-1">
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                Apps
              </p>
              {visibleAppsTools.map((item) => {
                if (item.href !== MODULE_SWITCH_NAV.href) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={navLinkClass(isActive(item.href))}
                    >
                      <span className="text-primary-500">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                }

                const expanded = expandedAppGroups[item.href] ?? false;
                const childIsActive = visibleModuleList.some((subItem) => isActive(subItem.href));
                const groupIsActive = isActive(item.href) || childIsActive;

                return (
                  <div key={item.href} className="space-y-1">
                    <div className={navLinkClass(groupIsActive)}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAppGroups((prev) => ({
                            ...prev,
                            [item.href]: !(prev[item.href] ?? false),
                          }))
                        }
                        className="flex-1 flex items-center gap-3 min-w-0 text-left"
                      >
                        <span className="text-primary-500">{item.icon}</span>
                        <span className="text-sm truncate">{item.label}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAppGroups((prev) => ({
                            ...prev,
                            [item.href]: !(prev[item.href] ?? false),
                          }))
                        }
                        className="px-1 py-1 text-muted hover:text-text transition-colors"
                        aria-label={expanded ? "Collapse modules" : "Expand modules"}
                        aria-expanded={expanded}
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {expanded ? (
                      <div className="ml-4 border-l border-border pl-2 space-y-1">
                        {visibleModuleList.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onClose}
                            className={navLinkClass(isActive(subItem.href))}
                          >
                            <span className="text-primary-500">{subItem.icon}</span>
                            <span className="text-sm">{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {canSeeItem(SETTINGS_NAV) ? (
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
