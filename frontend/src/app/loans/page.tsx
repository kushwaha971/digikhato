"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { DatePicker } from "@/components/ui/DatePicker";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import {
  FILTER_FIELD_CLASS,
  FilterSelect,
  ResponsiveFilterPanel,
} from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { useListLoansQuery } from "@/features/loans/loan-api";
import type { Loan } from "@/features/loans/loan-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDateDMY } from "@/lib/format";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Overdue", value: "overdue" },
  { label: "Closed", value: "closed" },
];

const STATUS_VARIANT: Record<string, "success" | "neutral" | "danger"> = {
  active: "success",
  closed: "neutral",
  overdue: "danger",
};

function fmt(val: string | number | undefined) {
  if (!val) return "₹0";
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

export default function LoanListPage() {
  const { can } = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftMinAmt, setDraftMinAmt] = useState(minAmt);
  const [draftMaxAmt, setDraftMaxAmt] = useState(maxAmt);
  const [draftDateFrom, setDraftDateFrom] = useState(dateFrom);
  const [draftDateTo, setDraftDateTo] = useState(dateTo);
  const [page, setPage] = useState(1);

  const { data, isFetching } = useListLoansQuery({
    search: search || undefined,
    status: status || undefined,
    ordering: "-updated_at",
    page,
  });

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const { items: loans, hasMore, sentinelRef } = useInfiniteItems<Loan>(
    data,
    isFetching,
    page,
    loadMore,
  );

  const hasFilters = Boolean(search || status || minAmt || maxAmt || dateFrom || dateTo);

  function applyFilters() {
    setStatus(draftStatus);
    setMinAmt(draftMinAmt);
    setMaxAmt(draftMaxAmt);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setPage(1);
  }

  function resetFilters() {
    setStatus(""); setMinAmt(""); setMaxAmt(""); setDateFrom(""); setDateTo("");
    setDraftStatus(""); setDraftMinAmt(""); setDraftMaxAmt(""); setDraftDateFrom(""); setDraftDateTo("");
    setPage(1);
  }

  return (
    <Screen
      title="Loans"
      actions={
        <div className="flex items-center gap-2">
          {can("create:loan") ? (
            <Link href="/loans/create" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
              + Create Loan
            </Link>
          ) : null}
          <ResponsiveFilterPanel
            title="Filter Loans"
            hasActiveFilters={Boolean(status || minAmt || maxAmt || dateFrom || dateTo)}
            onApply={applyFilters}
            onReset={resetFilters}
          >
            <FilterSelect
              label="Status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>{o.label}</option>
              ))}
            </FilterSelect>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Min ₹" value={draftMinAmt} onChange={(e) => setDraftMinAmt(e.target.value)} className={FILTER_FIELD_CLASS} />
              <input type="number" placeholder="Max ₹" value={draftMaxAmt} onChange={(e) => setDraftMaxAmt(e.target.value)} className={FILTER_FIELD_CLASS} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <DatePicker name="loan_filter_from" label="Start date from" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} />
              <DatePicker name="loan_filter_to" label="Start date to" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} />
            </div>
          </ResponsiveFilterPanel>
        </div>
      }
    >
      <div className="space-y-3 mb-4">
        <StickyGlobalSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by borrower name or mobile…"
        />
        {hasFilters ? <p className="text-xs text-muted">Filters applied</p> : null}
      </div>

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && loans.length === 0 && (
        <EmptyState
          title="No loans found"
          description={hasFilters ? "Try different filters." : "No loans have been created yet."}
        />
      )}

      {loans.length > 0 && (
        <>
          <div className="space-y-3">
            {loans.map((loan) => (
              <LoanListCard key={loan.id} loan={loan} />
            ))}
          </div>

          {hasMore && <div ref={sentinelRef} className="h-1 mt-2" />}
          {isFetching && page > 1 && (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}
    </Screen>
  );
}

function LoanListCard({ loan }: { loan: Loan }) {
  return (
    <Link href={`/loans/${loan.uuid}`} className="block">
      <div className="app-panel p-4 card-clickable">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{loan.borrower_name}</p>
            <p className="text-xs text-muted mt-0.5">
              {loan.loan_code ?? `LN-${loan.id}`}
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-primary-600">{formatDateDMY(loan.start_date)}</span>
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[loan.status] ?? "neutral"} className="capitalize shrink-0">
            {loan.status}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted">Principal</p>
            <p className="font-bold text-text text-sm">{fmt(loan.principal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Paid</p>
            <p className="font-bold text-success-600 text-sm">{fmt(loan.paid_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Outstanding</p>
            <p className="font-bold text-warning-600 text-sm">{fmt(loan.outstanding_balance)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
