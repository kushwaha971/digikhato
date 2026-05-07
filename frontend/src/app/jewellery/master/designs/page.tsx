"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import type { JwlDesign } from "@/store/jewellery-api";
import { useListDesignsQuery } from "@/store/jewellery-api";

function DesignCard({ design }: Readonly<{ design: JwlDesign }>) {
  return (
    <div className="app-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text truncate">
            {design.name}
            {design.code ? <span className="ml-2 text-xs text-muted font-normal">{design.code}</span> : null}
          </p>
          {design.category ? (
            <p className="text-xs text-muted mt-0.5">Category ID: {design.category}</p>
          ) : (
            <p className="text-xs text-muted mt-0.5">No category</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <p className="text-xs text-muted">Default wt</p>
          <p className="text-sm font-semibold text-text">{design.default_weight ? `${design.default_weight} g` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Labour</p>
          <p className="text-sm font-semibold text-text">{design.default_labour || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Stones</p>
          <p className="text-sm font-semibold text-text">{design.default_stones || "—"}</p>
        </div>
      </div>
    </div>
  );
}

export default function DesignsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);


  const { data, isFetching } = useListDesignsQuery({
    search: debouncedSearch.trim() || undefined,
    page,
  });

  const loadMore = useCallback(() => setPage((prev) => prev + 1), []);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlDesign>(data, isFetching, page, loadMore);

  return (
    <Screen
      title="Designs"
      subtitle="Design library with default weights, stones, and labour."
      backHref="/jewellery/master"
      actions={(
        <Link href="/jewellery/master/designs/new">
          <Button size="sm" leftIcon={<PlusIcon />}>Add design</Button>
        </Link>
      )}
    >
      <div className="space-y-4 max-w-2xl">
        <StickyGlobalSearchBar
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search designs by name or code"
          sticky={false}
        />

        {data ? <p className="text-xs text-muted">{data.count} total designs</p> : null}

        {isFetching && page === 1 ? <SkeletonList count={4} /> : null}

        {!isFetching && items.length === 0 ? (
          <EmptyState
            title="No designs found"
            description="Add your first design to the library."
            action={{ label: "Add design", onClick: () => window.location.href = "/jewellery/master/designs/new" }}
          />
        ) : null}

        {items.length > 0 ? (
          <>
            <div className="space-y-3">
              {items.map((design) => (
                <DesignCard key={design.id} design={design} />
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
      </div>
    </Screen>
  );
}
