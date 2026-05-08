"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { StatusBadge } from "@/components/jewellery/shared/StatusBadge";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useAppSelector } from "@/store/hooks";
import {
  useGetItemQuery,
  useListStockMovementsQuery,
  useWriteOffItemMutation,
} from "@/store/jewellery-api";
import { useMemo } from "react";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id);

  const { data: item, isLoading, isError } = useGetItemQuery(id);
  const { data: movementsData, isFetching: movementsFetching } = useListStockMovementsQuery({ item: id });
  const [writeOffItem, writeOffState] = useWriteOffItemMutation();

  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isManager = useMemo(() => {
    const jwlRoles = (currentUser?.module_roles ?? [])
      .filter((r) => r.module === "jewellery" && r.is_active)
      .map((r) => r.role_code);
    return (
      jwlRoles.includes("jwl_admin") ||
      jwlRoles.includes("jwl_manager") ||
      currentUser?.role === "admin"
    );
  }, [currentUser]);

  const handleWriteOff = async () => {
    if (!item) return;
    await writeOffItem({ id: item.id, reason: reason.trim() }).unwrap();
    setConfirmOpen(false);
    setWriteOffOpen(false);
    setReason("");
    router.push("/jewellery/inventory");
  };

  if (isLoading) {
    return (
      <Screen title="Item detail" subtitle="Loading..." backHref="/jewellery/inventory">
        <SkeletonList count={4} />
      </Screen>
    );
  }

  if (isError || !item) {
    return (
      <Screen title="Item detail" backHref="/jewellery/inventory">
        <EmptyState
          title="Item not found"
          description="This item does not exist or could not be loaded."
          action={{ label: "Back to inventory", onClick: () => router.push("/jewellery/inventory") }}
        />
      </Screen>
    );
  }

  const movements = movementsData?.results ?? [];

  return (
    <Screen
      title={item.sku || item.barcode || "Inventory Item"}
      subtitle={item.design_name || "Item detail"}
      backHref="/jewellery/inventory"
      actions={
        isManager && item.status !== "WRITTEN_OFF" ? (
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={() => setWriteOffOpen(true)}
          >
            Write off
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Header info */}
        <section className="app-panel rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted">Status</p>
            <div className="mt-1"><StatusBadge status={item.status} /></div>
          </div>
          <div>
            <p className="text-muted">Metal / Purity</p>
            <p className="font-semibold text-text mt-1">{item.metal_code} / {item.purity_code}</p>
          </div>
          <div>
            <p className="text-muted">Branch</p>
            <p className="font-semibold text-text mt-1">{item.branch_name || "—"}</p>
          </div>
          <div>
            <p className="text-muted">Category</p>
            <p className="font-semibold text-text mt-1">{item.category_name || "—"}</p>
          </div>
        </section>

        {/* Weight details */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Weight details</h2>
          </header>
          <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {(
              [
                { label: "Gross wt", value: item.gross_wt },
                { label: "Net wt", value: item.net_wt },
                { label: "Stone wt", value: item.stone_wt },
                { label: "Less wt", value: item.less_wt },
                { label: "Charge wt", value: item.charge_wt },
              ] as { label: string; value: string }[]
            ).map(({ label, value }) => (
              <div key={label}>
                <p className="text-muted">{label}</p>
                <p className="font-semibold text-text mt-1">{value} g</p>
              </div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Location</h2>
          </header>
          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Bin / Shelf</p>
              <p className="font-semibold text-text mt-1">{item.location_bin || "—"}</p>
            </div>
            <div>
              <p className="text-muted">Branch</p>
              <p className="font-semibold text-text mt-1">{item.branch_name || "—"}</p>
            </div>
          </div>
        </section>

        {/* Financial */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Financial</h2>
          </header>
          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Cost price</p>
              <p className="font-semibold text-text mt-1">{item.cost_price ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted">MRP</p>
              <p className="font-semibold text-text mt-1">{item.mrp ?? "—"}</p>
            </div>
          </div>
        </section>

        {/* Diamonds */}
        {item.diamonds.length > 0 ? (
          <section className="app-panel rounded-2xl overflow-hidden">
            <header className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-text">Diamonds</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface2 text-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Cut</th>
                    <th className="px-4 py-2 text-left font-semibold">Color</th>
                    <th className="px-4 py-2 text-left font-semibold">Clarity</th>
                    <th className="px-4 py-2 text-left font-semibold">Carat</th>
                    <th className="px-4 py-2 text-left font-semibold">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {item.diamonds.map((d) => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-2">{d.cut || "—"}</td>
                      <td className="px-4 py-2">{d.color || "—"}</td>
                      <td className="px-4 py-2">{d.clarity || "—"}</td>
                      <td className="px-4 py-2">{d.carat}</td>
                      <td className="px-4 py-2">{d.certificate_no || d.certificate_lab || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Stones */}
        {item.stones.length > 0 ? (
          <section className="app-panel rounded-2xl overflow-hidden">
            <header className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-text">Stones</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface2 text-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Stone type</th>
                    <th className="px-4 py-2 text-left font-semibold">Count</th>
                    <th className="px-4 py-2 text-left font-semibold">Weight (ct)</th>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {item.stones.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-2">{s.stone_type}</td>
                      <td className="px-4 py-2">{s.count}</td>
                      <td className="px-4 py-2">{s.weight_carat ?? "—"}</td>
                      <td className="px-4 py-2">{s.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Movement history */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Movement history</h2>
          </header>
          {movementsFetching ? (
            <div className="p-4"><SkeletonList count={3} /></div>
          ) : movements.length === 0 ? (
            <div className="p-4">
              <p className="text-sm text-muted">No movements recorded for this item.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {movements.map((mv) => (
                <div key={mv.id} className="px-4 py-3 flex items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium text-text">{mv.movement_type}</p>
                    {mv.notes ? <p className="text-xs text-muted mt-0.5">{mv.notes}</p> : null}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-text">{mv.weight} g</p>
                    <p className="text-xs text-muted">{new Date(mv.ts).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Write-off modal with reason textarea */}
      <Modal
        open={writeOffOpen}
        onClose={() => setWriteOffOpen(false)}
        title="Write off item"
        footer={
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setWriteOffOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={reason.trim().length < 3}
              onClick={() => setConfirmOpen(true)}
            >
              Write off
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-muted">Please provide a reason for writing off this item (min. 3 characters).</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for write-off"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleWriteOff}
        title="Write off this item?"
        description={`This will permanently write off ${item.sku || item.barcode || "this item"}. This action cannot be undone.`}
        confirmLabel="Yes, write off"
        confirmVariant="danger"
        isLoading={writeOffState.isLoading}
      />
    </Screen>
  );
}
