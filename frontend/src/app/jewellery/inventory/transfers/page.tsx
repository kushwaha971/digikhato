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
import { TRANSFER_STATUS_OPTIONS, transferStatusVariant } from "@/constants/jewellery";
import {
  useListTransfersQuery,
  useApproveTransferMutation,
  useDispatchTransferMutation,
  useReceiveTransferMutation,
  useRejectTransferMutation,
  type JwlTransfer,
} from "@/store/jewellery-api";

export default function TransfersPage() {
  type TransferStatusFilter = JwlTransfer["status"] | "";
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>("");
  const [draftStatus, setDraftStatus] = useState<TransferStatusFilter>("");

  const { data, isFetching, error, refetch } = useListTransfersQuery({
    status: statusFilter || undefined,
  });

  const [approveTransfer, approveState] = useApproveTransferMutation();
  const [dispatchTransfer, dispatchState] = useDispatchTransferMutation();
  const [receiveTransfer, receiveState] = useReceiveTransferMutation();
  const [rejectTransfer, rejectState] = useRejectTransferMutation();

  type ActionType = "approve" | "dispatch" | "receive" | "reject";
  const [pendingAction, setPendingAction] = useState<{ id: string; action: ActionType } | null>(null);
  const [actionError, setActionError] = useState<string>("");

  const transfers = data?.results ?? [];

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { id, action } = pendingAction;
    try {
      setActionError("");
      if (action === "approve") await approveTransfer(id).unwrap();
      else if (action === "dispatch") await dispatchTransfer(id).unwrap();
      else if (action === "receive") await receiveTransfer(id).unwrap();
      else await rejectTransfer(id).unwrap();
      setPendingAction(null);
      refetch();
    } catch (err: unknown) {
      const fallback = "Transfer action failed. Please retry.";
      if (typeof err === "object" && err && "data" in err) {
        const detail = (err as { data?: { detail?: string } }).data?.detail;
        setActionError(detail || fallback);
      } else {
        setActionError(fallback);
      }
      setPendingAction(null);
    }
  };

  const isActionLoading =
    approveState.isLoading || dispatchState.isLoading || receiveState.isLoading || rejectState.isLoading;

  const ACTION_LABELS: Record<ActionType, string> = {
    approve: "Approve transfer?",
    dispatch: "Dispatch transfer?",
    receive: "Mark as received?",
    reject: "Reject transfer?",
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
              onChange={(e) => setDraftStatus(e.target.value as TransferStatusFilter)}
            >
              {TRANSFER_STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
          </ResponsiveFilterPanel>

          <Link href="/jewellery/inventory/transfers/new">
            <Button variant="success" size="sm">New transfer</Button>
          </Link>
          <Link href="/jewellery/inventory/transfers/register">
            <Button variant="secondary" size="sm">Transfer register</Button>
          </Link>
        </div>
      }
    >
      {isFetching ? <SkeletonList count={4} /> : null}

      {error && !isFetching ? (
        <EmptyState
          title="Could not load transfers"
          description="Retry after checking your network or transfer filters."
          action={{ label: "Retry", onClick: () => void refetch() }}
        />
      ) : null}

      {!isFetching && !error && transfers.length === 0 ? (
        <EmptyState
          title="No transfers"
          description={statusFilter ? "No transfers match the selected status." : "Create a new transfer to move stock between branches."}
        />
      ) : null}

      {actionError ? (
        <p className="text-sm text-danger-600 app-panel p-3 rounded-xl">{actionError}</p>
      ) : null}

      {!error && transfers.length > 0 ? (
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
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPendingAction({ id: transfer.id, action: "approve" })}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => setPendingAction({ id: transfer.id, action: "reject" })}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
                {transfer.status === "APPROVED" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => setPendingAction({ id: transfer.id, action: "dispatch" })}
                    >
                      Dispatch
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => setPendingAction({ id: transfer.id, action: "reject" })}
                    >
                      Reject
                    </Button>
                  </>
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
        description="This action will update the transfer status and branch movement trail. Please confirm to proceed."
        confirmLabel="Confirm"
        isLoading={isActionLoading}
      />
    </Screen>
  );
}
