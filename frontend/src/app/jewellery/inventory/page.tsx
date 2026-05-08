"use client";

import Link from "next/link";
import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { HUIDTrackingView } from "@/components/jewellery/inventory/HUIDTrackingView";
import { PurityTrackingView } from "@/components/jewellery/inventory/PurityTrackingView";
import { ModulePlaceholder } from "@/components/jewellery/shared/ModulePlaceholder";
import { StatusBadge } from "@/components/jewellery/shared/StatusBadge";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { PlusIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveFilterPanel, FilterSelect } from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { ROUTES } from "@/lib/routes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { JwlItem } from "@/store/jewellery-api";
import { useListItemsQuery } from "@/store/jewellery-api";
import { setInventoryFilters, resetInventoryFilters } from "@/store/jewellery-filters-slice";

const PLACEHOLDER_VIEWS = new Set(["stock-take", "chain-of-custody"]);

const VIEW_CONFIG: Record<string, { title: string; description: string }> = {
  "item-master": {
    title: "Item master",
    description: "Track every piece of jewellery with complete weight, purity, and location detail.",
  },
  purity: {
    title: "Purity tracking",
    description: "Monitor purity readings, certification flags, and quality checks for stock.",
  },
  huid: {
    title: "HUID / BIS hallmark",
    description: "Manage HUID, hallmark status, and traceability checkpoints for each item.",
  },
  "stock-take": {
    title: "Physical stock-take",
    description: "Run stock-take sessions, reconcile variances, and close branch counts.",
  },
  "chain-of-custody": {
    title: "Item Chain of Custody",
    description: "Track every piece of jewellery with complete weight, purity, and location detail.",
  },
};

function ItemCard({ item }: { item: JwlItem }) {
  return (
    <Link href={`/jewellery/inventory/${item.id}`} className="block">
      <div className="app-panel p-4 card-clickable">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{item.sku || item.barcode || "Unlabeled item"}</p>
            <p className="text-xs text-muted mt-0.5 truncate">{item.design_name}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-xs text-muted">Metal / Purity</p>
            <p className="text-sm font-semibold text-text">{item.metal_code} / {item.purity_code}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Net wt</p>
            <p className="text-sm font-semibold text-text">{item.net_wt} g</p>
          </div>
        </div>

        <p className="text-xs text-muted mt-3 truncate">Branch: {item.branch_name || "-"}</p>
      </div>
    </Link>
  );
}

function ItemMasterPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.jewelleryFilters.inventory);
  const { search, status, page } = filters;

  const [draftStatus, setDraftStatus] = useState(status);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useListItemsQuery({
    page,
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
  });

  const loadMore = useCallback(() => dispatch(setInventoryFilters({ page: page + 1 })), [dispatch, page]);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlItem>(data, isFetching, page, loadMore);

  const hasFilters = Boolean(search.trim() || status);

  return (
    <Screen
      title="Item master"
      subtitle="Track every piece of jewellery with complete weight, purity, and location detail."
      backHref={ROUTES.app.jewellery.dashboard}
      actions={(
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ResponsiveFilterPanel
            title="Filter inventory"
            hasActiveFilters={Boolean(status)}
            onApply={() => {
              dispatch(setInventoryFilters({ status: draftStatus, page: 1 }));
            }}
            onReset={() => {
              dispatch(resetInventoryFilters());
              setDraftStatus("");
            }}
          >
            <FilterSelect label="Status" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}>
              <option value="">All</option>
              <option value="IN_STOCK">In stock</option>
              <option value="SOLD">Sold</option>
              <option value="ISSUED">Issued</option>
              <option value="TRANSIT">Transit</option>
              <option value="WRITTEN_OFF">Written off</option>
            </FilterSelect>
          </ResponsiveFilterPanel>

          <Button variant="success" size="sm" leftIcon={<PlusIcon />} onClick={() => setCreateDrawerOpen(true)}>
            Add item
          </Button>
        </div>
      )}
    >
      <div className="space-y-3 mb-4">
        <StickyGlobalSearchBar
          value={search}
          onChange={(value) => {
            dispatch(setInventoryFilters({ search: value, page: 1 }));
          }}
          placeholder="Search by SKU, HUID, barcode"
          sticky={false}
        />
        {data ? <p className="text-xs text-muted">{data.count} total items</p> : null}
        {hasFilters ? <p className="text-xs text-muted">Filters applied</p> : null}
      </div>

      {isFetching && page === 1 ? <SkeletonList count={4} /> : null}

      {!isFetching && items.length === 0 ? (
        <EmptyState
          title="No inventory items"
          description={hasFilters ? "No records match your current filters." : "Add your first jewellery item to begin tracking stock."}
          action={{ label: "Add item", onClick: () => setCreateDrawerOpen(true) }}
        />
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {hasMore ? <div ref={sentinelRef} className="h-1 mt-2" /> : null}
          {isFetching && page > 1 ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          ) : null}
        </>
      ) : null}

      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Add item"
        size="2xl"
      >
        <iframe
          src="/jewellery/inventory/new"
          className="w-full h-[80vh] rounded-xl border border-border"
          title="Add inventory item form"
        />
      </Drawer>
    </Screen>
  );
}

function InventoryPageInner() {
  const searchParams = useSearchParams();
  const rawView = searchParams.get("view") ?? "item-master";
  const view = rawView in VIEW_CONFIG ? rawView : "item-master";

  if (view === "purity") {
    const config = VIEW_CONFIG.purity;
    return (
      <Screen
        title={config.title}
        subtitle={config.description}
        backHref={ROUTES.app.jewellery.dashboard}
      >
        <PurityTrackingView />
      </Screen>
    );
  }

  if (view === "huid") {
    const config = VIEW_CONFIG.huid;
    return (
      <Screen
        title={config.title}
        subtitle={config.description}
        backHref={ROUTES.app.jewellery.dashboard}
      >
        <HUIDTrackingView />
      </Screen>
    );
  }

  if (PLACEHOLDER_VIEWS.has(view)) {
    const config = VIEW_CONFIG[view];
    return (
      <ModulePlaceholder
        title={config.title}
        description={config.description}
        presetKey={config.title}
      />
    );
  }

  return <ItemMasterPage />;
}

export default function JewelleryInventoryPage() {
  return (
    <Suspense fallback={<Screen title="Inventory" subtitle="Loading…">{null}</Screen>}>
      <InventoryPageInner />
    </Suspense>
  );
}
