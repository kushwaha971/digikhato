export const ROUTES = {
  public: {
    home: "/",
    login: "/login",
    signup: "/signup",
    onboarding: "/onboarding",
    resetPassword: "/reset-password",
  },
  app: {
    moduleAccess: "/module-access",
    modules: "/modules",
    settings: "/settings",
    notifications: "/notifications",
    portal: "/portal",
    team: "/team",
    udhaarbook: {
      root: "/udhaarbook",
      party: (id: string | number) => `/udhaarbook/${id}`,
    },
    notes: {
      root: "/notes",
      new: "/notes/new",
      detail: (id: string | number) => `/notes/${id}`,
    },
    jewellery: {
      root: "/jewellery",
      dashboard: "/jewellery/dashboard",
      billing: "/jewellery/billing",
      billingNew: "/jewellery/billing/new",
      billingInvoice: (id: string | number) => `/jewellery/billing/${id}`,
      billingOldGoldNew: "/jewellery/billing/old-gold/new",
      inventory: "/jewellery/inventory",
      master: "/jewellery/master",
      karigar: "/jewellery/karigar",
      accounts: "/jewellery/accounts",
      gstReports: "/jewellery/gst-reports",
      outstanding: "/jewellery/outstanding",
      pledge: "/jewellery/gold-pledge",
      usersRoles: "/jewellery/users-roles",
      multiBranch: "/jewellery/multi-branch",
      barcodeRfid: "/jewellery/barcode-rfid",
      reports: "/jewellery/reports",
      rates: "/jewellery/settings/rates",
      notifications: "/jewellery/notifications",
      mobile: "/jewellery/mobile",
      admin: "/jewellery/admin",
      customers: "/jewellery/customers",
    },
    loans: {
      root: "/loans",
      dashboard: "/loans/dashboard",
      borrowers: "/loans/borrowers",
      borrower: (id: string | number) => `/loans/borrowers/${id}`,
      addBorrower: "/loans/borrowers/add",
      collections: "/loans/collections",
      collection: (id: string | number) => `/loans/collections/${id}`,
      collectionEdit: (id: string | number) => `/loans/collections/${id}/edit`,
      collectionsToday: "/loans/collections/today",
      collectionsHistory: "/loans/collections/history",
      collectionsEntry: "/loans/collections/entry",
      reports: "/loans/reports",
      overdue: "/loans/overdue",
      locations: "/loans/locations",
      addLocation: "/loans/locations/add",
      location: (id: string | number) => `/loans/locations/${id}`,
      locationEdit: (id: string | number) => `/loans/locations/${id}/edit`,
    },
    superAdmin: {
      dashboard: "/super-admin/dashboard",
      tenants: "/super-admin/tenants",
      accessRequests: "/super-admin/access-requests",
    },
  },
} as const;

export type AppModuleCode = "udhaar" | "loans" | "jewellery";

export const APP_MODULES: readonly AppModuleCode[] = ["udhaar", "loans", "jewellery"] as const;

export function normalizeModuleCode(value: string | null | undefined): AppModuleCode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "jwl") return "jewellery";
  if (normalized === "udhaarbook" || normalized === "ledger") return "udhaar";
  if (normalized === "loan" || normalized === "loan_management") return "loans";
  if ((APP_MODULES as readonly string[]).includes(normalized)) {
    return normalized as AppModuleCode;
  }
  return null;
}

export function getModuleLandingRoute(module: AppModuleCode): string {
  if (module === "loans") return ROUTES.app.loans.dashboard;
  if (module === "jewellery") return ROUTES.app.jewellery.dashboard;
  return ROUTES.app.udhaarbook.root;
}

export function getModuleFromPath(pathname: string): AppModuleCode | null {
  if (
    pathname === ROUTES.app.loans.root ||
    pathname.startsWith(`${ROUTES.app.loans.root}/`) ||
    pathname === ROUTES.app.team ||
    pathname.startsWith(`${ROUTES.app.team}/`)
  ) {
    return "loans";
  }
  if (
    pathname === ROUTES.app.jewellery.root ||
    pathname.startsWith(`${ROUTES.app.jewellery.root}/`)
  ) {
    return "jewellery";
  }
  if (
    pathname === ROUTES.app.udhaarbook.root ||
    pathname.startsWith(`${ROUTES.app.udhaarbook.root}/`) ||
    pathname === "/customer-ledger" ||
    pathname.startsWith("/customer-ledger/")
  ) {
    return "udhaar";
  }
  return null;
}
