"use client";

import { useMemo, useState } from "react";

import { DueBorrowerList } from "@/components/business/DueBorrowerList";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { Screen } from "@/components/layout/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useListTodayDueQuery } from "@/features/collections/collection-api";

export default function TodayCollectionPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListTodayDueQuery();
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data?.results ?? [];
    return (data?.results ?? []).filter((loan) => loan.borrower_name.toLowerCase().includes(q));
  }, [data?.results, search]);

  return (
    <Screen title="Today Collection List" backHref="/collections">
      <StickyGlobalSearchBar value={search} onChange={setSearch} placeholder="Search borrower for collection" />
      {isLoading ? <SkeletonList count={4} /> : null}
      {!isLoading && filtered.length === 0 ? (
        <EmptyState title="No borrowers due today" description="All due collections are complete for today." />
      ) : null}
      {!isLoading && filtered.length > 0 ? <DueBorrowerList items={filtered} /> : null}
    </Screen>
  );
}
