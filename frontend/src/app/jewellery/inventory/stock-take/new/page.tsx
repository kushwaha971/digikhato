"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/jewellery/shared/StatusBadge";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import {
  useListStockTakesQuery,
  useCreateStockTakeMutation,
  useCompleteStockTakeMutation,
} from "@/store/jewellery-api";

export default function StockTakePage() {
  const router = useRouter();

  const { data, isFetching, refetch } = useListStockTakesQuery({});
  const [createStockTake, createState] = useCreateStockTakeMutation();
  const [completeStockTake, completeState] = useCompleteStockTakeMutation();

  const [notes, setNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const stockTakes = data?.results ?? [];

  const handleCreate = async () => {
    setSuccessMsg(null);
    await createStockTake({ notes: notes.trim() || undefined }).unwrap();
    setNotes("");
    setSuccessMsg("Stock take started successfully.");
    refetch();
  };

  const handleComplete = async () => {
    if (!confirmId) return;
    await completeStockTake(confirmId).unwrap();
    setConfirmId(null);
    refetch();
  };

  return (
    <Screen
      title="Stock take"
      subtitle="Manage physical stock-take sessions for your branch."
      backHref="/jewellery/inventory"
    >
      <div className="space-y-6">
        {/* Active / recent stock takes */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Active / recent stock takes</h2>
          </header>

          {isFetching ? (
            <div className="p-4"><SkeletonList count={3} /></div>
          ) : stockTakes.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No stock takes"
                description="Start a new stock take session below."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stockTakes.map((st) => (
                <div key={st.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={st.status} />
                      <span className="text-xs text-muted">
                        {new Date(st.started_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <p className="text-sm text-text mt-1">Branch: {st.branch_name || "—"}</p>
                    <p className="text-xs text-muted mt-0.5">{st.lines.length} line(s)</p>
                    {st.notes ? <p className="text-xs text-muted mt-0.5 italic">{st.notes}</p> : null}
                  </div>
                  {st.status === "IN_PROGRESS" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="success"
                      onClick={() => setConfirmId(st.id)}
                    >
                      Complete
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Start new stock take */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Start new stock take</h2>
          </header>
          <div className="p-4 space-y-3">
            {successMsg ? (
              <p className="text-sm text-success-600 font-medium">{successMsg}</p>
            ) : null}
            <Textarea
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this stock take session..."
            />
            <Button
              type="button"
              size="sm"
              variant="success"
              onClick={handleCreate}
              loading={createState.isLoading}
            >
              Start stock take
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleComplete}
        title="Complete stock take?"
        description="This will mark the stock take as completed. You will not be able to add more counts after this."
        confirmLabel="Yes, complete"
        confirmVariant="primary"
        isLoading={completeState.isLoading}
      />
    </Screen>
  );
}
