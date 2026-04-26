"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { PaymentModeChip } from "@/components/ui/PaymentModeChip";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FilterSelect,
  ResponsiveFilterPanel,
} from "@/components/ui/ResponsiveFilterPanel";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { useListCollectionsQuery, type Collection } from "@/features/collections/collection-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDateDMY } from "@/lib/format";
import { PAYMENT_MODE_OPTIONS } from "@/validation";
import { ROUTES } from "@/lib/routes";

export default function CollectionHistoryPage() {
  const { isAdmin, isCollector } = useRoleAccess();
  const canCollect = isAdmin || isCollector;

  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [draftPaymentMode, setDraftPaymentMode] = useState("");
  const [page, setPage] = useState(1);

  const { data, isFetching } = useListCollectionsQuery({
    search: search || undefined,
    payment_mode: paymentMode || undefined,
    ordering: "-date,-updated_at",
    page,
  });

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const { items, hasMore, sentinelRef } = useInfiniteItems<Collection>(data, isFetching, page, loadMore);

  function applyFilters() {
    setPaymentMode(draftPaymentMode);
    setPage(1);
  }

  function resetFilters() {
    setPaymentMode("");
    setDraftPaymentMode("");
    setPage(1);
  }

  return (
    <Screen
      title="Collection History"
      backHref={ROUTES.app.loans.collections}
      actions={
        <ResponsiveFilterPanel
          title="Filter History"
          hasActiveFilters={Boolean(paymentMode)}
          onApply={applyFilters}
          onReset={resetFilters}
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
        </ResponsiveFilterPanel>
      }
    >
      <div className="mb-3">
        <StickyGlobalSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search borrower, collection code…"
        />
      </div>

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && items.length === 0 && (
        <EmptyState title="No collection history" description="No entries match your current filters." />
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((row) => (
            <div key={row.id} className="app-panel p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {row.borrower_name ? row.borrower_name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text text-sm truncate">
                      {row.borrower_name ?? `Borrower #${row.borrower}`}
                    </p>
                    {row.borrower_mobile && (
                      <p className="text-xs text-muted truncate">{row.borrower_mobile}</p>
                    )}
                  </div>
                </div>
                {canCollect && (
                  <Link
                    href={ROUTES.app.loans.collectionEdit(row.uuid)}
                    className="text-xs font-semibold text-primary-600 hover:underline flex-shrink-0"
                  >
                    Edit
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-lg font-bold text-text">
                  ₹{Number(row.amount_paid).toLocaleString("en-IN")}
                </p>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="text-sm text-muted">{formatDateDMY(row.date)}</span>
                  {row.payment_mode && <PaymentModeChip mode={row.payment_mode} />}
                </div>
              </div>

              <span className="text-xs text-muted">{row.collection_code ?? `CL-${row.id}`}</span>

              {row.notes && <p className="text-xs text-muted mt-2 border-t border-border pt-2">{row.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-1 mt-2" />}
      {isFetching && page > 1 && (
        <div className="py-4 flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      )}
    </Screen>
  );
}
