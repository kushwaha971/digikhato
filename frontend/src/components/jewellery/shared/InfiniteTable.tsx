"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export interface TableColumn {
  key: string;
  label: string;
  className?: string;
}

interface InfiniteTableProps<T> {
  columns: TableColumn[];
  rows: T[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  keyExtractor: (row: T) => string;
  renderRow: (row: T) => ReactNode;
  skeletonRowCount?: number;
}

function SkeletonRows({ columns, count }: { columns: TableColumn[]; count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          {columns.map((col) => (
            <td key={col.key} className="px-4 py-3">
              <Skeleton height="h-4" width="w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function InfiniteTable<T>({
  columns,
  rows,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
  emptyTitle = "No records found",
  emptyDescription,
  keyExtractor,
  renderRow,
  skeletonRowCount = 6,
}: InfiniteTableProps<T>) {
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  const stableOnLoadMore = useCallback(onLoadMore, [onLoadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingMore) {
          stableOnLoadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, stableOnLoadMore]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface2">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-semibold text-muted whitespace-nowrap ${col.className ?? ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows columns={columns} count={skeletonRowCount} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            <>
              {rows.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-t border-border hover:bg-surface2/40 transition-colors"
                >
                  {renderRow(row)}
                </tr>
              ))}
              {isFetchingMore && <SkeletonRows columns={columns} count={3} />}
              {hasMore && !isFetchingMore && (
                <tr ref={sentinelRef}>
                  <td colSpan={columns.length} className="py-2" />
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
