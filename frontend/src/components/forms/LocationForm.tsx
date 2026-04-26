"use client";

import { useFormik } from "formik";

import {
  FormErrorBanner,
  TextArea,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import {
  locationInitialValues,
  locationValidationSchema,
  mapBackendErrorsToFormik,
  focusFirstInvalidField,
  type LocationFormValues,
} from "@/validation";

const LOCATION_FIELDS: Array<keyof LocationFormValues> = ["name", "description"];

type LocationFormProps = Readonly<{
  onSubmit: (data: LocationFormValues) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<LocationFormValues>;
  submitLabel?: string;
}>;

export function LocationForm({ onSubmit, onCancel, defaultValues, submitLabel = "Save Location" }: LocationFormProps) {
  const formik = useFormik<LocationFormValues>({
    enableReinitialize: true,
    initialValues: {
      ...locationInitialValues,
      ...defaultValues,
    },
    validationSchema: locationValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await onSubmit({ name: values.name.trim(), description: (values.description ?? "").trim() });
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, LOCATION_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const nameState = formikFieldState(formik, "name");
  const descriptionState = formikFieldState(formik, "description");

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
      <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

      <TextInput
        label="Location Name"
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={nameState.touched}
        error={nameState.error}
        placeholder="e.g. North Zone, Sector 4"
        required
      />

      <TextArea
        label="Description"
        name="description"
        value={formik.values.description ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={descriptionState.touched}
        error={descriptionState.error}
        placeholder="Optional notes about this location"
      />

      <div className="flex gap-3 pt-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={formik.isSubmitting} disabled={formik.isSubmitting} fullWidth>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
