"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { Button } from "@/components/ui/Button";
import { useRequestModuleAccessMutation } from "@/features/auth/auth-api";
import { APP_MODULES, type AppModuleCode, ROUTES } from "@/lib/routes";
import { getAccessibleModules } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";

interface ModuleInfo {
  key: AppModuleCode;
  title: string;
  subtitle: string;
}

const MODULES: ModuleInfo[] = [
  { key: "udhaar", title: "UdhaarBook", subtitle: "Daily customer ledger and party tracking" },
  { key: "loans", title: "Loan Management", subtitle: "Borrowers, loan lifecycle, and collections" },
  { key: "jewellery", title: "Jewellery ERP (JWL)", subtitle: "Billing, inventory, karigar, and pledge workflows" },
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

export default function ModuleAccessPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [requestModuleAccess, { isLoading: isRequesting }] = useRequestModuleAccessMutation();
  const [pendingModule, setPendingModule] = useState<AppModuleCode | null>(null);

  const accessibleModules = useMemo(() => getAccessibleModules(currentUser), [currentUser]);

  const policy = currentUser?.module_access_policy;
  const allowRequestAccess = policy?.allow_request_access !== false;
  const allowSelfOnboard = policy?.allow_self_onboard === true;
  const requestableModules = normalizePolicyModules(policy?.requestable_modules);
  const selfOnboardableModules = normalizePolicyModules(policy?.self_onboardable_modules);

  const handleAction = async (module: AppModuleCode, mode: "request" | "self_onboard") => {
    setPendingModule(module);
    try {
      await requestModuleAccess({ module, mode }).unwrap();
    } finally {
      setPendingModule(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex justify-center mb-6">
          <BrandLogo size="md" href={ROUTES.app.moduleAccess} />
        </div>

        <section className="app-panel rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-text">No module access yet</h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Your account is active, but no modules are currently assigned. Request access to a module or self-onboard where your workspace policy allows.
          </p>

          {accessibleModules.length > 0 ? (
            <div className="mt-5 rounded-xl border border-success-300 bg-success-50 p-4 text-sm text-success-900">
              Access is already available for one or more modules.
              <div className="mt-3">
                <Link href={ROUTES.app.modules} className="text-primary-600 font-semibold hover:underline">
                  Continue to Modules
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {MODULES.map((module) => {
              const canRequest = allowRequestAccess && (requestableModules.length === 0 || requestableModules.includes(module.key));
              const canSelfOnboardByPolicy = allowSelfOnboard && selfOnboardableModules.includes(module.key);
              const canSelfOnboardByBackend = canSelfOnboardFromModuleAdmin(currentUser?.module_admin, module.key);
              const canSelfOnboard = canSelfOnboardByPolicy || canSelfOnboardByBackend;
              const isPending = pendingModule === module.key;

              return (
                <article key={module.key} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-base font-semibold text-text">{module.title}</p>
                  <p className="mt-1 text-sm text-muted">{module.subtitle}</p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    {canRequest ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAction(module.key, "request")}
                        loading={isPending && isRequesting}
                        disabled={isPending}
                      >
                        Request access
                      </Button>
                    ) : null}
                    {canSelfOnboard ? (
                      <Button
                        type="button"
                        onClick={() => handleAction(module.key, "self_onboard")}
                        loading={isPending && isRequesting}
                        disabled={isPending}
                      >
                        Self onboard
                      </Button>
                    ) : null}
                    {!canRequest && !canSelfOnboard ? (
                      <p className="text-sm text-muted">Not available for self-service. Contact admin.</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
