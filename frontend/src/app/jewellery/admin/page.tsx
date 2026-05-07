"use client";

import { useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ROUTES } from "@/lib/routes";
import {
  useGetAdminFeatureFlagsQuery,
  useListAdminTrashQuery,
  useRestoreFromTrashMutation,
  useSetLockPeriodMutation,
  useUpdateAdminFeatureFlagsMutation,
  type JwlAdminFlags,
} from "@/store/jewellery-api";

// ─── Feature Flags Section ────────────────────────────────────────────────────

function FeatureFlagsSection() {
  const { data: remoteFlags, isLoading } = useGetAdminFeatureFlagsQuery();
  const [updateAdminFeatureFlags, { isLoading: isSaving }] = useUpdateAdminFeatureFlagsMutation();
  const [localFlags, setLocalFlags] = useState<JwlAdminFlags | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Use local overrides if present, otherwise fall back to server state
  const flags: JwlAdminFlags = localFlags ?? remoteFlags ?? {};

  function toggleFlag(key: string) {
    setLocalFlags((prev) => {
      const base = prev ?? remoteFlags ?? {};
      return { ...base, [key]: !base[key] };
    });
    setSuccessMsg("");
    setErrorMsg("");
  }

  async function handleSave() {
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await updateAdminFeatureFlags(flags).unwrap();
      setLocalFlags(null); // clear local overrides — RTK cache is now updated
      setSuccessMsg("Feature flags saved.");
    } catch {
      setErrorMsg("Failed to save feature flags.");
    }
  }

  if (isLoading) return <SkeletonList count={3} />;

  const flagKeys = Object.keys(flags);

  return (
    <div className="app-panel p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text">Feature flags</h2>
        <p className="text-xs text-muted mt-0.5">Toggle product features on or off for this tenant.</p>
      </div>

      {errorMsg && (
        <p className="text-sm text-danger-600 bg-danger-50 dark:bg-danger-900/20 rounded-xl px-4 py-2.5">
          {errorMsg}
        </p>
      )}

      {flagKeys.length === 0 ? (
        <p className="text-sm text-muted">No feature flags configured.</p>
      ) : (
        <ul className="space-y-3">
          {flagKeys.map((key) => (
            <li key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-text font-medium">{key.replaceAll("_", " ")}</span>
              <button
                type="button"
                role="switch"
                aria-checked={flags[key]}
                onClick={() => toggleFlag(key)}
                className={[
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  flags[key] ? "bg-primary-500" : "bg-neutral-300 dark:bg-neutral-600",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200",
                    flags[key] ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {successMsg && (
        <p className="text-sm text-success-700 bg-success-50 dark:bg-success-900/20 rounded-xl px-4 py-2.5">
          {successMsg}
        </p>
      )}

      <div className="pt-1">
        <Button size="sm" loading={isSaving} onClick={() => void handleSave()}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

// ─── Billing Lock Period Section ──────────────────────────────────────────────

function LockPeriodSection() {
  const [lockDate, setLockDate] = useState("");
  const [setLockPeriod, { isLoading }] = useSetLockPeriodMutation();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSetLock() {
    if (!lockDate) {
      setErrorMsg("Please select a date.");
      return;
    }
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await setLockPeriod({ entity: "global", lock_period_end: lockDate }).unwrap();
      setSuccessMsg(`Lock period set to ${lockDate}.`);
    } catch {
      setErrorMsg("Failed to set lock period.");
    }
  }

  return (
    <div className="app-panel p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text">Billing lock period</h2>
        <p className="text-xs text-muted mt-0.5">
          Prevent any billing entries before the selected date from being modified.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 max-w-sm">
        <div className="flex-1 min-w-0">
          <Input
            label="Lock period end date"
            type="date"
            value={lockDate}
            onChange={(e) => {
              setLockDate(e.target.value);
              setSuccessMsg("");
              setErrorMsg("");
            }}
          />
        </div>
        <Button size="sm" loading={isLoading} onClick={() => void handleSetLock()}>
          Set lock period
        </Button>
      </div>

      {errorMsg && (
        <p className="text-sm text-danger-600 bg-danger-50 dark:bg-danger-900/20 rounded-xl px-4 py-2.5">
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p className="text-sm text-success-700 bg-success-50 dark:bg-success-900/20 rounded-xl px-4 py-2.5">
          {successMsg}
        </p>
      )}
    </div>
  );
}

// ─── Trash Section ────────────────────────────────────────────────────────────

function TrashSection() {
  const { data: items, isLoading } = useListAdminTrashQuery();
  const [restoreFromTrash] = useRestoreFromTrashMutation();
  const [restoringKey, setRestoringKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRestore(entity: string, id: string) {
    const key = `${entity}-${id}`;
    setRestoringKey(key);
    setErrorMsg("");
    try {
      await restoreFromTrash({ entity, id }).unwrap();
    } catch {
      setErrorMsg(`Failed to restore ${entity} #${id}.`);
    } finally {
      setRestoringKey(null);
    }
  }

  return (
    <div className="app-panel p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-text">Trash</h2>
        <p className="text-xs text-muted mt-0.5">Soft-deleted records that can be restored.</p>
      </div>

      {errorMsg && (
        <p className="text-sm text-danger-600 bg-danger-50 dark:bg-danger-900/20 rounded-xl px-4 py-2.5">
          {errorMsg}
        </p>
      )}

      {isLoading && <SkeletonList count={3} />}
      {!isLoading && (!items || items.length === 0) && (
        <EmptyState title="Trash is empty" description="No soft-deleted records found." />
      )}
      {!isLoading && items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => {
            const key = `${item.entity}-${item.id}`;
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-4 border border-border rounded-xl px-4 py-3 bg-surface"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{item.label}</p>
                  <p className="text-xs text-muted">
                    {item.entity} &middot; ID: {item.id}
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="secondary"
                  loading={restoringKey === key}
                  onClick={() => void handleRestore(item.entity, item.id)}
                >
                  Restore
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JewelleryAdminPage() {
  return (
    <Screen title="Admin controls" backHref={ROUTES.app.jewellery.dashboard}>
      <div className="space-y-6 max-w-2xl">
        <FeatureFlagsSection />
        <LockPeriodSection />
        <TrashSection />
      </div>
    </Screen>
  );
}
