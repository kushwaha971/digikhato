"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { useActivateModuleMutation, useRequestModuleAccessMutation } from "@/features/auth/auth-api";
import { APP_MODULES, getModuleLandingRoute, type AppModuleCode } from "@/lib/routes";
import { getAccessibleModules, isModuleAdmin } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";

interface ModuleCard {
  key: AppModuleCode;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const ALL_MODULES: ModuleCard[] = [
  {
    key: "udhaar",
    label: "UdhaarBook",
    description: "Customer ledger, parties, and day-to-day credit tracking",
    icon: "📒",
    color: "#4F46E5",
  },
  {
    key: "loans",
    label: "Loan Management",
    description: "Borrowers, loans, daily collections, and overdue tracking",
    icon: "₹",
    color: "#185FA5",
  },
  {
    key: "jewellery",
    label: "Jewellery ERP (JWL)",
    description: "Billing, inventory, karigar, pledge, and compliance workflows",
    icon: "💎",
    color: "#C49A22",
  },
];

function normalizePolicyModules(values: string[] | undefined): AppModuleCode[] {
  if (!Array.isArray(values)) return [];
  const valid = values.filter((value): value is AppModuleCode => (APP_MODULES as readonly string[]).includes(value));
  return Array.from(new Set(valid));
}

function canSelfOnboardFromModuleAdmin(
  moduleAdmin: unknown,
  module: AppModuleCode,
): boolean {
  if (!moduleAdmin || typeof moduleAdmin !== "object" || Array.isArray(moduleAdmin)) return false;
  const entry = (moduleAdmin as Record<string, unknown>)[module];
  if (!entry || typeof entry !== "object") return false;
  return (entry as { can_self_onboard?: boolean }).can_self_onboard === true;
}

export default function ModulesPage() {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [activateModule, { isLoading: isActivating }] = useActivateModuleMutation();
  const [requestModuleAccess, { isLoading: isRequesting }] = useRequestModuleAccessMutation();
  const [pendingModuleKey, setPendingModuleKey] = useState<AppModuleCode | null>(null);

  const accessibleModules = useMemo(() => getAccessibleModules(currentUser), [currentUser]);

  const policy = currentUser?.module_access_policy;
  const requestableModules = normalizePolicyModules(policy?.requestable_modules);
  const selfOnboardableModules = normalizePolicyModules(policy?.self_onboardable_modules);
  const allowRequestAccess = policy?.allow_request_access !== false;
  const allowSelfOnboard = policy?.allow_self_onboard === true;

  const handleOpenModule = async (module: ModuleCard) => {
    setPendingModuleKey(module.key);
    try {
      await activateModule({ module: module.key }).unwrap();
    } catch {
      // Keep navigation non-blocking if activation endpoint is not required for this module.
    } finally {
      setPendingModuleKey(null);
    }
    router.push(getModuleLandingRoute(module.key));
  };

  const handleRequestAccess = async (module: ModuleCard, mode: "request" | "self_onboard") => {
    setPendingModuleKey(module.key);
    try {
      await requestModuleAccess({ module: module.key, mode }).unwrap();
    } finally {
      setPendingModuleKey(null);
    }
  };

  return (
    <Screen title="Modules" subtitle="Access modules based on your assigned roles and permissions">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {ALL_MODULES.map((module) => {
          const hasAccess = accessibleModules.includes(module.key);
          const isPending = pendingModuleKey === module.key;
          const isModuleAdminUser = hasAccess && isModuleAdmin(currentUser, module.key);

          const canRequest = !hasAccess && allowRequestAccess && (
            requestableModules.length === 0 || requestableModules.includes(module.key)
          );
          const canSelfOnboardByPolicy = allowSelfOnboard && selfOnboardableModules.includes(module.key);
          const canSelfOnboardByBackend = canSelfOnboardFromModuleAdmin(currentUser?.module_admin, module.key);
          const canSelfOnboard = !hasAccess && (canSelfOnboardByPolicy || canSelfOnboardByBackend);

          return (
            <article
              key={module.key}
              className="app-panel rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-medium"
                  style={{ background: `${module.color}18`, color: module.color }}
                >
                  {module.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-text">{module.label}</p>
                  <p className="mt-1 text-sm text-muted leading-relaxed">{module.description}</p>
                  <p className="mt-2 text-xs font-medium text-muted">
                    {hasAccess ? "Access granted" : "Access not granted"}
                    {isModuleAdminUser ? " • Module admin" : ""}
                  </p>
                </div>
              </div>

              {hasAccess ? (
                <Button
                  type="button"
                  onClick={() => handleOpenModule(module)}
                  loading={isPending && isActivating}
                  disabled={isPending}
                  fullWidth
                >
                  Open module
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  {canRequest ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRequestAccess(module, "request")}
                      loading={isPending && isRequesting}
                      disabled={isPending}
                      fullWidth
                    >
                      Request access
                    </Button>
                  ) : null}

                  {canSelfOnboard ? (
                    <Button
                      type="button"
                      onClick={() => handleRequestAccess(module, "self_onboard")}
                      loading={isPending && isRequesting}
                      disabled={isPending}
                      fullWidth
                    >
                      Self onboard
                    </Button>
                  ) : null}

                  {!canRequest && !canSelfOnboard ? (
                    <p className="text-sm text-muted">Contact your module admin to get access.</p>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Screen>
  );
}
