"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { BrandLogo, BookMark } from "@/components/branding/BrandLogo";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLogoutMutation } from "@/features/auth/auth-api";
import { useRoleAccess, type Permission } from "@/hooks/useRoleAccess";
import type { UserModuleRole } from "@/store/auth-slice";
import { ROUTES } from "@/lib/routes";
import { getModuleContext, getModuleLabel, type ModuleContext } from "@/lib/moduleNav";
import { useSidebarState } from "@/lib/sidebar-state";
import { clearAuth } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export interface ModuleFeatureGate {
  readonly module: string;
  readonly feature: string;
}

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly permission: Permission;
  readonly groupOnly?: boolean;
  // When set, visibility is controlled by the API-driven feature map instead of
  // the legacy flat permission string. The permission field is kept as fallback
  // for items that don't yet have a module role equivalent.
  readonly moduleFeature?: ModuleFeatureGate;
  readonly icon: ReactNode;
}

export interface SidebarFeatureChild {
  readonly label: string;
  readonly href: string;
}

export interface SidebarFeatureItem extends NavItem {
  readonly children?: SidebarFeatureChild[];
}

export interface SidebarFeatureSection {
  readonly title: string;
  readonly items: SidebarFeatureItem[];
}

export const MAIN_NAV: NavItem[] = [
  {
    href: ROUTES.app.loans.dashboard,
    label: "Loan Management",
    permission: "view:dashboard",
    moduleFeature: { module: "loans", feature: "dashboard" },
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
  {
    href: ROUTES.app.jewellery.dashboard,
    label: "Jewellery ERP",
    permission: "view:modules",
    moduleFeature: { module: "jewellery", feature: "dashboard" },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 6-8 12L4 9l8-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.modules,
    label: "Modules",
    permission: "view:modules",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h7v7H4V6zm9 0h7v7h-7V6zM4 15h7v3H4v-3zm9 0h7v3h-7v-3z" />
      </svg>
    ),
  },
];

export const LOAN_MODULE_NAV: NavItem[] = [
  {
    href: ROUTES.app.loans.dashboard,
    label: "Dashboard",
    permission: "view:dashboard",
    moduleFeature: { module: "loans", feature: "dashboard" },
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
    moduleFeature: { module: "loans", feature: "borrowers" },
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
    moduleFeature: { module: "loans", feature: "collections" },
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
    moduleFeature: { module: "loans", feature: "reports" },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.loans.locations,
    label: "Locations",
    permission: "view:borrowers",
    moduleFeature: { module: "loans", feature: "locations" },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: ROUTES.app.team,
    label: "Team",
    permission: "view:team",
    moduleFeature: { module: "loans", feature: "team" },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

export const JEWELLERY_MODULE_NAV: NavItem[] = [
  { href: ROUTES.app.jewellery.dashboard, label: "Dashboard", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "dashboard" }, icon: LOAN_MODULE_NAV[0].icon },
  { href: ROUTES.app.jewellery.billing, label: "Billing & Sales", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "billing" }, icon: LOAN_MODULE_NAV[2].icon },
  { href: ROUTES.app.jewellery.inventory, label: "Stock & Inventory", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "inventory" }, icon: LOAN_MODULE_NAV[1].icon },
  { href: ROUTES.app.jewellery.master, label: "Jewellery Master", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "master" }, icon: NOTES_MODULE_NAV[0].icon },
  { href: ROUTES.app.jewellery.karigar, label: "Order & Karigar", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "karigar" }, icon: LOAN_MODULE_NAV[5].icon },
  { href: ROUTES.app.jewellery.accounts, label: "Accounts", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "accounts" }, icon: LOAN_MODULE_NAV[2].icon },
  { href: ROUTES.app.jewellery.gstReports, label: "GST & Reports", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "gst" }, icon: LOAN_MODULE_NAV[3].icon },
  { href: ROUTES.app.jewellery.outstanding, label: "Party Outstanding", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "outstanding" }, icon: LEDGER_MODULE_NAV[0].icon },
  { href: ROUTES.app.jewellery.pledge, label: "Gold Pledge Loans", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "pledge" }, icon: MAIN_NAV[0].icon },
  { href: ROUTES.app.jewellery.usersRoles, label: "Users & Roles", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "users_roles" }, icon: LOAN_MODULE_NAV[1].icon },
  { href: ROUTES.app.jewellery.multiBranch, label: "Multi-Branch", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "multi_branch" }, icon: LOAN_MODULE_NAV[5].icon },
  { href: ROUTES.app.jewellery.barcodeRfid, label: "Barcode / RFID", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "barcode" }, icon: NOTES_MODULE_NAV[0].icon },
  {
    href: ROUTES.app.jewellery.rates,
    label: "MCX Live Rate",
    permission: "view:modules",
    moduleFeature: { module: "jewellery", feature: "rates" },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h16" />
      </svg>
    ),
  },
  { href: ROUTES.app.jewellery.notifications, label: "Notifications", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "notifications" }, icon: MAIN_NAV[2].icon },
  { href: ROUTES.app.jewellery.mobile, label: "Mobile App", permission: "view:modules", moduleFeature: { module: "jewellery", feature: "mobile" }, icon: LOAN_MODULE_NAV[0].icon },
  {
    href: ROUTES.app.jewellery.admin,
    label: "Admin Controls",
    permission: "view:modules",
    moduleFeature: { module: "jewellery", feature: "admin" },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

export const MODULE_SWITCH_NAV: NavItem = {
  href: ROUTES.app.modules,
  label: "Modules",
  permission: "view:modules",
  groupOnly: true,
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h7v7H4V6zm9 0h7v7h-7V6zM4 15h7v3H4v-3zm9 0h7v3h-7v-3z" />
    </svg>
  ),
};

export const MODULE_LIST_NAV: NavItem[] = [
  {
    href: ROUTES.app.udhaarbook.root,
    label: "Udhaar Book",
    permission: "view:customer-ledger",
    icon: MAIN_NAV[1].icon,
  },
  {
    href: ROUTES.app.loans.dashboard,
    label: "Loan Management",
    permission: "view:dashboard",
    moduleFeature: { module: "loans", feature: "dashboard" },
    icon: MAIN_NAV[0].icon,
  },
  {
    href: ROUTES.app.jewellery.dashboard,
    label: "Jewellery ERP",
    permission: "view:modules",
    moduleFeature: { module: "jewellery", feature: "dashboard" },
    icon: MAIN_NAV[3].icon,
  },
];

export const APP_SUB_NAV: Readonly<Record<string, NavItem[]>> = {
  [ROUTES.app.loans.dashboard]: LOAN_MODULE_NAV,
  [ROUTES.app.udhaarbook.root]: LEDGER_MODULE_NAV,
  [ROUTES.app.notes.root]: NOTES_MODULE_NAV,
  [ROUTES.app.jewellery.dashboard]: JEWELLERY_MODULE_NAV,
  [ROUTES.app.modules]: MODULE_LIST_NAV,
};

const MODULE_CONTEXT_PRIMARY: Readonly<Record<Exclude<ModuleContext, null>, NavItem[]>> = {
  loans: LOAN_MODULE_NAV,
  ledger: LEDGER_MODULE_NAV,
  notes: NOTES_MODULE_NAV,
  jewellery: JEWELLERY_MODULE_NAV,
};

export function isPathActive(pathname: string, href: string): boolean {
  const parseRoute = (value: string) => {
    const url = new URL(value.startsWith("/") ? `https://app.local${value}` : value);
    return { pathname: url.pathname, query: url.searchParams };
  };

  const current = parseRoute(pathname);
  const target = parseRoute(href);

  if (current.pathname !== target.pathname && !(target.pathname !== "/" && current.pathname.startsWith(`${target.pathname}/`))) {
    return false;
  }

  const targetQueryEntries = Array.from(target.query.entries());
  if (targetQueryEntries.length === 0) return true;

  return targetQueryEntries.every(([key, value]) => current.query.get(key) === value);
}

export const isJewelleryPath = (pathname: string): boolean =>
  pathname === ROUTES.app.jewellery.root || pathname.startsWith(`${ROUTES.app.jewellery.root}/`);

export const JEWELLERY_FEATURE_SECTIONS: ReadonlyArray<SidebarFeatureSection> = [
  {
    title: "Overview",
    items: [
      {
        href: ROUTES.app.jewellery.dashboard,
        label: "Dashboard",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "dashboard" },
        icon: LOAN_MODULE_NAV[0].icon,
      },
    ],
  },
  {
    title: "Modules 1-8",
    items: [
      {
        href: ROUTES.app.jewellery.billing,
        label: "Billing & Sales",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "billing" },
        icon: LOAN_MODULE_NAV[2].icon,
        children: [
          { label: "Tax invoice (GST)", href: `${ROUTES.app.jewellery.billing}?view=tax-invoice` },
          { label: "Estimate / Quotation", href: `${ROUTES.app.jewellery.billing}?view=estimate` },
          { label: "Sale return / credit note", href: `${ROUTES.app.jewellery.billing}?view=sale-return` },
          { label: "Old gold exchange", href: `${ROUTES.app.jewellery.billing}?view=old-gold` },
          { label: "E-invoice (IRN+QR)", href: `${ROUTES.app.jewellery.billing}?view=einvoice` },
          { label: "Split payment modes", href: `${ROUTES.app.jewellery.billing}?view=split-payment` },
          { label: "Print templates", href: `${ROUTES.app.jewellery.billing}?view=print` },
          { label: "WhatsApp / SMS send", href: `${ROUTES.app.jewellery.billing}?view=messages` },
        ],
      },
      {
        href: ROUTES.app.jewellery.inventory,
        label: "Stock & Inventory",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "inventory" },
        icon: LOAN_MODULE_NAV[1].icon,
        children: [
          { label: "Item master", href: `${ROUTES.app.jewellery.inventory}?view=item-master` },
          { label: "Purity tracking", href: `${ROUTES.app.jewellery.inventory}?view=purity` },
          { label: "Barcode / QR / RFID tagging", href: ROUTES.app.jewellery.barcodeRfid },
          { label: "HUID / BIS hallmark", href: `${ROUTES.app.jewellery.inventory}?view=huid` },
          { label: "Physical stock-take", href: `${ROUTES.app.jewellery.inventory}?view=stock-take` },
          { label: "Live MCX valuation", href: ROUTES.app.jewellery.rates },
          { label: "Item chain of custody", href: `${ROUTES.app.jewellery.inventory}?view=chain-of-custody` },
        ],
      },
      {
        href: ROUTES.app.jewellery.karigar,
        label: "Order & Karigar",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "karigar" },
        icon: LOAN_MODULE_NAV[5].icon,
        children: [
          { label: "Customer order", href: `${ROUTES.app.jewellery.karigar}?view=customer-order` },
          { label: "Metal issue voucher", href: `${ROUTES.app.jewellery.karigar}?view=metal-issue` },
          { label: "Karigar receipt", href: `${ROUTES.app.jewellery.karigar}?view=receipt` },
          { label: "Tunch reconciliation", href: `${ROUTES.app.jewellery.karigar}?view=tunch` },
          { label: "Wastage reconciliation", href: `${ROUTES.app.jewellery.karigar}?view=wastage` },
          { label: "Labour bill", href: `${ROUTES.app.jewellery.karigar}?view=labour-bill` },
          { label: "Repair / alteration", href: `${ROUTES.app.jewellery.karigar}?view=repair` },
        ],
      },
      {
        href: ROUTES.app.jewellery.accounts,
        label: "Accounts & Ledger",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "accounts" },
        icon: JEWELLERY_MODULE_NAV[5].icon,
      },
      {
        href: ROUTES.app.jewellery.gstReports,
        label: "GST & Reports",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "gst" },
        icon: JEWELLERY_MODULE_NAV[6].icon,
      },
      {
        href: ROUTES.app.jewellery.outstanding,
        label: "Party Outstanding",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "outstanding" },
        icon: JEWELLERY_MODULE_NAV[7].icon,
      },
      {
        href: ROUTES.app.jewellery.pledge,
        label: "Gold Pledge Loans",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "pledge" },
        icon: JEWELLERY_MODULE_NAV[8].icon,
        children: [
          { label: "KYC capture", href: `${ROUTES.app.jewellery.pledge}?view=kyc` },
          { label: "Pledge entry", href: `${ROUTES.app.jewellery.pledge}?view=pledge-entry` },
          { label: "Loan disbursal", href: `${ROUTES.app.jewellery.pledge}?view=loan-disbursal` },
          { label: "Interest schemes", href: `${ROUTES.app.jewellery.pledge}?view=interest` },
          { label: "Top-up / Renewal", href: `${ROUTES.app.jewellery.pledge}?view=renewal` },
          { label: "Foreclosure", href: `${ROUTES.app.jewellery.pledge}?view=foreclosure` },
          { label: "Auction & P&L", href: `${ROUTES.app.jewellery.pledge}?view=auction` },
        ],
      },
    ],
  },
  {
    title: "Modules 9-15",
    items: [
      {
        href: ROUTES.app.jewellery.usersRoles,
        label: "Users & Roles",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "users_roles" },
        icon: JEWELLERY_MODULE_NAV[9].icon,
      },
      {
        href: ROUTES.app.jewellery.multiBranch,
        label: "Multi-Branch",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "multi_branch" },
        icon: JEWELLERY_MODULE_NAV[10].icon,
      },
      {
        href: ROUTES.app.jewellery.barcodeRfid,
        label: "Barcode / RFID",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "barcode" },
        icon: JEWELLERY_MODULE_NAV[11].icon,
      },
      {
        href: ROUTES.app.jewellery.rates,
        label: "MCX Live Rate",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "rates" },
        icon: JEWELLERY_MODULE_NAV[12].icon,
      },
      {
        href: ROUTES.app.jewellery.notifications,
        label: "Notifications",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "notifications" },
        icon: JEWELLERY_MODULE_NAV[13].icon,
      },
      {
        href: ROUTES.app.jewellery.admin,
        label: "Admin Controls",
        permission: "view:modules",
        moduleFeature: { module: "jewellery", feature: "admin" },
        icon: JEWELLERY_MODULE_NAV[15].icon,
      },
    ],
  },
];

export /**
 * Builds a canSeeItem checker for the current user's module roles.
 * When a nav item declares moduleFeature, we check the API-driven features map.
 * Otherwise we fall back to the flat permission string.
 */
function buildCanSeeItem(
  moduleRoles: UserModuleRole[],
  can: (permission: Permission) => boolean,
) {
  function getFeatureAccess(module: string, feature: string): { read: boolean } {
    const matching = moduleRoles.filter((r) => r.module === module && r.is_active);
    return { read: matching.some((r) => r.features?.[feature]?.read === true) };
  }

  return function canSeeItem(item: NavItem): boolean {
    if (item.moduleFeature) {
      return getFeatureAccess(item.moduleFeature.module, item.moduleFeature.feature).read;
    }
    return can(item.permission);
  };
}

function getVisibleSubItems(
  parentHref: string,
  canSeeItem: (item: NavItem) => boolean,
): NavItem[] {
  const subItems = APP_SUB_NAV[parentHref] ?? [];
  return subItems.filter(canSeeItem);
}

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

function NavGroupLink({
  item,
  childrenItems,
  pathname,
  collapsed,
  expanded,
  onToggle,
}: Readonly<{
  item: NavItem;
  childrenItems: NavItem[];
  pathname: string;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
}>) {
  const hasChildren = childrenItems.length > 0;
  const childIsActive = childrenItems.some((child) => isPathActive(pathname, child.href));
  const parentIsActive = isPathActive(pathname, item.href);
  const groupIsActive = parentIsActive || childIsActive;

  if (collapsed || !hasChildren) {
    return <NavLink item={item} isActive={groupIsActive} collapsed={collapsed} />;
  }

  return (
    <div className="space-y-1">
      <div
        className={[
          "flex items-center rounded-xl transition-all duration-150",
          groupIsActive
            ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
            : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)] hover:text-[var(--sidebar-active-text)]",
        ].join(" ")}
      >
        {item.groupOnly ? (
          <button
            type="button"
            onClick={() => {
              if (hasChildren) onToggle();
            }}
            className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0 text-left"
          >
            <span className="text-primary-500 flex-shrink-0">{item.icon}</span>
            <span className="text-sm truncate">{item.label}</span>
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={(event) => {
              if (hasChildren) {
                event.preventDefault();
                onToggle();
              }
            }}
            className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0"
          >
            <span className="text-primary-500 flex-shrink-0">{item.icon}</span>
            <span className="text-sm truncate">{item.label}</span>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="h-full px-2.5 py-2.5 text-muted hover:text-text transition-colors"
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
      </div>

      {expanded ? (
        <div className="ml-4 border-l border-border pl-2 space-y-1">
          {childrenItems.map((subItem) => (
            <NavLink
              key={subItem.href}
              item={subItem}
              isActive={isPathActive(pathname, subItem.href)}
              collapsed={false}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ModuleFeatureGroup({
  item,
  pathname,
  collapsed,
  expanded,
  onToggle,
}: Readonly<{
  item: SidebarFeatureItem;
  pathname: string;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
}>) {
  const childItems = item.children ?? [];
  const hasChildren = childItems.length > 0;
  const childActive = childItems.some((child) => isPathActive(pathname, child.href));
  const groupIsActive = isPathActive(pathname, item.href) || childActive;

  if (collapsed || !hasChildren) {
    return <NavLink item={item} isActive={groupIsActive} collapsed={collapsed} />;
  }

  return (
    <div className="space-y-1">
      <div
        className={[
          "flex items-center rounded-xl transition-all duration-150",
          groupIsActive
            ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
            : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)] hover:text-[var(--sidebar-active-text)]",
        ].join(" ")}
      >
        <Link
          href={item.href}
          onClick={(event) => {
            event.preventDefault();
            onToggle();
          }}
          className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0"
        >
          <span className="text-primary-500 flex-shrink-0">{item.icon}</span>
          <span className="text-sm truncate">{item.label}</span>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="h-full px-2.5 py-2.5 text-muted hover:text-text transition-colors"
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
      </div>

      {expanded ? (
        <div className="ml-7 border-l border-border pl-2 space-y-0.5">
          {childItems.map((child) => (
            <Link
              key={`${item.href}-${child.label}`}
              href={child.href}
              className={[
                "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                isPathActive(pathname, child.href)
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
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, isSuperAdmin, isBorrower } = useRoleAccess();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const { collapsed, toggle } = useSidebarState();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedJewelleryGroups, setExpandedJewelleryGroups] = useState<Record<string, boolean>>({});
  const currentRoute = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const moduleRoles = currentUser?.module_roles ?? [];
  const canSeeItem = buildCanSeeItem(moduleRoles, can);
  const moduleContext = getModuleContext(pathname);
  const inJewelleryModule = moduleContext === "jewellery" && !isSuperAdmin && !isBorrower;

  const isActive = (href: string) => isPathActive(currentRoute, href);

  let homeHref: string = ROUTES.app.modules;
  if (isSuperAdmin) homeHref = ROUTES.app.superAdmin.dashboard;
  else if (isBorrower) homeHref = ROUTES.app.portal;

  let primaryNav: NavItem[] = MAIN_NAV;
  if (isSuperAdmin) primaryNav = SUPER_ADMIN_NAV;
  else if (isBorrower) primaryNav = BORROWER_NAV;

  const visibleApps = primaryNav.filter(canSeeItem);
  const visibleAppTools = [
    NOTES_MODULE_NAV[0],
    MODULE_SWITCH_NAV,
  ].filter(canSeeItem);
  const activeModuleNav =
    !isSuperAdmin && !isBorrower && moduleContext ? MODULE_CONTEXT_PRIMARY[moduleContext].filter(canSeeItem) : [];
  const visibleJewellerySections = JEWELLERY_FEATURE_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(canSeeItem),
  })).filter((section) => section.items.length > 0);

  useEffect(() => {
    if (inJewelleryModule || (!isSuperAdmin && !isBorrower)) return;
    setExpandedGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of visibleApps) {
        const subItems = getVisibleSubItems(item.href, canSeeItem);
        const shouldExpand =
          isPathActive(currentRoute, item.href) || subItems.some((subItem) => isPathActive(currentRoute, subItem.href));
        if (shouldExpand && !next[item.href]) {
          next[item.href] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [currentRoute, visibleApps, canSeeItem, inJewelleryModule, isSuperAdmin, isBorrower]);

  useEffect(() => {
    if (!inJewelleryModule) return;
    setExpandedJewelleryGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const section of visibleJewellerySections) {
        for (const item of section.items) {
          const children = item.children ?? [];
          const shouldExpand =
            isPathActive(currentRoute, item.href) ||
            children.some((child) => isPathActive(currentRoute, child.href));
          if (shouldExpand && !next[item.href]) {
            next[item.href] = true;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [currentRoute, inJewelleryModule, visibleJewellerySections]);

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
        {isSuperAdmin || isBorrower ? (
          <>
            {!collapsed && (
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                Apps
              </p>
            )}
            {visibleApps.map((item) => {
              const subItems = getVisibleSubItems(item.href, canSeeItem);
              const expanded = expandedGroups[item.href] ?? false;
              return (
                <NavGroupLink
                  key={item.href}
                  item={item}
                  childrenItems={subItems}
                  pathname={currentRoute}
                  collapsed={collapsed}
                  expanded={expanded}
                  onToggle={() =>
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [item.href]: !(prev[item.href] ?? false),
                    }))
                  }
                />
              );
            })}
          </>
        ) : inJewelleryModule ? (
          visibleJewellerySections.map((section, sectionIndex) => (
            <div key={`${section.title}-${sectionIndex}`} className="space-y-1">
              {section.items.map((item) => (
                <ModuleFeatureGroup
                  key={item.href}
                  item={item}
                  pathname={currentRoute}
                  collapsed={collapsed}
                  expanded={expandedJewelleryGroups[item.href] ?? false}
                  onToggle={() =>
                    setExpandedJewelleryGroups((prev) => ({
                      ...prev,
                      [item.href]: !(prev[item.href] ?? false),
                    }))
                  }
                />
              ))}
            </div>
          ))
        ) : moduleContext ? (
          <>
            {!collapsed && (
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                {getModuleLabel(moduleContext)}
              </p>
            )}
            {activeModuleNav.map((item) => {
              return (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={collapsed} />
              );
            })}
          </>
        ) : (
          canSeeItem(MODULE_SWITCH_NAV) ? (
            <NavLink item={MODULE_SWITCH_NAV} isActive={isActive(MODULE_SWITCH_NAV.href)} collapsed={collapsed} />
          ) : null
        )}

        {!isSuperAdmin && !isBorrower && moduleContext && visibleAppTools.length > 0 ? (
          <div className="mt-3 pt-3 border-t border-border/70 space-y-1">
            {!collapsed && (
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                Apps
              </p>
            )}
            {visibleAppTools.map((item) => {
              const subItems = getVisibleSubItems(item.href, canSeeItem);
              const expanded = expandedGroups[item.href] ?? false;
              if (subItems.length === 0) {
                return (
                  <NavLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={collapsed} />
                );
              }
              return (
                <NavGroupLink
                  key={item.href}
                  item={item}
                  childrenItems={subItems}
                  pathname={currentRoute}
                  collapsed={collapsed}
                  expanded={expanded}
                  onToggle={() =>
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [item.href]: !(prev[item.href] ?? false),
                    }))
                  }
                />
              );
            })}
          </div>
        ) : null}
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
