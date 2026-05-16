"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills } from "@/components/ui/FilterPills";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useListTransfersQuery, type JwlTransfer } from "@/store/jewellery-api";

type TransferStatus = JwlTransfer["status"];

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Received", value: "RECEIVED" },
  { label: "Rejected", value: "REJECTED" },
];

type BadgeVariant = "warning" | "primary" | "success" | "danger" | "neutral";

const STATUS_BADGE: Record<TransferStatus, { variant: BadgeVariant; label: string }> = {
  REQUESTED: { variant: "warning", label: "Requested" },
  APPROVED: { variant: "primary", label: "Approved" },
  IN_TRANSIT: { variant: "warning", label: "In Transit" },
  RECEIVED: { variant: "success", label: "Received" },
  REJECTED: { variant: "danger", label: "Rejected" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function JewelleryMultiBranchPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useListTransfersQuery(
    statusFilter ? { status: statusFilter } : {},
  );

  const transfers = data?.results ?? [];

  const summary = useMemo(() => {
    const all = data?.results ?? [];
    return {
      pending: all.filter((t) => t.status === "REQUESTED").length,
      approved: all.filter((t) => t.status === "APPROVED").length,
      inTransit: all.filter((t) => t.status === "IN_TRANSIT").length,
    };
  }, [data]);

  return (
    <Screen
      title="Multi-Branch"
      subtitle="Manage stock transfers between branches."
      actions={
        <Link href="/jewellery/inventory/transfers/new">
          <Button size="sm" fullWidth={false}>
            New Transfer
          </Button>
        </Link>
      }
    >
      {/* Summary cards */}
      {!statusFilter && !isLoading && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="app-panel p-4 text-center">
            <p className="text-2xl font-bold text-text">{summary.pending}</p>
            <p className="text-xs text-muted mt-1">Pending</p>
          </div>
          <div className="app-panel p-4 text-center">
            <p className="text-2xl font-bold text-text">{summary.approved}</p>
            <p className="text-xs text-muted mt-1">Approved</p>
          </div>
          <div className="app-panel p-4 text-center">
            <p className="text-2xl font-bold text-text">{summary.inTransit}</p>
            <p className="text-xs text-muted mt-1">In Transit</p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="mb-4">
        <FilterPills
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Loading */}
      {isLoading ? <SkeletonList count={4} /> : null}

      {/* Empty state */}
      {!isLoading && transfers.length === 0 ? (
        <EmptyState
          title="No transfers found"
          description={
            statusFilter
              ? "No transfers match the selected status filter."
              : "Create your first inter-branch stock transfer to get started."
          }
          action={
            !statusFilter
              ? { label: "New Transfer", onClick: () => { window.location.href = "/jewellery/inventory/transfers/new"; } }
              : undefined
          }
        />
      ) : null}

      {/* Transfer list */}
      {!isLoading && transfers.length > 0 ? (
        <div className="space-y-3">
          {transfers.map((transfer) => {
            const badge = STATUS_BADGE[transfer.status] ?? { variant: "neutral" as BadgeVariant, label: transfer.status };
            const itemCount = transfer.lines?.length ?? 0;
            return (
              <div key={transfer.id} className="app-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text truncate">
                        {transfer.from_branch}
                      </span>
                      <span className="text-xs text-muted">→</span>
                      <span className="text-sm font-semibold text-text truncate">
                        {transfer.to_branch}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted flex-wrap">
                      <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                      <span>Created: {formatDate(transfer.created_at)}</span>
                      {transfer.dispatched_at && (
                        <span>Dispatched: {formatDate(transfer.dispatched_at)}</span>
                      )}
                      {transfer.received_at && (
                        <span>Received: {formatDate(transfer.received_at)}</span>
                      )}
                    </div>
                    {transfer.notes ? (
                      <p className="text-xs text-muted mt-1 truncate">{transfer.notes}</p>
                    ) : null}
                  </div>
                  <Link href={`/jewellery/inventory/transfers/${transfer.id}`}>
                    <Button size="xs" variant="secondary" fullWidth={false}>
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Screen>
  );
}
