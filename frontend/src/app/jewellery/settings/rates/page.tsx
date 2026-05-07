"use client";

import { useState, useMemo } from "react";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/lib/routes";
import type { JwlLiveRate } from "@/store/jewellery-api";
import {
  useGetLiveRatesQuery,
  useGetRateHistoryQuery,
  useOverrideRateMutation,
} from "@/store/jewellery-api";

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return ts;
  }
}

function SourceBadge({ source }: { source: JwlLiveRate["source"] }) {
  const styles: Record<JwlLiveRate["source"], string> = {
    OVERRIDE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    MCX: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    MANUAL: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[source]}`}>
      {source}
    </span>
  );
}

function LiveRatesTable() {
  const { data: liveRates, isLoading, isError } = useGetLiveRatesQuery(undefined, {
    pollingInterval: 60000,
  });

  if (isLoading) return <SkeletonList count={4} />;

  if (isError) {
    return (
      <EmptyState
        title="Failed to load live rates"
        description="Could not fetch current rates. Please try again."
      />
    );
  }

  if (!liveRates || liveRates.length === 0) {
    return <EmptyState title="No live rates" description="No rate data available yet." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface2">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Metal</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Purity</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Buy (₹/g)</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Sell (₹/g)</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Source</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Updated</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {liveRates.map((rate) => (
            <tr
              key={`${rate.metal}-${rate.purity}`}
              className={`transition-colors hover:bg-surface2 ${rate.is_stale ? "bg-amber-50 dark:bg-amber-900/10" : "bg-surface"}`}
            >
              <td className="px-4 py-3 font-medium text-text">{rate.metal_name}</td>
              <td className="px-4 py-3 text-text">{rate.purity_name}</td>
              <td className="px-4 py-3 text-right font-mono text-text">
                {parseFloat(rate.buy_rate).toLocaleString("en-IN")}
              </td>
              <td className="px-4 py-3 text-right font-mono text-text">
                {parseFloat(rate.sell_rate).toLocaleString("en-IN")}
              </td>
              <td className="px-4 py-3">
                <SourceBadge source={rate.source} />
              </td>
              <td className="px-4 py-3 text-muted text-xs">{formatTs(rate.updated_at)}</td>
              <td className="px-4 py-3">
                {rate.is_stale ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                    Stale
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-success-600 dark:text-success-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-success-500 flex-shrink-0" />
                    Live
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface OverrideFormState {
  metalId: string;
  purityId: string;
  buy_rate: string;
  sell_rate: string;
  reason: string;
}

const EMPTY_FORM: OverrideFormState = {
  metalId: "",
  purityId: "",
  buy_rate: "",
  sell_rate: "",
  reason: "",
};

function OverrideRateForm() {
  const { data: liveRates } = useGetLiveRatesQuery(undefined, { pollingInterval: 60000 });
  const [overrideRate, { isLoading }] = useOverrideRateMutation();

  const [form, setForm] = useState<OverrideFormState>(EMPTY_FORM);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Derive unique metals from live rates
  const uniqueMetals = useMemo(() => {
    if (!liveRates) return [];
    const seen = new Map<string, string>(); // metal id → metal_name
    for (const r of liveRates) {
      if (!seen.has(r.metal)) seen.set(r.metal, r.metal_name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [liveRates]);

  // Derive purities for selected metal
  const filteredPurities = useMemo(() => {
    if (!liveRates || !form.metalId) return [];
    return liveRates
      .filter((r) => r.metal === form.metalId)
      .map((r) => ({ id: r.purity, name: r.purity_name }));
  }, [liveRates, form.metalId]);

  function handleMetalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, metalId: e.target.value, purityId: "" }));
  }

  function handlePurityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, purityId: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!form.metalId || !form.purityId || !form.buy_rate || !form.sell_rate) {
      setErrorMsg("Metal, purity, buy rate and sell rate are required.");
      return;
    }

    try {
      await overrideRate({
        metal: form.metalId,
        purity: form.purityId,
        buy_rate: form.buy_rate,
        sell_rate: form.sell_rate,
        reason: form.reason || undefined,
      }).unwrap();
      setSuccessMsg("Rate override saved successfully.");
      setForm(EMPTY_FORM);
    } catch {
      setErrorMsg("Failed to save override. Please check values and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Metal"
          name="metal"
          required
          value={form.metalId}
          onChange={handleMetalChange}
          placeholder="Select metal"
          disabled={uniqueMetals.length === 0}
        >
          {uniqueMetals.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>

        <Select
          label="Purity"
          name="purity"
          required
          value={form.purityId}
          onChange={handlePurityChange}
          placeholder="Select purity"
          disabled={!form.metalId || filteredPurities.length === 0}
        >
          {filteredPurities.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Buy rate (₹/g)"
          name="buy_rate"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          value={form.buy_rate}
          onChange={(e) => setForm((prev) => ({ ...prev, buy_rate: e.target.value }))}
        />

        <Input
          label="Sell rate (₹/g)"
          name="sell_rate"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          value={form.sell_rate}
          onChange={(e) => setForm((prev) => ({ ...prev, sell_rate: e.target.value }))}
        />
      </div>

      <Textarea
        label="Reason (optional)"
        name="reason"
        placeholder="Reason for override…"
        rows={2}
        value={form.reason}
        onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
      />

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

      <Button type="submit" loading={isLoading} size="sm">
        Apply override
      </Button>
    </form>
  );
}

function RateHistoryList() {
  const { data, isLoading } = useGetRateHistoryQuery({});

  if (isLoading) return <SkeletonList count={3} />;

  const items = data?.results?.slice(0, 10) ?? [];

  if (items.length === 0) {
    return <EmptyState title="No rate history" description="No rate changes recorded yet." />;
  }

  return (
    <ul className="space-y-2">
      {items.map((entry) => (
        <li key={entry.id} className="app-panel px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-sm font-medium text-text">{entry.metal}</span>
          <span className="text-xs text-muted">{entry.purity}</span>
          <span className="font-mono text-sm text-text">
            ₹{parseFloat(entry.rate_per_gram).toLocaleString("en-IN")}/g
          </span>
          <span className="text-xs text-muted uppercase">{entry.source}</span>
          <span className="ml-auto text-xs text-muted">{formatTs(entry.ts)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function JewelleryRatesPage() {
  return (
    <Screen title="Rates" backHref={ROUTES.app.jewellery.dashboard}>
      <div className="space-y-8 max-w-4xl">
        {/* Section 1 — Live rates */}
        <section>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Live rates</p>
          <LiveRatesTable />
        </section>

        {/* Section 2 — Override form */}
        <section>
          <div className="app-panel p-4 md:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">Override rate</h2>
              <p className="text-xs text-muted mt-0.5">
                Manually set buy/sell rates for a specific metal and purity. Overrides MCX feed until next refresh.
              </p>
            </div>
            <OverrideRateForm />
          </div>
        </section>

        {/* Section 3 — Rate history */}
        <section>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Rate history (last 10)</p>
          <RateHistoryList />
        </section>
      </div>
    </Screen>
  );
}
