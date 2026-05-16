"use client";

import { useMemo, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { TRANSFER_STATUS_OPTIONS, transferStatusVariant } from "@/constants/jewellery";
import { useJwlPermission } from "@/hooks/useRoleAccess";
import { useGetTransferRegisterReportQuery, type JwlTransfer } from "@/store/jewellery-api";

type TransferStatusFilter = JwlTransfer["status"] | "";

const EMPTY_SUMMARY = {
  count: 0,
  received_count: 0,
  in_transit_count: 0,
  total_weight: "0.0000",
};

function todayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonthStartIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function extractRegisterErrorMessage(error: unknown): string {
  const fallback = "Retry after checking filter values.";
  if (!error || typeof error !== "object") return fallback;
  const maybeError = error as {
    data?: { detail?: unknown };
    error?: unknown;
    status?: unknown;
  };
  if (typeof maybeError.data?.detail === "string" && maybeError.data.detail.trim()) {
    return maybeError.data.detail;
  }
  if (typeof maybeError.error === "string" && maybeError.error.trim()) {
    return maybeError.error;
  }
  if (typeof maybeError.status === "number") {
    return `Request failed with status ${maybeError.status}.`;
  }
  return fallback;
}

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function TransferRegisterReportPage() {
  const canExportTransferRegister = useJwlPermission("jwl.reports.export");
  const [fromDate, setFromDate] = useState(currentMonthStartIsoDate);
  const [toDate, setToDate] = useState(todayIsoDate);
  const [status, setStatus] = useState<TransferStatusFilter>("");
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");

  const params = useMemo(
    () => ({
      ...(fromDate ? { from_date: fromDate } : {}),
      ...(toDate ? { to_date: toDate } : {}),
      ...(status ? { status } : {}),
      ...(fromBranch.trim() ? { from_branch: fromBranch.trim() } : {}),
      ...(toBranch.trim() ? { to_branch: toBranch.trim() } : {}),
    }),
    [fromDate, toDate, status, fromBranch, toBranch],
  );

  const { data, isLoading, isFetching, error, refetch } = useGetTransferRegisterReportQuery(params);
  const rows = data?.results ?? [];
  const summary = data?.summary ?? EMPTY_SUMMARY;

  const exportCsv = () => {
    if (!rows.length) return;

    const header = [
      "Transfer ID",
      "Created Date",
      "From Branch",
      "To Branch",
      "Status",
      "Line Count",
      "Total Weight",
      "Dispatched At",
      "Received At",
      "Notes",
    ];
    const lines = rows.map((row) => [
      row.id,
      new Date(row.created_at).toLocaleDateString("en-IN"),
      row.from_branch,
      row.to_branch,
      row.status,
      String(row.line_count),
      row.total_weight,
      row.dispatched_at ? new Date(row.dispatched_at).toLocaleString("en-IN") : "",
      row.received_at ? new Date(row.received_at).toLocaleString("en-IN") : "",
      row.notes || "",
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((cell) => csvEscape(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jwl-transfer-register.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Screen
      title="Transfer Register"
      subtitle="Branch-wise transfer report with operational status and weight summary."
      backHref="/jewellery/inventory/transfers"
      actions={(
        <Button
          onClick={exportCsv}
          disabled={!canExportTransferRegister || !rows.length || isLoading || isFetching}
          data-testid="jwl-transfer-register-export"
        >
          Export CSV
        </Button>
      )}
    >
      <div className="space-y-4">
        <div className="app-panel p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1">
            <span className="text-xs text-muted">From date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">To date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TransferStatusFilter)}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            >
              {TRANSFER_STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">From branch</span>
            <input
              type="text"
              value={fromBranch}
              onChange={(e) => setFromBranch(e.target.value)}
              placeholder="e.g. Main"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">To branch</span>
            <input
              type="text"
              value={toBranch}
              onChange={(e) => setToBranch(e.target.value)}
              placeholder="e.g. Branch-2"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="app-panel p-3">
            <p className="text-xs text-muted">Transfers</p>
            <p className="mt-1 font-semibold">{summary.count}</p>
          </div>
          <div className="app-panel p-3">
            <p className="text-xs text-muted">Received</p>
            <p className="mt-1 font-semibold">{summary.received_count}</p>
          </div>
          <div className="app-panel p-3">
            <p className="text-xs text-muted">In transit</p>
            <p className="mt-1 font-semibold">{summary.in_transit_count}</p>
          </div>
          <div className="app-panel p-3">
            <p className="text-xs text-muted">Total weight</p>
            <p className="mt-1 font-semibold">{summary.total_weight} g</p>
          </div>
        </div>

        <div className="app-panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Transfer rows</p>
            <Badge variant="neutral">{rows.length} rows</Badge>
          </div>

          {isLoading ? <SkeletonList count={4} /> : null}

          {error && !isLoading ? (
            <EmptyState
              title="Could not load transfer register"
              description={extractRegisterErrorMessage(error)}
              action={{ label: "Retry", onClick: () => void refetch() }}
            />
          ) : null}

          {!isLoading && !error && rows.length === 0 ? (
            <EmptyState
              title="No transfer records"
              description="Try widening date range or branch filters."
            />
          ) : null}

          {!error && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-2 py-2">Created</th>
                    <th className="px-2 py-2">Route</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Lines</th>
                    <th className="px-2 py-2">Weight (g)</th>
                    <th className="px-2 py-2">Dispatched</th>
                    <th className="px-2 py-2">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/70 last:border-0">
                      <td className="px-2 py-2">{new Date(row.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-2 py-2">{row.from_branch} &rarr; {row.to_branch}</td>
                      <td className="px-2 py-2">
                        <Badge variant={transferStatusVariant(row.status)}>{row.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-2 py-2">{row.line_count}</td>
                      <td className="px-2 py-2">{row.total_weight}</td>
                      <td className="px-2 py-2">
                        {row.dispatched_at ? new Date(row.dispatched_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-2 py-2">
                        {row.received_at ? new Date(row.received_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
