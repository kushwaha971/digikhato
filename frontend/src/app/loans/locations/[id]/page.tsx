"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { LocationForm } from "@/components/forms/LocationForm";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { useGetLocationQuery, useUpdateLocationMutation } from "@/features/locations/location-api";
import { useListBorrowersQuery, type Borrower } from "@/features/borrowers/borrower-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { ROUTES } from "@/lib/routes";
import type { LocationFormValues } from "@/validation";

const statusVariant = {
  active: "success" as const,
  inactive: "neutral" as const,
};

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useRoleAccess();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);

  const { data: location, isLoading: locationLoading } = useGetLocationQuery(id);
  const [updateLocation] = useUpdateLocationMutation();

  const { data, isFetching } = useListBorrowersQuery({
    search: search || undefined,
    location: Number(id),
    ordering: "-updated_at",
    page,
  });

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const { items: borrowers, hasMore, sentinelRef } = useInfiniteItems<Borrower>(
    data,
    isFetching,
    page,
    loadMore,
  );

  const onEdit = async (values: LocationFormValues) => {
    await updateLocation({ id, data: values }).unwrap();
    setEditOpen(false);
  };

  return (
    <Screen
      title={locationLoading ? "Location" : (location?.name ?? "Location")}
      backHref={ROUTES.app.loans.locations}
      actions={
        isAdmin && location ? (
          <Button size="sm" variant="secondary" fullWidth={false} onClick={() => setEditOpen(true)}>
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
        ) : null
      }
    >
      {location?.description && (
        <p className="text-sm text-muted mb-4">{location.description}</p>
      )}

      <div className="mb-4">
        <StickyGlobalSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search borrowers in this location…"
        />
      </div>

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && borrowers.length === 0 && (
        <EmptyState
          title="No borrowers found"
          description={search ? "Try a different search term." : "No borrowers are assigned to this location yet."}
        />
      )}

      {borrowers.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {borrowers.map((borrower) => (
              <LocationBorrowerCard key={borrower.id} borrower={borrower} />
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

      {location && (
        <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Edit Location">
          <LocationForm
            onSubmit={onEdit}
            onCancel={() => setEditOpen(false)}
            defaultValues={{ name: location.name, description: location.description }}
            submitLabel="Save Changes"
          />
        </Drawer>
      )}
    </Screen>
  );
}

function LocationBorrowerCard({ borrower }: Readonly<{ borrower: Borrower }>) {
  return (
    <Link href={ROUTES.app.loans.borrower(borrower.uuid ?? borrower.id)} className="block">
      <div className={`app-panel p-4 card-clickable h-full ${
        borrower.has_alert ? "border border-danger-300 bg-danger-50/30 dark:bg-danger-900/10" : ""
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {borrower.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text text-sm truncate">{borrower.name}</p>
              <p className="text-xs text-muted truncate mt-0.5">{borrower.mobile_number}</p>
              {borrower.address && (
                <p className="text-xs text-muted truncate">{borrower.address}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {borrower.has_alert && (
              <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" title="Loan due soon" />
            )}
            <Badge variant={statusVariant[borrower.status] ?? "neutral"} className="capitalize">
              {borrower.status}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
