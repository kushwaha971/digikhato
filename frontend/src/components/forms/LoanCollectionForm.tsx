"use client";

import { useFormik } from "formik";

import {
  CurrencyInput,
  FormErrorBanner,
  NumberInput,
  SelectInput,
  TextArea,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import {
  PAYMENT_MODE_OPTIONS,
  focusFirstInvalidField,
  loanCollectionInitialValues,
  loanCollectionValidationSchema,
  mapBackendErrorsToFormik,
  type LoanCollectionFormValues,
} from "@/validation";

type LoanCollectionFormProps = Readonly<{
  onSubmit: (data: LoanCollectionFormValues) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<LoanCollectionFormValues>;
  submitLabel?: string;
  lockedLoanId?: number;
  lockedBorrowerId?: number;
}>;

const COLLECTION_FIELDS: Array<keyof LoanCollectionFormValues> = [
  "loan",
  "borrower",
  "amount_paid",
  "payment_mode",
  "reference_id",
  "date",
  "notes",
];

export function LoanCollectionForm({
  onSubmit,
  onCancel,
  defaultValues,
  submitLabel = "Save Collection",
  lockedLoanId,
  lockedBorrowerId,
}: LoanCollectionFormProps) {
  const formik = useFormik<LoanCollectionFormValues>({
    enableReinitialize: true,
    initialValues: {
      loan: lockedLoanId ?? defaultValues?.loan ?? loanCollectionInitialValues.loan,
      borrower: lockedBorrowerId ?? defaultValues?.borrower ?? loanCollectionInitialValues.borrower,
      amount_paid: defaultValues?.amount_paid ?? loanCollectionInitialValues.amount_paid,
      payment_mode: defaultValues?.payment_mode ?? loanCollectionInitialValues.payment_mode,
      reference_id: defaultValues?.reference_id ?? loanCollectionInitialValues.reference_id,
      date: defaultValues?.date ?? loanCollectionInitialValues.date,
      notes: defaultValues?.notes ?? loanCollectionInitialValues.notes,
    },
    validationSchema: loanCollectionValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await onSubmit({
          ...values,
          loan: lockedLoanId ?? Number(values.loan),
          borrower: lockedBorrowerId ?? Number(values.borrower),
          amount_paid: Number(values.amount_paid),
          notes: values.notes?.trim() || "",
        });
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, COLLECTION_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const loanState = formikFieldState(formik, "loan");
  const borrowerState = formikFieldState(formik, "borrower");
  const amountState = formikFieldState(formik, "amount_paid");
  const paymentModeState = formikFieldState(formik, "payment_mode");
  const referenceIdState = formikFieldState(formik, "reference_id");
  const dateState = formikFieldState(formik, "date");
  const notesState = formikFieldState(formik, "notes");

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
      <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

      {!lockedLoanId ? (
        <NumberInput
          label="Loan ID"
          name="loan"
          value={formik.values.loan}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          touched={loanState.touched}
          error={loanState.error}
          placeholder="Loan ID"
          required
        />
      ) : null}

      {!lockedBorrowerId ? (
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
        />
      ) : null}

      <CurrencyInput
        label="Collection Amount"
        name="amount_paid"
        value={formik.values.amount_paid}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={amountState.touched}
        error={amountState.error}
        placeholder="e.g. 500"
        step="0.01"
        helperText="Default starts at 0. Enter an amount greater than 0 to submit."
        required
      />

      <SelectInput
        label="Payment Mode"
        name="payment_mode"
        value={formik.values.payment_mode}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={paymentModeState.touched}
        error={paymentModeState.error}
        required
      >
        {PAYMENT_MODE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </SelectInput>

      <TextInput
        label="Reference / Transaction ID (optional)"
        name="reference_id"
        value={formik.values.reference_id ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={referenceIdState.touched}
        error={referenceIdState.error}
        placeholder="e.g. UPI ref number"
      />

      <DatePicker
        label="Collection Date"
        name="date"
        value={formik.values.date}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={dateState.touched}
        error={dateState.error}
        required
      />

      <TextArea
        label="Notes (optional)"
        name="notes"
        value={formik.values.notes ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={notesState.touched}
        error={notesState.error}
        placeholder="Any note for this collection entry…"
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
