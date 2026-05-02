"use client";
import { useRoleAccess, useFeatureFlag } from "@/hooks/useRoleAccess";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface ModuleCard {
  key: string;
  label: string;
  description: string;
  icon: string;
  href: string;
  /** If set, only render when feature_flags[featureFlag] === true */
  featureFlag?: string;
  /** Minimum platform role required to see this card */
  requiredRole?: "admin" | "collector" | "borrower";
  color: string;
}

const ALL_MODULES: ModuleCard[] = [
  {
    key: "loans",
    label: "Loan Management",
    description: "Borrowers, loans, daily collections, overdue tracking",
    icon: "₹",
    href: ROUTES.app.loans.dashboard,
    color: "#185FA5",
  },
  {
    key: "customer-ledger",
    label: "Udhaar Book",
    description: "Customer credit, digital khata, payment reminders",
    icon: "📒",
    href: "/customer-ledger",
    color: "#0F6E56",
  },
  {
    key: "notes",
    label: "Notes",
    description: "Quick notes and reminders for your business",
    icon: "📝",
    href: "/notes",
    color: "#854F0B",
  },
  {
    key: "jewellery",
    label: "Jewellery ERP",
    description: "Billing, inventory, karigar, gold pledge loans, GST reports",
    icon: "💎",
    href: "/jewellery",
    featureFlag: "jewellery",
    requiredRole: "admin",
    color: "#C49A22",
  },
];

export default function ModulesPage() {
  const router = useRouter();
  const { isAdmin } = useRoleAccess();
  const jewelleryEnabled = useFeatureFlag("jewellery");

  const visibleModules = ALL_MODULES.filter((m) => {
    if (m.featureFlag === "jewellery" && !jewelleryEnabled) return false;
    if (m.requiredRole === "admin" && !isAdmin) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">Modules</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Select a module to get started
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleModules.map((mod) => (
          <button
            key={mod.key}
            onClick={() => router.push(mod.href)}
            className="flex items-start gap-4 p-4 rounded-xl border border-[var(--color-border-tertiary)]
                       bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-primary)]
                       text-left transition-colors w-full"
          >
            <span
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium"
              style={{ background: `${mod.color}18`, color: mod.color }}
            >
              {mod.icon}
            </span>
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)] mb-0.5">
                {mod.label}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {mod.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {isAdmin && !jewelleryEnabled && (
        <p className="mt-6 text-xs text-[var(--color-text-tertiary)]">
          Jewellery ERP is not activated for your account. Contact support to enable it.
        </p>
      )}
    </div>
  );
}
