"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoleAccess, type Permission } from "@/hooks/useRoleAccess";
import { ROUTES } from "@/lib/routes";

interface Tab {
  readonly href: string;
  readonly label: string;
  readonly permission: Permission;
  readonly icon: React.ReactNode;
  readonly alwaysVisible?: boolean;
}

const HomeIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const NotesIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SettingsIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MAIN_TABS: Tab[] = [
  { href: ROUTES.app.modules, label: "Home", permission: "view:modules", icon: HomeIcon, alwaysVisible: true },
  { href: ROUTES.app.notes.root, label: "Notes", permission: "view:notes", icon: NotesIcon },
  { href: ROUTES.app.settings, label: "Settings", permission: "view:settings", icon: SettingsIcon },
];

const BORROWER_TABS: Tab[] = [
  {
    href: ROUTES.app.portal,
    label: "Home",
    permission: "view:portal",
    icon: HomeIcon,
    alwaysVisible: true,
  },
  {
    href: ROUTES.app.settings,
    label: "Profile",
    permission: "view:settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const SUPER_ADMIN_TABS: Tab[] = [
  {
    href: ROUTES.app.superAdmin.dashboard,
    label: "Home",
    permission: "view:platform",
    icon: HomeIcon,
    alwaysVisible: true,
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
  { href: ROUTES.app.settings, label: "Settings", permission: "view:settings", icon: SettingsIcon },
];

export function BottomNav() {
  const path = usePathname();
  const { can, isBorrower, isSuperAdmin } = useRoleAccess();
  const resolveTabs = (items: Tab[]) => {
    const [home, ...rest] = items;
    const visibleHome = home ? [home] : [];
    const visibleRest = rest.filter((tab) => tab.alwaysVisible || can(tab.permission));
    return [...visibleHome, ...visibleRest];
  };

  if (isSuperAdmin) {
    const tabs = resolveTabs(SUPER_ADMIN_TABS);
    return <BottomBar tabs={tabs} path={path} />;
  }

  if (isBorrower) {
    const tabs = resolveTabs(BORROWER_TABS);
    return <BottomBar tabs={tabs} path={path} />;
  }

  const tabs = resolveTabs(MAIN_TABS);
  return <BottomBar tabs={tabs} path={path} />;
}

function BottomBar({
  tabs,
  path,
}: Readonly<{
  tabs: Tab[];
  path: string;
}>) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-surface/95 backdrop-blur-md">
      <ul className="grid gap-0 h-16" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab, idx) => {
          const isActive = path === tab.href || (tab.href !== "/" && path.startsWith(tab.href + "/"));
          return (
            <li key={tab.href + idx} className="relative">
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${
                  isActive ? "text-[var(--sidebar-active-text)]" : "text-muted hover:text-text"
                }`}
              >
                <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>{tab.icon}</span>
                <span className={`text-[10px] font-semibold leading-none ${isActive ? "font-bold" : ""}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-[var(--sidebar-active-text)] rounded-full" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
