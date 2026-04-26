"use client";

import { useParams, useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { LocationForm } from "@/components/forms/LocationForm";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useGetLocationQuery, useUpdateLocationMutation } from "@/features/locations/location-api";
import type { LocationFormValues } from "@/validation";
import { ROUTES } from "@/lib/routes";

export default function EditLocationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: location, isLoading } = useGetLocationQuery(id);
  const [updateLocation] = useUpdateLocationMutation();

  const onSubmit = async (values: LocationFormValues) => {
    await updateLocation({ id, data: values }).unwrap();
    router.push(ROUTES.app.loans.location(id));
  };

  return (
    <Screen title="Edit Location" backHref={ROUTES.app.loans.location(id)}>
      {isLoading && <SkeletonList count={3} />}
      {location && (
        <LocationForm
          onSubmit={onSubmit}
          onCancel={() => router.push(ROUTES.app.loans.location(id))}
          defaultValues={{ name: location.name, description: location.description }}
          submitLabel="Save Changes"
        />
      )}
    </Screen>
  );
}
