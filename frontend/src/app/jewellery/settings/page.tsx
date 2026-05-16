"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { useModuleFeature } from "@/hooks/useRoleAccess";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";
import {
  type JwlMetal,
  type JwlPurity,
  useCreateMetalMutation,
  useCreatePurityMutation,
  useDeleteMetalMutation,
  useDeletePurityMutation,
  useListMetalsQuery,
  useListPuritiesQuery,
} from "@/store/jewellery-api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "results" in value) {
    const maybeResults = (value as { results?: unknown }).results;
    if (Array.isArray(maybeResults)) return maybeResults as T[];
  }
  return [];
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    (error as { data?: unknown }).data &&
    typeof (error as { data?: unknown }).data === "object"
  ) {
    const data = (error as { data?: Record<string, unknown> }).data;
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    const firstValue = Object.values(data ?? {}).find((v) => Array.isArray(v) ? typeof v[0] === "string" : typeof v === "string");
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }
  return fallback;
}

export default function JewellerySettingsPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const ratesAccess = useModuleFeature("jewellery", "rates");
  const { data: metalsRes } = useListMetalsQuery();
  const { data: puritiesRes } = useListPuritiesQuery({});
  const [createMetal, createMetalState] = useCreateMetalMutation();
  const [deleteMetal, deleteMetalState] = useDeleteMetalMutation();
  const [createPurity, createPurityState] = useCreatePurityMutation();
  const [deletePurity, deletePurityState] = useDeletePurityMutation();

  const [metalCode, setMetalCode] = useState("");
  const [metalName, setMetalName] = useState("");
  const [metalUnit, setMetalUnit] = useState("gram");
  const [purityMetal, setPurityMetal] = useState("");
  const [purityCode, setPurityCode] = useState("");
  const [purityPct, setPurityPct] = useState("");
  const [error, setError] = useState<string | null>(null);

  const metals = asArray<JwlMetal>(metalsRes);
  const purities = asArray<JwlPurity>(puritiesRes);
  const purityCountByMetal = useMemo(() => {
    const countMap = new Map<string, number>();
    purities.forEach((purity) => {
      countMap.set(purity.metal, (countMap.get(purity.metal) ?? 0) + 1);
    });
    return countMap;
  }, [purities]);

  const canManageJewellerySettings = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === "super_admin") return true;

    const adminMeta = currentUser.module_admin;
    if (Array.isArray(adminMeta)) return adminMeta.includes("jewellery");
    if (adminMeta && typeof adminMeta === "object") {
      const entry = adminMeta.jewellery;
      if (typeof entry === "boolean") return entry;
      if (entry && typeof entry === "object") {
        return entry.can_manage_users === true || entry.can_assign_roles === true;
      }
    }
    return false;
  }, [currentUser]);

  async function handleAddMetal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createMetal({
        code: metalCode.trim().toUpperCase(),
        name: metalName.trim(),
        default_unit: metalUnit.trim() || "gram",
      }).unwrap();
      setMetalCode("");
      setMetalName("");
      setMetalUnit("gram");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add metal."));
    }
  }

  async function handleAddPurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createPurity({
        metal: purityMetal,
        code: purityCode.trim().toUpperCase(),
        pct: purityPct.trim(),
      }).unwrap();
      setPurityCode("");
      setPurityPct("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add purity."));
    }
  }

  async function handleDeleteMetal(id: string) {
    setError(null);
    try {
      await deleteMetal(id).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete metal."));
    }
  }

  async function handleDeletePurity(id: string) {
    setError(null);
    try {
      await deletePurity(id).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete purity."));
    }
  }

  return (
    <Screen
      title="Jewellery Settings"
      subtitle="Manage module-specific settings and controls."
      backHref={ROUTES.app.jewellery.dashboard}
    >
      <div className="max-w-5xl space-y-4">
        <section className="app-panel p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Pricing</p>
          {ratesAccess.read ? (
            <Link
              href={ROUTES.app.jewellery.rates}
              className="block rounded-xl border border-border px-4 py-3 hover:bg-surface2 transition-colors"
            >
              <p className="text-sm font-semibold text-text">Live MCX Rate</p>
              <p className="text-xs text-muted mt-0.5">
                View live buy/sell rates and set manual overrides.
              </p>
            </Link>
          ) : (
            <div className="rounded-xl border border-border px-4 py-3 bg-surface2/40">
              <p className="text-sm font-semibold text-text">Live MCX Rate</p>
              <p className="text-xs text-muted mt-0.5">
                You do not currently have access to rate settings. Ask your admin for Jewellery Rates access.
              </p>
            </div>
          )}
        </section>

        <section className="app-panel p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Dropdown masters</p>
          {!canManageJewellerySettings ? (
            <div className="rounded-xl border border-border px-4 py-3 bg-surface2/40">
              <p className="text-sm font-semibold text-text">Admin access required</p>
              <p className="text-xs text-muted mt-0.5">
                Only Jewellery module admins can manage metal and purity dropdown values.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-sm font-semibold text-text">Metals</p>
                <form className="space-y-2" onSubmit={handleAddMetal}>
                  <Input
                    label="Metal code"
                    required
                    value={metalCode}
                    onChange={(event) => setMetalCode(event.target.value)}
                    placeholder="e.g. GOLD"
                  />
                  <Input
                    label="Metal name"
                    required
                    value={metalName}
                    onChange={(event) => setMetalName(event.target.value)}
                    placeholder="e.g. Gold"
                  />
                  <Input
                    label="Default unit"
                    value={metalUnit}
                    onChange={(event) => setMetalUnit(event.target.value)}
                    placeholder="gram"
                  />
                  <Button type="submit" size="sm" loading={createMetalState.isLoading}>
                    Add metal
                  </Button>
                </form>

                <div className="space-y-2 pt-1">
                  {metals.map((metal) => {
                    const linkedPurities = purityCountByMetal.get(metal.id) ?? 0;
                    return (
                      <div key={metal.id} className="rounded-lg border border-border px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-text">{metal.name} ({metal.code})</p>
                          <p className="text-xs text-muted">{linkedPurities} purity option(s)</p>
                        </div>
                        <Button
                          type="button"
                          size="xs"
                          variant="danger"
                          onClick={() => handleDeleteMetal(metal.id)}
                          disabled={linkedPurities > 0 || deleteMetalState.isLoading}
                        >
                          Delete
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-sm font-semibold text-text">Purities</p>
                <form className="space-y-2" onSubmit={handleAddPurity}>
                  <Select
                    label="Metal"
                    required
                    value={purityMetal}
                    onChange={(event) => setPurityMetal(event.target.value)}
                  >
                    <option value="">Select metal</option>
                    {metals.map((metal) => (
                      <option key={metal.id} value={metal.id}>{metal.name} ({metal.code})</option>
                    ))}
                  </Select>
                  <Input
                    label="Purity code"
                    required
                    value={purityCode}
                    onChange={(event) => setPurityCode(event.target.value)}
                    placeholder="e.g. 22K"
                  />
                  <Input
                    label="Purity %"
                    required
                    value={purityPct}
                    onChange={(event) => setPurityPct(event.target.value)}
                    placeholder="e.g. 91.600"
                  />
                  <Button type="submit" size="sm" loading={createPurityState.isLoading}>
                    Add purity
                  </Button>
                </form>

                <div className="space-y-2 pt-1 max-h-72 overflow-auto pr-1">
                  {purities.map((purity) => (
                    <div key={purity.id} className="rounded-lg border border-border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">{purity.code} ({purity.pct}%)</p>
                        <p className="text-xs text-muted">Metal: {purity.metal_code}</p>
                      </div>
                      <Button
                        type="button"
                        size="xs"
                        variant="danger"
                        onClick={() => handleDeletePurity(purity.id)}
                        disabled={deletePurityState.isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {error ? <p className="text-xs text-danger-600 mt-3">{error}</p> : null}
        </section>

        <section className="app-panel p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Other master fields</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/jewellery/master/categories" className="rounded-xl border border-border px-4 py-3 hover:bg-surface2 transition-colors">
              <p className="text-sm font-semibold text-text">Categories</p>
              <p className="text-xs text-muted mt-0.5">Add category dropdown values.</p>
            </Link>
            <Link href="/jewellery/master/designs" className="rounded-xl border border-border px-4 py-3 hover:bg-surface2 transition-colors">
              <p className="text-sm font-semibold text-text">Designs</p>
              <p className="text-xs text-muted mt-0.5">Add design options used across forms.</p>
            </Link>
            <Link href="/jewellery/master/tax-slabs" className="rounded-xl border border-border px-4 py-3 hover:bg-surface2 transition-colors">
              <p className="text-sm font-semibold text-text">Tax slabs</p>
              <p className="text-xs text-muted mt-0.5">Configure GST dropdown/rate values.</p>
            </Link>
            <Link href="/jewellery/master/number-series" className="rounded-xl border border-border px-4 py-3 hover:bg-surface2 transition-colors">
              <p className="text-sm font-semibold text-text">Number series</p>
              <p className="text-xs text-muted mt-0.5">Configure voucher series defaults.</p>
            </Link>
          </div>
        </section>
      </div>
    </Screen>
  );
}
