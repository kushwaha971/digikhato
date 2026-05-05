"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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
  const [requestedModules, setRequestedModules] = useState<Set<AppModuleCode>>(new Set());
  const [confirmRequestModule, setConfirmRequestModule] = useState<ModuleCard | null>(null);

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
      // Non-blocking — proceed to navigate regardless
    } finally {
      setPendingModuleKey(null);
    }
    router.push(getModuleLandingRoute(module.key));
  };

  const handleRequestAccess = async (module: ModuleCard, mode: "request" | "self_onboard") => {
    setPendingModuleKey(module.key);
    try {
      await requestModuleAccess({ module: module.key, mode }).unwrap();
      if (mode === "request") {
        setRequestedModules((prev) => new Set(prev).add(module.key));
      }
    } finally {
      setPendingModuleKey(null);
      setConfirmRequestModule(null);
    }
  };

  return (
    <Screen title="Modules" subtitle="Your workspace modules — open active ones or request access to locked ones">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {ALL_MODULES.map((module) => {
          const hasAccess = accessibleModules.includes(module.key);
          const isPending = pendingModuleKey === module.key;
          const isModuleAdminUser = hasAccess && isModuleAdmin(currentUser, module.key);
          const alreadyRequested = requestedModules.has(module.key);

          const canRequest = !hasAccess && allowRequestAccess && (
            requestableModules.length === 0 || requestableModules.includes(module.key)
          );
          const canSelfOnboardByPolicy = allowSelfOnboard && selfOnboardableModules.includes(module.key);
          const canSelfOnboardByBackend = canSelfOnboardFromModuleAdmin(currentUser?.module_admin, module.key);
          const canSelfOnboard = !hasAccess && (canSelfOnboardByPolicy || canSelfOnboardByBackend);

          const articleClass = hasAccess
            ? "app-panel rounded-2xl p-5 flex flex-col gap-4 relative"
            : "app-panel rounded-2xl p-5 flex flex-col gap-4 relative opacity-90";

          const iconClass = hasAccess
            ? "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-medium"
            : "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-medium grayscale opacity-60";

          let accessLabel: string;
          if (hasAccess) {
            accessLabel = "Access granted";
          } else if (alreadyRequested) {
            accessLabel = "Request submitted — awaiting approval";
          } else {
            accessLabel = "Access restricted";
          }

          return (
            <article key={module.key} className={articleClass}>
              {/* Lock badge for inaccessible modules */}
              {hasAccess ? null : (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-0.5">
                  <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-[10px] text-muted font-medium">Locked</span>
                </div>
              )}

              <div className="flex items-start gap-4">
                <span
                  className={iconClass}
                  style={{ background: `${module.color}18`, color: module.color }}
                >
                  {module.icon}
                </span>
                <div className="min-w-0 pr-10">
                  <p className="text-base font-semibold text-text">{module.label}</p>
                  <p className="mt-1 text-sm text-muted leading-relaxed">{module.description}</p>
                  <p className="mt-2 text-xs font-medium text-muted">
                    {accessLabel}
                    {isModuleAdminUser ? " · Module admin" : ""}
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
                  {alreadyRequested ? (
                    <div className="rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-800 font-medium text-center">
                      Request pending approval
                    </div>
                  ) : (
                    <>
                      {canRequest && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setConfirmRequestModule(module)}
                          loading={isPending && isRequesting}
                          disabled={isPending}
                          fullWidth
                        >
                          Request access
                        </Button>
                      )}

                      {canSelfOnboard && (
                        <Button
                          type="button"
                          onClick={() => handleRequestAccess(module, "self_onboard")}
                          loading={isPending && isRequesting}
                          disabled={isPending}
                          fullWidth
                        >
                          Self onboard
                        </Button>
                      )}

                      {!canRequest && !canSelfOnboard && (
                        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-muted text-center">
                          Contact your admin to get access
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Request access confirmation modal */}
      <Modal
        open={confirmRequestModule !== null}
        onClose={() => setConfirmRequestModule(null)}
        title="Request Module Access"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={() => setConfirmRequestModule(null)}
              type="button"
              disabled={pendingModuleKey !== null && isRequesting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              fullWidth={false}
              type="button"
              loading={pendingModuleKey === confirmRequestModule?.key && isRequesting}
              disabled={pendingModuleKey !== null && isRequesting}
              onClick={() => confirmRequestModule && handleRequestAccess(confirmRequestModule, "request")}
            >
              Submit Request
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          You are requesting access to{" "}
          <strong className="text-text">{confirmRequestModule?.label}</strong>.
          A notification will be sent to the Super Admin for review.
          You will be notified once your request is approved or rejected.
        </p>
      </Modal>
    </Screen>
  );
}
