"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { DatePicker } from "@/components/ui/DatePicker";
import { PaymentModeChip } from "@/components/ui/PaymentModeChip";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FILTER_FIELD_CLASS,
  FilterSelect,
  ResponsiveFilterPanel,
} from "@/components/ui/ResponsiveFilterPanel";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { DueBorrowerList } from "@/components/business/DueBorrowerList";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { useListTodayDueQuery, useListCollectionsQuery } from "@/features/collections/collection-api";
import type { Collection } from "@/features/collections/collection-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDateDMY } from "@/lib/format";
import { PAYMENT_MODE_OPTIONS } from "@/validation";

type Tab = "today" | "history";

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [draftPaymentMode, setDraftPaymentMode] = useState(paymentMode);
  const [draftDateFrom, setDraftDateFrom] = useState(dateFrom);
  const [draftDateTo, setDraftDateTo] = useState(dateTo);
  const [draftMinAmt, setDraftMinAmt] = useState(minAmt);
  const [draftMaxAmt, setDraftMaxAmt] = useState(maxAmt);
  const [draftCollectorId, setDraftCollectorId] = useState(collectorId);
  const [page, setPage] = useState(1);

  const { isAdmin, isCollector } = useRoleAccess();
  const canCollect = isAdmin || isCollector;

  const { data: todayData, isLoading: todayLoading } = useListTodayDueQuery();
  const { data: historyData, isFetching: historyFetching } = useListCollectionsQuery(
    {
      payment_mode: paymentMode || undefined,
      date__gte: dateFrom || undefined,
      date__lte: dateTo || undefined,
      amount_paid__gte: minAmt ? Number(minAmt) : undefined,
      amount_paid__lte: maxAmt ? Number(maxAmt) : undefined,
      collected_by: collectorId ? Number(collectorId) : undefined,
      ordering: "-date,-updated_at",
      page,
    },
    { skip: activeTab !== "history" },
  );

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const { items: historyItems, hasMore, sentinelRef } = useInfiniteItems<Collection>(
    historyData,
    historyFetching,
    page,
    loadMore,
  );

  const filteredToday = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return todayData?.results ?? [];
    return (todayData?.results ?? []).filter((loan) =>
      loan.borrower_name.toLowerCase().includes(q),
    );
  }, [todayData?.results, search]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return historyItems;
    return historyItems.filter((r) =>
      String(r.borrower).includes(q) || String(r.loan).includes(q),
    );
  }, [historyItems, search]);

  const hasActiveFilters = Boolean(paymentMode || dateFrom || dateTo || minAmt || maxAmt || collectorId);

  function resetHistoryFilters() {
    setPaymentMode("");
    setDateFrom("");
    setDateTo("");
    setMinAmt("");
    setMaxAmt("");
    setCollectorId("");
    setDraftPaymentMode("");
    setDraftDateFrom("");
    setDraftDateTo("");
    setDraftMinAmt("");
    setDraftMaxAmt("");
    setDraftCollectorId("");
    setPage(1);
  }

  function applyHistoryFilters() {
    setPaymentMode(draftPaymentMode);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setMinAmt(draftMinAmt);
    setMaxAmt(draftMaxAmt);
    setCollectorId(draftCollectorId);
    setPage(1);
  }

  return (
    <Screen
      title="Collections"
      actions={
        activeTab === "history" ? (
          <ResponsiveFilterPanel
            title="Filter Collections"
            hasActiveFilters={hasActiveFilters}
            onApply={applyHistoryFilters}
            onReset={resetHistoryFilters}
          >
            <FilterSelect
              label="Payment Mode"
              value={draftPaymentMode}
              onChange={(e) => setDraftPaymentMode(e.target.value)}
            >
              <option value="">All</option>
              {PAYMENT_MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </FilterSelect>
            <div className="grid grid-cols-1 gap-2">
              <DatePicker name="collections_filter_from" label="Date from" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} />
              <DatePicker name="collections_filter_to" label="Date to" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Min ₹" value={draftMinAmt} onChange={(e) => setDraftMinAmt(e.target.value)} className={FILTER_FIELD_CLASS} />
              <input type="number" placeholder="Max ₹" value={draftMaxAmt} onChange={(e) => setDraftMaxAmt(e.target.value)} className={FILTER_FIELD_CLASS} />
            </div>
            <input type="number" placeholder="Collector ID (optional)" value={draftCollectorId} onChange={(e) => setDraftCollectorId(e.target.value)} className={FILTER_FIELD_CLASS} />
          </ResponsiveFilterPanel>
        ) : undefined
      }
    >
      {canCollect ? (
        <div className="app-panel p-3 mb-4">
          <p className="text-sm text-text font-semibold">Context-first collection flow</p>
          <p className="text-xs text-muted mt-1">
            Record collections from <strong>Today Due</strong> list or from a borrower/loan page.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Link href="/collections/today" className="text-xs font-semibold text-primary-500 hover:text-primary-600">Open Today Due →</Link>
            <Link href="/borrowers" className="text-xs font-semibold text-primary-500 hover:text-primary-600">Open Borrowers →</Link>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-surface2 rounded-xl w-fit">
        {(["today", "history"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearch(""); resetHistoryFilters(); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              activeTab === tab ? "bg-surface text-text shadow-card" : "text-muted hover:text-text"
            }`}
          >
            {tab === "today" ? "Today" : "History"}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <StickyGlobalSearchBar
          value={search}
          onChange={setSearch}
          placeholder={activeTab === "today" ? "Search borrower…" : "Search by borrower or loan ID…"}
        />
      </div>

      {activeTab === "history" && hasActiveFilters ? (
        <p className="mb-3 text-xs text-muted">Filters applied</p>
      ) : null}

      {/* Today tab */}
      {activeTab === "today" && (
        <>
          {todayLoading && <SkeletonList count={4} />}
          {!todayLoading && filteredToday.length === 0 && (
            <EmptyState
              title="No dues today"
              description={search ? "No results match your search." : "All collections are up to date."}
            />
          )}
          {!todayLoading && filteredToday.length > 0 && <DueBorrowerList items={filteredToday} />}
        </>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <>
          {historyFetching && page === 1 && <SkeletonList count={4} />}
          {!historyFetching && filteredHistory.length === 0 && (
            <EmptyState title="No collection history" description="No entries match your current filters." />
          )}
          {filteredHistory.length > 0 && (
            <div className="space-y-3">
              {filteredHistory.map((row) => (
                <CollectionCard key={row.id} row={row} canCollect={canCollect} />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="h-1 mt-2" />
          )}
          {historyFetching && page > 1 && (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}
    </Screen>
  );
}

function CollectionCard({ row, canCollect }: { row: Collection; canCollect: boolean }) {
  return (
    <div className="app-panel p-4">
      {/* Top row: collection ID + edit link */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
          {row.collection_code ?? `CL-${row.id}`}
        </span>
        {canCollect && (
          <Link
            href={`/collections/${row.uuid}/edit`}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Amount — prominent */}
      <p className="text-xl font-bold text-text mb-2">
        ₹{Number(row.amount_paid).toLocaleString("en-IN")}
      </p>

      {/* Date + payment mode chip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-primary-600">
          {formatDateDMY(row.date)}
        </span>
        {row.payment_mode && <PaymentModeChip mode={row.payment_mode} />}
      </div>

      {row.notes && <p className="text-xs text-muted mt-2">{row.notes}</p>}
    </div>
  );
}
