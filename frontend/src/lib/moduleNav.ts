import { ROUTES } from "@/lib/routes";

export type ModuleContext = "loans" | "ledger" | "notes" | "jewellery" | null;

const LOAN_PREFIXES = [
  ROUTES.app.loans.root,
  ROUTES.app.loans.borrowers,
  ROUTES.app.loans.collections,
  ROUTES.app.loans.reports,
  ROUTES.app.loans.overdue,
  ROUTES.app.loans.locations,
  ROUTES.app.team,
];

const JEWELLERY_PREFIXES = [ROUTES.app.jewellery.root];

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
  if (JEWELLERY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "jewellery";
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
  jewellery: {
    label: "Jewellery ERP",
    backHref: ROUTES.app.modules,
    items: [
      { href: ROUTES.app.jewellery.dashboard, label: "Dashboard" },
      { href: ROUTES.app.jewellery.billing, label: "Billing & Sales" },
      { href: ROUTES.app.jewellery.inventory, label: "Stock & Inventory" },
      { href: ROUTES.app.jewellery.master, label: "Jewellery Master" },
      { href: ROUTES.app.jewellery.karigar, label: "Order & Karigar" },
      { href: ROUTES.app.jewellery.accounts, label: "Accounts" },
      { href: ROUTES.app.jewellery.gstReports, label: "GST & Reports" },
      { href: ROUTES.app.jewellery.outstanding, label: "Party Outstanding" },
      { href: ROUTES.app.jewellery.pledge, label: "Gold Pledge Loans" },
      { href: ROUTES.app.jewellery.usersRoles, label: "Users & Roles" },
      { href: ROUTES.app.jewellery.multiBranch, label: "Multi-Branch" },
      { href: ROUTES.app.jewellery.barcodeRfid, label: "Barcode / RFID" },
      { href: ROUTES.app.jewellery.settings, label: "Settings" },
      { href: ROUTES.app.jewellery.rates, label: "MCX Live Rate" },
      { href: ROUTES.app.jewellery.notifications, label: "Notifications" },
      { href: ROUTES.app.jewellery.mobile, label: "Mobile App" },
      { href: ROUTES.app.jewellery.admin, label: "Admin Controls" },
    ],
  },
};

export function shouldShowNotifications(pathname: string): boolean {
  const module = getModuleContext(pathname);
  if (module === "loans") return true;
  return pathname === ROUTES.app.notifications;
}

export function getModuleLabel(module: ModuleContext): string {
  if (module === "loans") return "Loan Management";
  if (module === "ledger") return "UdhaarBook";
  if (module === "notes") return "Notes";
  if (module === "jewellery") return "Jewellery ERP";
  return "Module";
}
