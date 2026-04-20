"use client";

import { useFormik } from "formik";

import {
  CurrencyInput,
  DateInput,
  FormErrorBanner,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import {
  collectionValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  type CollectionFormValues,
} from "@/validation";

type DailyCollectionFormProps = Readonly<{
  accountId: number;
  onSubmit: (data: CollectionFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}>;

const COLLECTION_FIELDS: Array<keyof CollectionFormValues> = ["account", "payment", "date"];

export function DailyCollectionForm({
  accountId,
  onSubmit,
  onCancel,
  submitLabel = "Save Collection",
}: DailyCollectionFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const formik = useFormik<CollectionFormValues>({
    enableReinitialize: true,
    initialValues: {
      account: accountId,
      date: today,
      payment: 0,
    },
    validationSchema: collectionValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await onSubmit({
          account: accountId,
          payment: Number(values.payment),
          date: values.date,
        });
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, COLLECTION_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const paymentState = formikFieldState(formik, "payment");
  const dateState = formikFieldState(formik, "date");

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
      <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

      <CurrencyInput
        label="Payment Amount"
        name="payment"
        value={formik.values.payment}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={paymentState.touched}
        error={paymentState.error}
        placeholder="e.g. 500"
        step="0.01"
        required
        data-testid="collection-payment"
      />

      <DateInput
        label="Date"
        name="date"
        value={formik.values.date}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={dateState.touched}
        error={dateState.error}
        required
        data-testid="collection-date"
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
