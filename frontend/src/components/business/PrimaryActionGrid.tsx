"use client";

import Link from "next/link";

import { useRoleAccess } from "@/hooks/useRoleAccess";

const adminActions = [
  { href: "/borrowers/add", label: "Add Borrower", desc: "Onboard new borrower" },
  { href: "/borrowers", label: "Search Borrower", desc: "Open existing borrower" },
  { href: "/loans/create", label: "Create Loan", desc: "New loan for borrower" },
  { href: "/collections/today", label: "Start Collection", desc: "Collect today payment" },
];

const collectorActions = [
  { href: "/borrowers", label: "Search Borrower", desc: "Primary action" },
  { href: "/collections/today", label: "Start Collection", desc: "Primary action" },
  { href: "/collections/today", label: "Today Due List", desc: "View due borrowers" },
];

export function PrimaryActionGrid() {
  const { isAdmin } = useRoleAccess();
  const items = isAdmin ? adminActions : collectorActions;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className="rounded-xl border border-brand-100 bg-brand-50 p-3"
        >
          <p className="text-sm font-bold text-brand-700">{item.label}</p>
          <p className="mt-1 text-xs text-brand-700/80">{item.desc}</p>
        </Link>
      ))}
    </div>
  );
}
