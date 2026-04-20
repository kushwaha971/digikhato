"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { Badge } from "@/components/ui/Badge";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  ResponsiveFilterPanel,
} from "@/components/ui/ResponsiveFilterPanel";
import { useListCollectionsQuery } from "@/features/collections/collection-api";
import { formatDateDMY } from "@/lib/format";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Paid", value: "paid" },
  { label: "Partial", value: "partial" },
  { label: "Missed", value: "missed" },
];

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success",
  partial: "warning",
  missed: "danger",
};

export default function CollectionHistoryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [draftStatus, setDraftStatus] = useState(status);
  const { data, isLoading } = useListCollectionsQuery({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.results ?? []).filter((row) => {
      const matchesSearch =
        !q || String(row.borrower).includes(q) || String(row.loan).includes(q);
      const matchesStatus = !status || row.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [data?.results, search, status]);

  function applyFilters() {
    setStatus(draftStatus);
  }

  function resetFilters() {
    setStatus("");
    setDraftStatus("");
  }

  return (
    <Screen
      title="Collection History"
      backHref="/collections"
      actions={
        <ResponsiveFilterPanel
          title="Filter History"
          hasActiveFilters={Boolean(status)}
          onApply={applyFilters}
          onReset={resetFilters}
        >
          <div className="grid grid-cols-1 gap-2">
            <label className={FILTER_LABEL_CLASS}>Status</label>
            <select
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value)}
              className={FILTER_FIELD_CLASS}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </ResponsiveFilterPanel>
      }
    >
      <StickyGlobalSearchBar value={search} onChange={setSearch} placeholder="Search by borrower ID or loan ID" />
      {status ? <p className="mt-3 text-xs text-muted">Filters applied</p> : null}
      {isLoading ? <p>Loading...</p> : null}
      <div className="space-y-2 mt-3">
        {filtered.map((row) => (
          <div key={row.id} className="app-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-text">
                {row.collection_code ?? `CL-${row.id}`} · Loan ID {row.loan}
              </p>
              <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"} className="capitalize">
                {row.status}
              </Badge>
            </div>
            <p className="text-sm text-muted mt-1">
              {formatDateDMY(row.date)} · ₹{Number(row.amount_paid).toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-muted">{row.notes || "No note"}</p>
            <Link href={`/collections/${row.uuid}/edit`} className="mt-2 inline-block rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white">
              Correct Entry
            </Link>
          </div>
        ))}
      </div>
    </Screen>
  );
}
