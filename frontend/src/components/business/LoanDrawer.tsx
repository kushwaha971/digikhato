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
import { Drawer } from "@/components/ui/Drawer";
import { useCreateLoanMutation } from "@/features/loans/loan-api";
import {
  focusFirstInvalidField,
  loanValidationSchema,
  mapBackendErrorsToFormik,
  type LoanFormValues,
} from "@/validation";

interface Props {
  readonly borrowerId: number;
  readonly open: boolean;
  readonly onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const LOAN_FIELDS: Array<keyof LoanFormValues> = ["principal", "interest_rate", "tenure_days", "start_date", "notes"];

const defaultValues = (borrowerId: number): LoanFormValues => ({
  borrower: borrowerId,
  principal: 0,
  interest_rate: null,
  interest_type: "flat",
  tenure_days: null,
  start_date: today(),
  notes: "",
});

export function LoanDrawer({ borrowerId, open, onClose }: Props) {
  const [createLoan, { isLoading }] = useCreateLoanMutation();

  const formik = useFormik<LoanFormValues>({
    enableReinitialize: true,
    initialValues: defaultValues(borrowerId),
    validationSchema: loanValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await createLoan({
          borrower: borrowerId,
          principal: Number(values.principal),
          ...(values.interest_rate !== null && values.interest_rate !== undefined
            ? { interest_rate: Number(values.interest_rate) }
            : { interest_rate: 0 }),
          interest_type: "flat",
          ...(values.tenure_days !== null && values.tenure_days !== undefined
            ? { tenure_days: Number(values.tenure_days) }
            : {}),
          start_date: values.start_date,
          ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
        }).unwrap();
        helpers.resetForm({ values: defaultValues(borrowerId) });
        onClose();
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, LOAN_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const principalState = formikFieldState(formik, "principal");
  const rateState = formikFieldState(formik, "interest_rate");
  const tenureState = formikFieldState(formik, "tenure_days");
  const dateState = formikFieldState(formik, "start_date");
  const notesState = formikFieldState(formik, "notes");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add New Loan"
      footer={
        <>
          <Button variant="secondary" size="sm" fullWidth={false} onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            size="sm"
            fullWidth={false}
            loading={formik.isSubmitting || isLoading}
            disabled={formik.isSubmitting || isLoading}
            type="submit"
            form="loan-drawer-form"
          >
            Create Loan
          </Button>
        </>
      }
    >
      <form id="loan-drawer-form" className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
        <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

        <NumberInput
          label="Loan Amount (₹)"
          name="principal"
          value={formik.values.principal}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          touched={principalState.touched}
          error={principalState.error}
          placeholder="e.g. 10000"
          required
        />

        <NumberInput
          label="Daily Interest Rate (%) — optional"
          name="interest_rate"
          value={formik.values.interest_rate ?? ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          touched={rateState.touched}
          error={rateState.error}
          placeholder="e.g. 1.5"
          step="0.1"
          helperText="Leave blank for 0% (no interest)"
        />

        <NumberInput
          label="Duration (days) — optional"
          name="tenure_days"
          value={formik.values.tenure_days ?? ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          touched={tenureState.touched}
          error={tenureState.error}
          placeholder="e.g. 30"
          helperText="Leave blank for open-ended loan"
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
      </form>
    </Drawer>
  );
}
