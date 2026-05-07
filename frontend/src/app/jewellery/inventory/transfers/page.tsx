"use client";

import { useState } from "react";
import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveFilterPanel, FilterSelect } from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { transferStatusVariant } from "@/constants/jewellery";
import {
  useListTransfersQuery,
  useApproveTransferMutation,
  useDispatchTransferMutation,
  useReceiveTransferMutation,
} from "@/store/jewellery-api";

export default function TransfersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [draftStatus, setDraftStatus] = useState("");

  const { data, isFetching, refetch } = useListTransfersQuery({
    status: statusFilter || undefined,
  });

  const [approveTransfer, approveState] = useApproveTransferMutation();
  const [dispatchTransfer, dispatchState] = useDispatchTransferMutation();
  const [receiveTransfer, receiveState] = useReceiveTransferMutation();

  type ActionType = "approve" | "dispatch" | "receive";
  const [pendingAction, setPendingAction] = useState<{ id: string; action: ActionType } | null>(null);

  const transfers = data?.results ?? [];

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { id, action } = pendingAction;
    if (action === "approve") await approveTransfer(id).unwrap();
    else if (action === "dispatch") await dispatchTransfer(id).unwrap();
    else await receiveTransfer(id).unwrap();
    setPendingAction(null);
    refetch();
  };

  const isActionLoading =
    approveState.isLoading || dispatchState.isLoading || receiveState.isLoading;

  const ACTION_LABELS: Record<ActionType, string> = {
    approve: "Approve transfer?",
    dispatch: "Dispatch transfer?",
    receive: "Mark as received?",
  };

  return (
    <Screen
      title="Transfers"
      subtitle="Manage stock transfers between branches."
      backHref="/jewellery/inventory"
      actions={
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ResponsiveFilterPanel
            title="Filter transfers"
            hasActiveFilters={Boolean(statusFilter)}
            onApply={() => setStatusFilter(draftStatus)}
            onReset={() => {
              setStatusFilter("");
              setDraftStatus("");
            }}
          >
            <FilterSelect
              label="Status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="REQUESTED">Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_TRANSIT">In transit</option>
              <option value="RECEIVED">Received</option>
              <option value="REJECTED">Rejected</option>
            </FilterSelect>
          </ResponsiveFilterPanel>

          <Link href="/jewellery/inventory/transfers/new">
            <Button variant="success" size="sm">New transfer</Button>
          </Link>
        </div>
      }
    >
      {isFetching ? <SkeletonList count={4} /> : null}

      {!isFetching && transfers.length === 0 ? (
        <EmptyState
          title="No transfers"
          description={statusFilter ? "No transfers match the selected status." : "Create a new transfer to move stock between branches."}
        />
      ) : null}

      {transfers.length > 0 ? (
        <div className="space-y-3">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="app-panel p-4 rounded-2xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">
                    {transfer.from_branch} &rarr; {transfer.to_branch}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(transfer.created_at).toLocaleDateString("en-IN")} &bull;{" "}
                    {transfer.lines.length} line(s)
                  </p>
                  {transfer.notes ? (
                    <p className="text-xs text-muted mt-0.5 italic">{transfer.notes}</p>
                  ) : null}
                </div>
                <Badge variant={transferStatusVariant(transfer.status)}>
                  {transfer.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-3">
                {transfer.status === "REQUESTED" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPendingAction({ id: transfer.id, action: "approve" })}
                  >
                    Approve
                  </Button>
                ) : null}
                {transfer.status === "APPROVED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setPendingAction({ id: transfer.id, action: "dispatch" })}
                  >
                    Dispatch
                  </Button>
                ) : null}
                {transfer.status === "IN_TRANSIT" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="success"
                    onClick={() => setPendingAction({ id: transfer.id, action: "receive" })}
                  >
                    Mark received
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        title={pendingAction ? ACTION_LABELS[pendingAction.action] : "Confirm action"}
        description="This action will update the transfer status. Please confirm to proceed."
        confirmLabel="Confirm"
        isLoading={isActionLoading}
      />
    </Screen>
  );
}
