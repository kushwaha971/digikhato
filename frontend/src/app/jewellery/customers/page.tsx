"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { ROUTES } from "@/lib/routes";
import type { JwlCustomer } from "@/store/jewellery-api";
import { useListCustomersQuery } from "@/store/jewellery-api";

function CustomerCard({ customer }: Readonly<{ customer: JwlCustomer }>) {
  return (
    <Link href={`/jewellery/customers/${customer.id}`} className="block">
      <div className="app-panel p-4 card-clickable">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{customer.name}</p>
            <p className="text-xs text-muted mt-0.5">
              {customer.mobile}
              {customer.city ? <><span className="mx-1.5">·</span>{customer.city}</> : null}
            </p>
          </div>
          {customer.loyalty_points > 0 ? (
            <Badge variant="primary" className="shrink-0">
              {customer.loyalty_points} pts
            </Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function JewelleryCustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useListCustomersQuery({
    search: debouncedSearch.trim() || undefined,
  });

  const loadMore = useCallback(() => setPage((prev) => prev + 1), []);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlCustomer>(data, isFetching, page, loadMore);

  return (
    <Screen
      title="Customers"
      subtitle="Manage customer profiles, KYC, and purchase history"
      backHref={ROUTES.app.jewellery.dashboard}
      actions={(
        <Button onClick={() => router.push("/jewellery/customers/new")}>
          Add customer
        </Button>
      )}
    >
      <div className="space-y-3 mb-4">
        <StickyGlobalSearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name or mobile"
          sticky={false}
        />
      </div>

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && items.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={search.trim() ? "No customers match your search." : "Add your first customer to get started."}
          action={{
            label: "Add customer",
            onClick: () => router.push("/jewellery/customers/new"),
          }}
        />
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="space-y-3">
            {items.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
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
    </Screen>
  );
}
