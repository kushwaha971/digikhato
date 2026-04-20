"use client";

import { useMemo } from "react";
import { useFormik } from "formik";

import {
  FormErrorBanner,
  MobileNumberInput,
  PasswordInput,
  TextArea,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import {
  borrowerCreateValidationSchema,
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
  showPasswordField?: boolean;
  requirePassword?: boolean;
}>;

const BORROWER_FIELDS: Array<keyof BorrowerFormValues> = ["name", "mobile_number", "address", "assigned_agent", "password"];

export function BorrowerForm({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = "Save Borrower",
  showPasswordField = false,
  requirePassword = false,
}: BorrowerFormProps) {
  const validationSchema = useMemo(
    () => (showPasswordField && requirePassword ? borrowerCreateValidationSchema : borrowerValidationSchema),
    [showPasswordField, requirePassword],
  );

  const formik = useFormik<BorrowerFormValues>({
    enableReinitialize: true,
    initialValues: {
      ...borrowerInitialValues,
      ...defaultValues,
      address: defaultValues?.address ?? "",
    },
    validationSchema,
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
  const passwordState = formikFieldState(formik, "password");

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

      {showPasswordField ? (
        <PasswordInput
          label={requirePassword ? "Login Password" : "Login Password (optional)"}
          name="password"
          value={formik.values.password ?? ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          touched={passwordState.touched}
          error={passwordState.error}
          placeholder="Enter borrower login password"
          helperText="Minimum 8 characters"
          required={requirePassword}
          data-testid="borrower-password"
        />
      ) : null}

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
