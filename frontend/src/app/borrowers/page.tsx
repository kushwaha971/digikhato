"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FilterSelect, ResponsiveFilterPanel } from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { useListBorrowersQuery } from "@/features/borrowers/borrower-api";
import type { Borrower } from "@/features/borrowers/borrower-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const statusVariant = {
  active: "success" as const,
  inactive: "neutral" as const,
};

export default function BorrowerListPage() {
  const { isAdmin } = useRoleAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [draftStatus, setDraftStatus] = useState(status);
  const [page, setPage] = useState(1);

  const { data, isFetching } = useListBorrowersQuery({
    search: search || undefined,
    status: status || undefined,
    ordering: "-updated_at",
    page,
  });

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const { items: borrowers, hasMore, sentinelRef } = useInfiniteItems<Borrower>(
    data,
    isFetching,
    page,
    loadMore,
  );

  function applyFilters() {
    setStatus(draftStatus);
    setPage(1);
  }

  function resetFilters() {
    setStatus("");
    setDraftStatus("");
    setPage(1);
  }

  return (
    <Screen
      title="Borrowers"
      actions={
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link href="/borrowers/add">
              <Button size="sm" fullWidth={false}>+ Add Borrower</Button>
            </Link>
          ) : null}
          <ResponsiveFilterPanel
            title="Filter Borrowers"
            hasActiveFilters={Boolean(status)}
            onApply={applyFilters}
            onReset={resetFilters}
          >
            <FilterSelect
              label="Status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </FilterSelect>
          </ResponsiveFilterPanel>
        </div>
      }
    >
      <div className="space-y-3 mb-4">
        <StickyGlobalSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name or mobile…"
        />
        {status ? <p className="text-xs text-muted">Filters applied</p> : null}
      </div>

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && borrowers.length === 0 && (
        <EmptyState
          title="No borrowers found"
          description={search || status ? "Try different filters." : "Add your first borrower to get started."}
          action={isAdmin ? { label: "Add Borrower", onClick: () => globalThis.location.assign("/borrowers/add") } : undefined}
        />
      )}

      {borrowers.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {borrowers.map((borrower) => (
              <BorrowerCard key={borrower.id} borrower={borrower} />
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

function BorrowerCard({ borrower }: { borrower: Borrower }) {
  return (
    <Link href={`/borrowers/${borrower.uuid}`} className="block">
      <div className={`app-panel p-4 card-clickable h-full ${
        borrower.has_alert ? "border border-danger-400 bg-danger-50/40 dark:bg-danger-900/10" : ""
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {borrower.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text text-sm truncate">{borrower.name}</p>
              {borrower.address && (
                <p className="text-xs text-muted truncate mt-0.5">{borrower.address}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {borrower.has_alert && (
              <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" title="Loan due soon" />
            )}
            <Badge variant={statusVariant[borrower.status] ?? "neutral"} className="capitalize">
              {borrower.status}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
