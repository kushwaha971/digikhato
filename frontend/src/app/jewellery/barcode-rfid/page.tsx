"use client";

import { memo } from "react";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useListItemsQuery, type JwlItem } from "@/store/jewellery-api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function itemStatusVariant(status: JwlItem["status"]): "success" | "neutral" | "warning" | "danger" {
  if (status === "IN_STOCK") return "success";
  if (status === "SOLD") return "neutral";
  if (status === "ISSUED") return "warning";
  if (status === "TRANSIT") return "warning";
  if (status === "WRITTEN_OFF") return "danger";
  return "neutral";
}

// ─── Tagged Items Table ───────────────────────────────────────────────────────

const TaggedItemsTable = memo(function TaggedItemsTable({ items }: { items: JwlItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm" data-testid="tagged-items-table">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-2 py-2">SKU</th>
            <th className="px-2 py-2">HUID</th>
            <th className="px-2 py-2">Barcode</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Branch</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/70 last:border-0">
              <td className="px-2 py-2 font-medium text-text">{item.sku || "—"}</td>
              <td className="px-2 py-2 font-mono text-xs">{item.huid || "—"}</td>
              <td className="px-2 py-2 font-mono text-xs">{item.barcode || "—"}</td>
              <td className="px-2 py-2">
                <Badge variant={itemStatusVariant(item.status)}>{item.status}</Badge>
              </td>
              <td className="px-2 py-2">{item.branch_name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JewelleryBarcodeRfidPage() {
  const { data, isLoading, isFetching, error } = useListItemsQuery({ page_size: 50 });

  const allItems = data?.results ?? [];
  // Client-side filter: only items with a barcode or HUID set
  const taggedItems = allItems.filter((item) => item.barcode || item.huid);
  const isWorking = isLoading || isFetching;

  return (
    <Screen
      title="Barcode & RFID"
      subtitle="Manage item tags and prepare for hardware scanning."
    >
      <div className="space-y-8">
        {/* Section 1 — Tagged Items */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Tagged Items
          </h2>

          <div className="app-panel p-4">
            {isWorking && <SkeletonList count={5} />}

            {!isWorking && error && (
              <EmptyState
                title="Could not load items"
                description="There was a problem fetching inventory items. Please try again."
              />
            )}

            {!isWorking && !error && taggedItems.length === 0 && (
              <EmptyState
                title="No tagged items yet"
                description="Add a barcode or HUID when creating inventory items."
              />
            )}

            {!isWorking && !error && taggedItems.length > 0 && (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="neutral">{taggedItems.length} tagged item{taggedItems.length !== 1 ? "s" : ""}</Badge>
                </div>
                <TaggedItemsTable items={taggedItems} />
              </>
            )}
          </div>
        </section>

        {/* Section 2 — Print Tags (Phase 3 preview) */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Print Tags
          </h2>
          <div className="app-panel p-5 opacity-60" data-testid="print-tags-section">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-text">Bulk Tag Printing</p>
                <p className="mt-1 text-xs text-muted leading-relaxed max-w-md">
                  Bulk tag printing requires RFID hardware integration. Available in Phase 3.
                </p>
              </div>
              <Button
                disabled
                variant="secondary"
                data-testid="print-tags-btn"
                aria-label="Print Tags"
              >
                Print Tags
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Screen>
  );
}
