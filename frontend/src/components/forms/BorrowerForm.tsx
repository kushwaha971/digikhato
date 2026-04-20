"use client";

import { useFormik } from "formik";

import {
  FormErrorBanner,
  MobileNumberInput,
  TextArea,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import {
  borrowerInitialValues,
  borrowerValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  normalizeMobile,
  trimObjectValues,
  type BorrowerFormValues,
} from "@/validation";

type BorrowerFormProps = Readonly<{
  onSubmit: (data: BorrowerFormValues) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<BorrowerFormValues>;
  submitLabel?: string;
}>;

const BORROWER_FIELDS: Array<keyof BorrowerFormValues> = ["name", "mobile_number", "address", "assigned_agent"];

export function BorrowerForm({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = "Save Borrower",
}: BorrowerFormProps) {
  const formik = useFormik<BorrowerFormValues>({
    enableReinitialize: true,
    initialValues: {
      ...borrowerInitialValues,
      ...defaultValues,
      address: defaultValues?.address ?? "",
    },
    validationSchema: borrowerValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const payload = trimObjectValues(values);
        payload.mobile_number = normalizeMobile(payload.mobile_number);
        await onSubmit(payload);
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, BORROWER_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const nameState = formikFieldState(formik, "name");
  const mobileState = formikFieldState(formik, "mobile_number");
  const addressState = formikFieldState(formik, "address");

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
      <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

      <TextInput
        label="Full Name"
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={nameState.touched}
        error={nameState.error}
        placeholder="Borrower's full name"
        required
        data-testid="borrower-name"
      />

      <MobileNumberInput
        label="Mobile Number"
        name="mobile_number"
        value={formik.values.mobile_number}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={mobileState.touched}
        error={mobileState.error}
        placeholder="10-digit mobile number"
        required
        data-testid="borrower-mobile"
      />

      <TextArea
        label="Address"
        name="address"
        value={formik.values.address ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={addressState.touched}
        error={addressState.error}
        placeholder="Borrower's address (optional)"
        data-testid="borrower-address"
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
