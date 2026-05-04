"use client";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { useListNotificationsQuery } from "@/features/notifications/notification-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getModuleContext, shouldShowNotifications } from "@/lib/moduleNav";
import { ROUTES } from "@/lib/routes";
import { SidebarProvider, useSidebarState } from "@/lib/sidebar-state";

interface AppShellProps {
  readonly children: ReactNode;
}

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isAdminOrCollector } = useRoleAccess();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { collapsed } = useSidebarState();
  const moduleCtx = getModuleContext(pathname);
  const showGlobalSearch = isAdminOrCollector && moduleCtx === "loans";
  const notificationsEnabled = shouldShowNotifications(pathname);
  const { data: unreadNotifications } = useListNotificationsQuery(
    { active: true, unread: true },
    { skip: !notificationsEnabled },
  );
  const unreadCount = unreadNotifications?.count ?? 0;
  const contentMargin = collapsed ? "lg:ml-[4rem]" : "lg:ml-sidebar";
  const showDesktopHeader = showGlobalSearch || notificationsEnabled;

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Sidebar — visible lg+ */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300 ${contentMargin}`}
        style={{ ["--desktop-screen-top" as string]: showDesktopHeader ? "4rem" : "0px" }}
      >
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 h-16 flex items-center justify-between px-4 border-b border-border bg-surface/90 backdrop-blur-sm">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-2">
            {notificationsEnabled && (
              <Link
                href={ROUTES.app.notifications}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-colors relative"
                aria-label="Notifications"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Desktop header */}
        {showDesktopHeader ? (
          <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between px-6 border-b border-border bg-surface/80 backdrop-blur-sm">
            <div className="w-full max-w-md">
              {showGlobalSearch ? <GlobalSearch /> : null}
            </div>
            {notificationsEnabled ? (
              <Link
                href={ROUTES.app.notifications}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-colors relative flex-shrink-0"
                aria-label="Notifications"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            ) : null}
          </header>
        ) : null}

        <main className="flex-1 pb-6">
          {children}
        </main>
      </div>

      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
