"use client";

import { useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { LocationForm } from "@/components/forms/LocationForm";
import { useAddLocationMutation } from "@/features/locations/location-api";
import type { LocationFormValues } from "@/validation";
import { ROUTES } from "@/lib/routes";

export default function AddLocationPage() {
  const router = useRouter();
  const [addLocation] = useAddLocationMutation();

  const onSubmit = async (values: LocationFormValues) => {
    await addLocation(values).unwrap();
    router.push(ROUTES.app.loans.locations);
  };

  return (
    <Screen title="Add Location" backHref={ROUTES.app.loans.locations}>
      <LocationForm onSubmit={onSubmit} submitLabel="Create Location" />
    </Screen>
  );
}
