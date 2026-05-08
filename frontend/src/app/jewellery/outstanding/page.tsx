"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";
import {
  useGetOutstandingPartyQuery,
  useLazyExportOutstandingCsvQuery,
  useListOutstandingQuery,
  usePostOutstandingAdjustmentMutation,
} from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

type AgeingFilter = "all" | "30" | "60" | "90" | "90+";

const BUCKET_META: Array<{ key: AgeingFilter; label: string; buckets: string[]; tone: "success" | "warning" | "danger" | "neutral" }> = [
  { key: "30", label: "0-30d", buckets: ["0_30"], tone: "success" },
  { key: "60", label: "31-60d", buckets: ["31_60"], tone: "warning" },
  { key: "90", label: "61-90d", buckets: ["61_90"], tone: "warning" },
  { key: "90+", label: "90+d", buckets: ["90_plus"], tone: "danger" },
];

function badgeForBucket(bucket: string): "success" | "warning" | "danger" | "neutral" {
  if (bucket === "0_30") return "success";
  if (bucket === "31_60" || bucket === "61_90") return "warning";
  if (bucket === "90_plus") return "danger";
  return "neutral";
}

function bucketLabel(bucket: string): string {
  if (bucket === "0_30") return "0-30 days";
  if (bucket === "31_60") return "31-60 days";
  if (bucket === "61_90") return "61-90 days";
  if (bucket === "90_plus") return "90+ days";
  return "Unknown";
}

function movementTypeLabel(value: string): string {
  if (value === "INVOICE_DEBIT") return "Invoice raised";
  if (value === "PAYMENT_RECEIVED") return "Payment received";
  if (value === "ADVANCE_GIVEN") return "Advance collected";
  if (value === "MANUAL_ADJUSTMENT") return "Manual adjustment";
  return value.replaceAll("_", " ");
}

export default function JewelleryOutstandingPage() {
  const [ageing, setAgeing] = useState<AgeingFilter>("all");
  const [includeZero, setIncludeZero] = useState(false);
  const [selectedBalanceId, setSelectedBalanceId] = useState<string>("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [amountDelta, setAmountDelta] = useState("0");
  const [metalDelta, setMetalDelta] = useState("0");
  const [notes, setNotes] = useState("");
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10));
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const canAdjust = useMemo(() => {
    const jwlRoles = new Set(
      (currentUser?.module_roles ?? [])
        .filter((role) => role.module === "jewellery" && role.is_active)
        .map((role) => role.role_code),
    );
    return jwlRoles.has("jwl_admin") || jwlRoles.has("jwl_manager") || currentUser?.role === "admin";
  }, [currentUser]);

  const { data: parties = [], isFetching } = useListOutstandingQuery({
    ageing: ageing === "all" ? undefined : ageing,
    include_zero: includeZero,
  });

  const { data: partyDetail, isFetching: detailLoading } = useGetOutstandingPartyQuery(selectedBalanceId, {
    skip: !selectedBalanceId,
  });

  const [postAdjustment, adjustState] = usePostOutstandingAdjustmentMutation();
  const [exportCsv, exportState] = useLazyExportOutstandingCsvQuery();

  const totals = useMemo(() => {
    let receivable = 0;
    let overdueCount = 0;
    const perBucket = new Map<string, { amount: number; count: number }>();
    for (const row of parties) {
      const amount = Number(row.amount_balance || 0);
      if (amount > 0) receivable += amount;
      if (row.ageing_bucket === "90_plus") overdueCount += 1;
      const existing = perBucket.get(row.ageing_bucket) ?? { amount: 0, count: 0 };
      existing.amount += amount;
      existing.count += 1;
      perBucket.set(row.ageing_bucket, existing);
    }
    return { receivable, overdueCount, perBucket };
  }, [parties]);

  const selectedParty = parties.find((p) => p.id === selectedBalanceId) ?? null;

  const submitAdjustment = async () => {
    if (!selectedBalanceId) return;
    setAdjustError(null);
    if (notes.trim().length < 5) {
      setAdjustError("Notes must be at least 5 characters.");
      return;
    }
    if (!amountDelta.trim() && !metalDelta.trim()) {
      setAdjustError("Enter an amount delta or metal delta.");
      return;
    }
    try {
      await postAdjustment({
        id: selectedBalanceId,
        movement_type: "MANUAL_ADJUSTMENT",
        amount_delta: amountDelta || "0",
        metal_delta_grams: metalDelta || "0",
        notes: notes.trim(),
        txn_date: txnDate,
      }).unwrap();
      setAdjustOpen(false);
      setAmountDelta("0");
      setMetalDelta("0");
      setNotes("");
      setTxnDate(new Date().toISOString().slice(0, 10));
    } catch {
      setAdjustError("Could not post adjustment. Please verify values and try again.");
    }
  };

  const handleExportCsv = async () => {
    const blob = await exportCsv({
      ageing: ageing === "all" ? undefined : ageing,
      include_zero: includeZero,
    }).unwrap();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jwl-outstanding.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  };

  return (
    <Screen
      title="Party Outstanding"
      subtitle={`Total receivable ${formatINRCurrency(totals.receivable)} · Overdue 90+ ${totals.overdueCount}`}
      backHref={ROUTES.app.jewellery.dashboard}
      actions={(
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="inline-flex items-center gap-2 text-xs text-muted rounded-xl border border-border px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={includeZero}
              onChange={(e) => setIncludeZero(e.target.checked)}
            />
            Include zero balance
          </label>
          {canAdjust ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!selectedBalanceId && parties[0]?.id) {
                  setSelectedBalanceId(parties[0].id);
                }
                setAdjustOpen(true);
              }}
            >
              Manual Adjustment
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void handleExportCsv()}
            loading={exportState.isFetching}
          >
            Export CSV
          </Button>
        </div>
      )}
    >
      <p className="text-xs text-muted mb-3">Ageing is calculated from last activity date.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {BUCKET_META.map((bucket) => {
          const stats = bucket.buckets.reduce(
            (acc, b) => {
              const row = totals.perBucket.get(b);
              if (!row) return acc;
              acc.amount += row.amount;
              acc.count += row.count;
              return acc;
            },
            { amount: 0, count: 0 },
          );
          const active = ageing === bucket.key;
          return (
            <button
              key={bucket.key}
              type="button"
              onClick={() => setAgeing((prev) => (prev === bucket.key ? "all" : bucket.key))}
              className={[
                "rounded-xl border p-3 text-left transition-colors",
                active ? "border-primary-500 ring-2 ring-primary-200" : "border-border bg-surface",
              ].join(" ")}
            >
              <p className="text-xs text-muted">{bucket.label}</p>
              <p className="text-sm font-semibold text-text mt-1">{formatINRCurrency(stats.amount)}</p>
              <p className="text-xs text-muted mt-0.5">{stats.count} parties</p>
            </button>
          );
        })}
      </div>

      {isFetching ? <SkeletonList count={6} /> : null}

      {!isFetching && parties.length === 0 ? (
        <EmptyState
          title="No outstanding balances"
          description="No party balances match the selected filters."
        />
      ) : null}

      <div className="space-y-3">
        {parties.map((party) => {
          const amount = Number(party.amount_balance || 0);
          const isCredit = amount < 0;
          return (
            <button
              key={party.id}
              type="button"
              onClick={() => setSelectedBalanceId(party.id)}
              className="w-full app-panel p-4 text-left card-clickable"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">{party.customer_name}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">{party.mobile || "No mobile"}</p>
                </div>
                <Badge variant={badgeForBucket(party.ageing_bucket)}>{bucketLabel(party.ageing_bucket)}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
                <p className={["text-sm font-semibold", isCredit ? "text-success-600" : "text-danger-600"].join(" ")}>
                  {formatINRCurrency(party.amount_balance)}
                </p>
                <p className="text-xs text-muted">Metal: {party.metal_balance_grams} g</p>
              </div>
            </button>
          );
        })}
      </div>

      <Drawer
        open={Boolean(selectedBalanceId)}
        onClose={() => setSelectedBalanceId("")}
        title={selectedParty ? `${selectedParty.customer_name} — Outstanding` : "Outstanding detail"}
        size="xl"
        footer={(
          <>
            {canAdjust ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setAdjustOpen(true)}>
                Post Adjustment
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={() => setSelectedBalanceId("")}>Close</Button>
          </>
        )}
      >
        {detailLoading || !partyDetail ? (
          <SkeletonList count={3} />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-surface2 p-3">
                <p className="text-xs text-muted">Cash balance</p>
                <p className="text-sm font-semibold text-text mt-1">{formatINRCurrency(partyDetail.amount_balance)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface2 p-3">
                <p className="text-xs text-muted">Metal balance</p>
                <p className="text-sm font-semibold text-text mt-1">{partyDetail.metal_balance_grams} g</p>
              </div>
              <div className="rounded-xl border border-border bg-surface2 p-3">
                <p className="text-xs text-muted">Last activity</p>
                <p className="text-sm font-semibold text-text mt-1">{partyDetail.last_txn_date || "-"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-3 py-2 border-b border-border bg-surface2 text-xs text-muted">Last 50 movements</div>
              <div className="max-h-[48vh] overflow-y-auto">
                {partyDetail.movements.length === 0 ? (
                  <p className="text-sm text-muted px-3 py-4">No movements yet.</p>
                ) : (
                  partyDetail.movements.map((mv) => (
                    <div key={mv.id} className="px-3 py-2 border-b border-border last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-text">{movementTypeLabel(mv.movement_type)}</p>
                        <p className="text-xs text-muted">{mv.txn_date}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-3 flex-wrap text-xs">
                        <span className="text-text">₹ {mv.amount_delta}</span>
                        <span className="text-text">{mv.metal_delta_grams} g</span>
                        {mv.reference_type && mv.reference_id ? (
                          mv.reference_type.includes("INVOICE") ? (
                            <Link className="text-primary-600 hover:underline" href={`/jewellery/billing/${mv.reference_id}`}>
                              Invoice
                            </Link>
                          ) : (
                            <span className="text-muted">{mv.reference_type}</span>
                          )
                        ) : null}
                      </div>
                      {mv.notes ? <p className="text-xs text-muted mt-1">{mv.notes}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={adjustOpen && canAdjust}
        onClose={() => {
          setAdjustOpen(false);
          setAdjustError(null);
        }}
        title="Manual Adjustment"
        size="lg"
        footer={(
          <>
            <Button type="button" size="sm" variant="secondary" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={submitAdjustment} loading={adjustState.isLoading}>
              Save adjustment
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          {adjustError ? (
            <div className="rounded-xl border border-danger-200 bg-danger-50 text-danger-700 text-sm px-3 py-2">
              {adjustError}
            </div>
          ) : null}
          <Input label="Party" value={selectedParty?.customer_name || "Select a party from the list"} disabled />
          <Input
            label="Amount delta (₹)"
            type="number"
            step="0.01"
            value={amountDelta}
            onChange={(e) => setAmountDelta(e.target.value)}
          />
          <Input
            label="Metal delta (g)"
            type="number"
            step="0.0001"
            value={metalDelta}
            onChange={(e) => setMetalDelta(e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={txnDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setTxnDate(e.target.value)}
          />
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Reason for adjustment"
          />
        </div>
      </Drawer>
    </Screen>
  );
}
