"use client";

import { useFormik } from "formik";

import {
  CurrencyInput,
  FormErrorBanner,
  NumberInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import {
  accountValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  type AccountFormValues,
} from "@/validation";

type AccountFormProps = Readonly<{
  borrowerId: number;
  onSubmit: (data: AccountFormValues) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<AccountFormValues>;
  submitLabel?: string;
}>;

const ACCOUNT_FIELDS: Array<keyof AccountFormValues> = [
  "borrower",
  "amount_given",
  "daily_interest_rate",
  "duration_days",
];

export function AccountForm({
  borrowerId,
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = "Create Account",
}: AccountFormProps) {
  const formik = useFormik<AccountFormValues>({
    enableReinitialize: true,
    initialValues: {
      borrower: borrowerId,
      amount_given: defaultValues?.amount_given ?? 0,
      daily_interest_rate: defaultValues?.daily_interest_rate ?? 0,
      duration_days: defaultValues?.duration_days,
    },
    validationSchema: accountValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const durationRaw = values.duration_days;
        await onSubmit({
          ...values,
          borrower: borrowerId,
          amount_given: Number(values.amount_given),
          daily_interest_rate: Number(values.daily_interest_rate),
          duration_days:
            durationRaw === undefined || durationRaw === null || String(durationRaw).trim() === ""
              ? undefined
              : Number(durationRaw),
        });
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, ACCOUNT_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const amountState = formikFieldState(formik, "amount_given");
  const rateState = formikFieldState(formik, "daily_interest_rate");
  const durationState = formikFieldState(formik, "duration_days");

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
      <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

      <CurrencyInput
        label="Amount Given"
        name="amount_given"
        value={formik.values.amount_given}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={amountState.touched}
        error={amountState.error}
        placeholder="e.g. 10000"
        required
        data-testid="account-amount-given"
      />

      <NumberInput
        label="Daily Interest Rate (%)"
        name="daily_interest_rate"
        value={formik.values.daily_interest_rate}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={rateState.touched}
        error={rateState.error}
        placeholder="e.g. 1.00"
        helperText="Interest rate applied per day"
        step="0.01"
        required
        data-testid="account-interest-rate"
      />

      <NumberInput
        label="Duration (days)"
        name="duration_days"
        value={formik.values.duration_days ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={durationState.touched}
        error={durationState.error}
        placeholder="e.g. 100 (optional)"
        helperText="Leave blank for open-ended accounts"
        data-testid="account-duration-days"
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
