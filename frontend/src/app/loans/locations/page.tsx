"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { LocationForm } from "@/components/forms/LocationForm";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { useListLocationsQuery, useAddLocationMutation, type Location } from "@/features/locations/location-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { ROUTES } from "@/lib/routes";
import type { LocationFormValues } from "@/validation";

export default function LocationListPage() {
  const { isAdmin } = useRoleAccess();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addLocation] = useAddLocationMutation();

  const { data, isFetching } = useListLocationsQuery({
    search: search || undefined,
    ordering: "name",
    page,
  });

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const { items: locations, hasMore, sentinelRef } = useInfiniteItems<Location>(
    data,
    isFetching,
    page,
    loadMore,
  );

  const onAdd = async (values: LocationFormValues) => {
    await addLocation(values).unwrap();
    setDrawerOpen(false);
  };

  return (
    <Screen
      title="Locations"
      backHref={ROUTES.app.loans.dashboard}
      actions={
        isAdmin ? (
          <Button size="sm" fullWidth={false} onClick={() => setDrawerOpen(true)}>
            + Add Location
          </Button>
        ) : null
      }
    >
      <div className="mb-4">
        <StickyGlobalSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search locations…"
        />
      </div>

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && locations.length === 0 && (
        <EmptyState
          title="No locations found"
          description={search ? "Try a different search term." : "Create your first location to organise borrowers."}
          action={isAdmin ? { label: "Add Location", onClick: () => setDrawerOpen(true) } : undefined}
        />
      )}

      {locations.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>

          {hasMore && <div ref={sentinelRef} className="h-1 mt-2" />}
          {isFetching && page > 1 && (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Location">
        <LocationForm
          onSubmit={onAdd}
          onCancel={() => setDrawerOpen(false)}
          submitLabel="Create Location"
        />
      </Drawer>
    </Screen>
  );
}

function LocationCard({ location }: Readonly<{ location: Location }>) {
  return (
    <Link href={ROUTES.app.loans.location(location.id)} className="block">
      <div className="app-panel p-4 card-clickable h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface2 text-muted">
            {location.borrower_count} borrower{location.borrower_count === 1 ? "" : "s"}
          </span>
        </div>
        <p className="font-semibold text-text text-sm">{location.name}</p>
        {location.description && (
          <p className="text-xs text-muted mt-1 line-clamp-2">{location.description}</p>
        )}
      </div>
    </Link>
  );
}
