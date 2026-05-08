"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useListItemPuritySummaryQuery, useListItemsQuery } from "@/store/jewellery-api";

export function PurityTrackingView() {
  const [metalCode, setMetalCode] = useState("");
  const [selectedPurity, setSelectedPurity] = useState("");

  const { data: summary = [], isFetching: summaryLoading } = useListItemPuritySummaryQuery({
    metal_code: metalCode || undefined,
  });

  const { data: itemsData, isFetching: itemsLoading } = useListItemsQuery({
    status: "IN_STOCK",
    metal_code: metalCode || undefined,
    page_size: 200,
  });

  const items = itemsData?.results ?? [];
  const filteredItems = useMemo(
    () => items.filter((item) => !selectedPurity || item.purity_code === selectedPurity),
    [items, selectedPurity],
  );

  const metals = useMemo(() => {
    const set = new Set(summary.map((row) => row.metal_code));
    return Array.from(set);
  }, [summary]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select label="Metal" value={metalCode} onChange={(e) => { setMetalCode(e.target.value); setSelectedPurity(""); }}>
          <option value="">All metals</option>
          {metals.map((metal) => (
            <option key={metal} value={metal}>{metal}</option>
          ))}
        </Select>
      </div>

      {summaryLoading ? <SkeletonList count={4} /> : null}

      {!summaryLoading && summary.length === 0 ? (
        <EmptyState
          title="No purity summary"
          description="No in-stock inventory available for the selected filter."
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((row) => {
          const active = selectedPurity === row.purity_code;
          return (
            <button
              key={`${row.metal_code}-${row.purity_code}`}
              type="button"
              onClick={() => setSelectedPurity((prev) => (prev === row.purity_code ? "" : row.purity_code))}
              className={[
                "app-panel p-3 text-left transition-colors",
                active ? "ring-2 ring-primary-400 border-primary-500" : "",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-text">{row.metal_code} {row.purity_code}</p>
              <p className="text-xs text-muted mt-1">{row.item_count} items</p>
              <p className="text-xs text-muted">Net: {row.net_wt_total} g</p>
              <p className="text-xs text-muted">Gross: {row.gross_wt_total} g</p>
              <p className="text-xs text-muted">Charge: {row.charge_wt_total} g</p>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text">Items {selectedPurity ? `(${selectedPurity})` : ""}</h3>
          {selectedPurity ? <Badge variant="primary">Filtered</Badge> : null}
        </div>

        {itemsLoading ? <div className="p-4"><SkeletonList count={3} /></div> : null}

        {!itemsLoading && filteredItems.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No items" description="No items match this purity filter." />
          </div>
        ) : null}

        {!itemsLoading && filteredItems.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredItems.map((item) => (
              <Link key={item.id} href={`/jewellery/inventory/${item.id}`} className="block px-4 py-3 hover:bg-surface2 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{item.sku || item.barcode || "Unlabeled item"}</p>
                    <p className="text-xs text-muted truncate">{item.design_name}</p>
                  </div>
                  <p className="text-xs text-muted whitespace-nowrap">{item.net_wt} g</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
