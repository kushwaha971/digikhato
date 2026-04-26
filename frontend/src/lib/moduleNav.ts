import { ROUTES } from "@/lib/routes";

export type ModuleContext = "loans" | "ledger" | "notes" | null;

const LOAN_PREFIXES = [
  ROUTES.app.loans.root,
  ROUTES.app.loans.borrowers,
  ROUTES.app.loans.collections,
  ROUTES.app.loans.reports,
  ROUTES.app.loans.overdue,
  ROUTES.app.loans.locations,
  ROUTES.app.team,
];

export function getModuleContext(pathname: string): ModuleContext {
  if (LOAN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return "loans";
  }
  if (
    pathname === "/customer-ledger" || // legacy support
    pathname.startsWith("/customer-ledger/") ||
    pathname === ROUTES.app.udhaarbook.root ||
    pathname.startsWith(`${ROUTES.app.udhaarbook.root}/`)
  ) {
    return "ledger";
  }
  if (pathname === ROUTES.app.notes.root || pathname.startsWith(`${ROUTES.app.notes.root}/`)) {
    return "notes";
  }
  return null;
}

export const MODULE_META: Record<
  Exclude<ModuleContext, null>,
  { label: string; backHref: string; items: Array<{ href: string; label: string }> }
> = {
  loans: {
    label: "Loan Management",
    backHref: ROUTES.app.modules,
    items: [
      { href: ROUTES.app.loans.dashboard, label: "Dashboard" },
      { href: ROUTES.app.loans.borrowers, label: "Borrowers" },
      { href: ROUTES.app.loans.collections, label: "Collections" },
      { href: ROUTES.app.loans.reports, label: "Reports" },
      { href: ROUTES.app.loans.locations, label: "Locations" },
      { href: ROUTES.app.team, label: "Team" },
    ],
  },
  ledger: {
    label: "UdhaarBook",
    backHref: ROUTES.app.modules,
    items: [
      { href: ROUTES.app.udhaarbook.root, label: "Parties" },
    ],
  },
  notes: {
    label: "Notes",
    backHref: ROUTES.app.modules,
    items: [
      { href: ROUTES.app.notes.root, label: "All Notes" },
    ],
  },
};

export function shouldShowNotifications(pathname: string): boolean {
  const module = getModuleContext(pathname);
  if (module === "loans") return true;
  return pathname === ROUTES.app.notifications;
}
