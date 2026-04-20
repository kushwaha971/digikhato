"use client";

import { useFormik } from "formik";

import {
  FormErrorBanner,
  NumberInput,
  TextArea,
  formikFieldState,
} from "@/components/forms/system";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import {
  focusFirstInvalidField,
  loanValidationSchema,
  mapBackendErrorsToFormik,
  type LoanFormValues,
} from "@/validation";

type LoanFormProps = Readonly<{
  onSubmit: (data: LoanFormValues) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<LoanFormValues>;
  submitLabel?: string;
  lockedBorrowerId?: number;
}>;

const LOAN_FIELDS: Array<keyof LoanFormValues> = [
  "borrower",
  "principal",
  "interest_rate",
  "interest_type",
  "tenure_days",
  "start_date",
  "notes",
];

export function LoanForm({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = "Save Loan",
  lockedBorrowerId,
}: LoanFormProps) {
  const formik = useFormik<LoanFormValues>({
    enableReinitialize: true,
    initialValues: {
      borrower: lockedBorrowerId ?? defaultValues?.borrower ?? 0,
      principal: defaultValues?.principal ?? 0,
      interest_rate: defaultValues?.interest_rate ?? null,
      interest_type: "flat",
      tenure_days: defaultValues?.tenure_days ?? null,
      start_date: defaultValues?.start_date ?? new Date().toISOString().slice(0, 10),
      notes: defaultValues?.notes ?? "",
    },
    validationSchema: loanValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await onSubmit({
          ...values,
          borrower: lockedBorrowerId ?? Number(values.borrower),
          principal: Number(values.principal),
          interest_rate: values.interest_rate !== null && values.interest_rate !== undefined
            ? Number(values.interest_rate)
            : null,
          tenure_days: values.tenure_days !== null && values.tenure_days !== undefined
            ? Number(values.tenure_days)
            : null,
        });
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, LOAN_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const borrowerState = formikFieldState(formik, "borrower");
  const principalState = formikFieldState(formik, "principal");
  const rateState = formikFieldState(formik, "interest_rate");
  const tenureState = formikFieldState(formik, "tenure_days");
  const dateState = formikFieldState(formik, "start_date");
  const notesState = formikFieldState(formik, "notes");

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
      <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

      {lockedBorrowerId ? (
        <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-semibold text-text">
          Borrower ID: {lockedBorrowerId}
        </div>
      ) : (
        <NumberInput
          label="Borrower ID"
          name="borrower"
          value={formik.values.borrower}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          touched={borrowerState.touched}
          error={borrowerState.error}
          placeholder="Borrower ID"
          required
          data-testid="loan-borrower-id"
        />
      )}

      <NumberInput
        label="Principal Amount"
        name="principal"
        value={formik.values.principal}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={principalState.touched}
        error={principalState.error}
        placeholder="Principal amount"
        step="0.01"
        required
        data-testid="loan-principal"
      />

      <NumberInput
        label="Interest Rate (%) — optional"
        name="interest_rate"
        value={formik.values.interest_rate ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={rateState.touched}
        error={rateState.error}
        placeholder="Daily interest rate"
        step="0.01"
        helperText="Leave blank for 0% (no interest)"
        data-testid="loan-interest-rate"
      />

      <NumberInput
        label="Tenure Days — optional"
        name="tenure_days"
        value={formik.values.tenure_days ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={tenureState.touched}
        error={tenureState.error}
        placeholder="Tenure in days"
        helperText="Leave blank for open-ended loan"
        data-testid="loan-tenure-days"
      />

      <DatePicker
        label="Start Date"
        name="start_date"
        value={formik.values.start_date}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={dateState.touched}
        error={dateState.error}
        required
        data-testid="loan-start-date"
      />

      <TextArea
        label="Notes (optional)"
        name="notes"
        value={formik.values.notes}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={notesState.touched}
        error={notesState.error}
        placeholder="Any remarks about this loan…"
        rows={3}
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
