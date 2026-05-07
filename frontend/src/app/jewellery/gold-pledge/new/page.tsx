"use client";

import { useRouter } from "next/navigation";
import { Formik, Form, FieldArray, type FormikErrors, type FormikTouched } from "formik";
import * as Yup from "yup";

import { CustomerSearchSelect } from "@/components/jewellery/shared/CustomerSearchSelect";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { ROUTES } from "@/lib/routes";
import {
  useListLoanSchemesQuery,
  useListMetalsQuery,
  useListPuritiesQuery,
  useCreatePledgeLoanMutation,
} from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

interface PledgeItemFormValues {
  description: string;
  metal: string;
  purity: string;
  gross_wt: string;
  net_wt: string;
  stone_wt: string;
  valuation_rate: string;
}

interface NewLoanFormValues {
  customer: string;
  scheme: string;
  principal: string;
  tenure_months: string;
  loan_date: string;
  pledge_items: PledgeItemFormValues[];
}

const pledgeItemSchema = Yup.object({
  description: Yup.string(),
  metal: Yup.string().required("Metal is required"),
  purity: Yup.string().required("Purity is required"),
  gross_wt: Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Required"),
  net_wt: Yup.number().typeError("Must be a number").positive("Must be > 0").required("Required"),
  stone_wt: Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Required"),
  valuation_rate: Yup.number().typeError("Must be a number").positive("Must be > 0").required("Required"),
});

const validationSchema = Yup.object({
  customer: Yup.string().required("Customer is required"),
  scheme: Yup.string().required("Scheme is required"),
  principal: Yup.number().typeError("Must be a number").positive("Must be > 0").required("Principal is required"),
  tenure_months: Yup.number()
    .typeError("Must be a number")
    .min(1, "Minimum 1 month")
    .max(24, "Maximum 24 months")
    .integer("Must be a whole number")
    .required("Tenure is required"),
  loan_date: Yup.string().required("Loan date is required"),
  pledge_items: Yup.array(pledgeItemSchema).min(1, "At least one pledge item is required"),
});

const today = new Date().toISOString().slice(0, 10);

const emptyItem = (): PledgeItemFormValues => ({
  description: "",
  metal: "",
  purity: "",
  gross_wt: "",
  net_wt: "",
  stone_wt: "0",
  valuation_rate: "",
});

type ItemField = keyof PledgeItemFormValues;

function PledgeItemRow({
  index,
  values,
  errors,
  touched,
  setFieldValue,
  onRemove,
  canRemove,
}: Readonly<{
  index: number;
  values: PledgeItemFormValues;
  errors: Partial<Record<ItemField, string>>;
  touched: Partial<Record<ItemField, boolean>>;
  setFieldValue: (field: string, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}>) {
  const { data: metals } = useListMetalsQuery();
  const { data: purities } = useListPuritiesQuery(
    { metal: values.metal || undefined },
    { skip: !values.metal },
  );

  const netWt = Number.parseFloat(values.net_wt) || 0;
  const valuationRate = Number.parseFloat(values.valuation_rate) || 0;
  const valuationAmount = netWt * valuationRate;

  const prefix = `pledge_items.${index}`;

  function field(name: ItemField) {
    return `${prefix}.${name}`;
  }

  return (
    <div className="rounded-xl border border-border bg-surface2/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">Item {index + 1}</span>
        {canRemove && (
          <IconButton variant="danger" label="Remove pledge item" onClick={onRemove}>
            <TrashIcon />
          </IconButton>
        )}
      </div>

      <Input
        label="Description"
        value={values.description}
        onChange={(e) => setFieldValue(field("description"), e.target.value)}
        placeholder="e.g. Gold necklace"
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Metal"
          value={values.metal}
          onChange={(e) => {
            setFieldValue(field("metal"), e.target.value);
            setFieldValue(field("purity"), "");
          }}
          error={touched.metal ? errors.metal : undefined}
        >
          <option value="">Select metal</option>
          {(metals ?? []).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>

        <Select
          label="Purity"
          value={values.purity}
          onChange={(e) => setFieldValue(field("purity"), e.target.value)}
          disabled={!values.metal}
          error={touched.purity ? errors.purity : undefined}
        >
          <option value="">Select purity</option>
          {(purities ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.code} ({p.pct}%)</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Gross wt (g)"
          type="number"
          step="0.0001"
          value={values.gross_wt}
          onChange={(e) => setFieldValue(field("gross_wt"), e.target.value)}
          error={touched.gross_wt ? errors.gross_wt : undefined}
          placeholder="0.0000"
        />
        <Input
          label="Net wt (g)"
          type="number"
          step="0.0001"
          value={values.net_wt}
          onChange={(e) => setFieldValue(field("net_wt"), e.target.value)}
          error={touched.net_wt ? errors.net_wt : undefined}
          placeholder="0.0000"
        />
        <Input
          label="Stone wt (g)"
          type="number"
          step="0.0001"
          value={values.stone_wt}
          onChange={(e) => setFieldValue(field("stone_wt"), e.target.value)}
          error={touched.stone_wt ? errors.stone_wt : undefined}
          placeholder="0.0000"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <Input
          label="Valuation rate (₹/g)"
          type="number"
          step="0.01"
          value={values.valuation_rate}
          onChange={(e) => setFieldValue(field("valuation_rate"), e.target.value)}
          error={touched.valuation_rate ? errors.valuation_rate : undefined}
          placeholder="0.00"
        />
        <div className="pb-2.5">
          <p className="text-xs text-muted">Valuation amount</p>
          <p className="text-sm font-semibold text-text mt-0.5">{formatINRCurrency(valuationAmount)}</p>
        </div>
      </div>
    </div>
  );
}

// Extracted to avoid deep nesting inside Formik render prop
function PledgeItemsList({
  values,
  errors,
  touched,
  setFieldValue,
}: Readonly<{
  values: NewLoanFormValues;
  errors: FormikErrors<NewLoanFormValues>;
  touched: FormikTouched<NewLoanFormValues>;
  setFieldValue: (field: string, value: string) => void;
}>) {
  return (
    <FieldArray name="pledge_items">
      {({ push, remove }) => (
        <div className="space-y-3">
          {values.pledge_items.map((item, idx) => {
            const itemErrors = (Array.isArray(errors.pledge_items)
              ? errors.pledge_items[idx]
              : undefined) as Partial<Record<ItemField, string>> | undefined;
            const itemTouched = (Array.isArray(touched.pledge_items)
              ? touched.pledge_items[idx]
              : undefined) as Partial<Record<ItemField, boolean>> | undefined;

            return (
              <PledgeItemRow
                key={item.description + idx}
                index={idx}
                values={item}
                errors={itemErrors ?? {}}
                touched={itemTouched ?? {}}
                setFieldValue={setFieldValue}
                onRemove={() => remove(idx)}
                canRemove={values.pledge_items.length > 1}
              />
            );
          })}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => push(emptyItem())}
            leftIcon={<PlusIcon />}
          >
            Add item
          </Button>
        </div>
      )}
    </FieldArray>
  );
}

export default function NewGoldPledgePage() {
  const router = useRouter();
  const [createPledgeLoan, { isLoading }] = useCreatePledgeLoanMutation();

  const { data: schemes } = useListLoanSchemesQuery();

  const initialValues: NewLoanFormValues = {
    customer: "",
    scheme: "",
    principal: "",
    tenure_months: "12",
    loan_date: today,
    pledge_items: [emptyItem()],
  };

  const handleSubmit = async (values: NewLoanFormValues) => {
    const payload = {
      customer: values.customer,
      scheme: values.scheme,
      principal: values.principal,
      tenure_months: Number(values.tenure_months),
      loan_date: values.loan_date,
      pledge_items: values.pledge_items.map((item) => ({
        description: item.description,
        metal: item.metal,
        purity: item.purity,
        gross_wt: item.gross_wt,
        net_wt: item.net_wt,
        stone_wt: item.stone_wt,
        valuation_rate: item.valuation_rate,
      })),
    };
    const loan = await createPledgeLoan(payload).unwrap();
    router.push(`/jewellery/gold-pledge/${loan.id}`);
  };

  return (
    <Screen
      title="New Gold Pledge Loan"
      subtitle="Capture pledge items, choose a scheme, and disburse a loan"
      backHref={ROUTES.app.jewellery.pledge}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => {
          const selectedScheme = (schemes?.results ?? []).find((s) => s.id === values.scheme);

          const totalPledgeValue = values.pledge_items.reduce((sum, item) => {
            const net = Number.parseFloat(item.net_wt) || 0;
            const rate = Number.parseFloat(item.valuation_rate) || 0;
            return sum + net * rate;
          }, 0);

          const maxLoan = selectedScheme
            ? totalPledgeValue * (Number.parseFloat(selectedScheme.ltv_pct) / 100)
            : 0;

          const principalNum = Number.parseFloat(values.principal) || 0;
          const overLtv = selectedScheme && principalNum > maxLoan && maxLoan > 0;

          return (
            <Form className="space-y-6 max-w-2xl">
              {/* Section 1 — Customer */}
              <section className="app-panel rounded-2xl p-4 space-y-3">
                <h2 className="text-base font-semibold text-text">Customer</h2>
                <CustomerSearchSelect
                  value={values.customer}
                  onChange={(id) => setFieldValue("customer", id)}
                  label="Customer"
                  error={touched.customer && errors.customer ? String(errors.customer) : undefined}
                />
              </section>

              {/* Section 2 — Scheme */}
              <section className="app-panel rounded-2xl p-4 space-y-3">
                <h2 className="text-base font-semibold text-text">Loan Scheme</h2>
                <Select
                  label="Scheme"
                  name="scheme"
                  value={values.scheme}
                  onChange={(e) => setFieldValue("scheme", e.target.value)}
                  error={touched.scheme && typeof errors.scheme === "string" ? errors.scheme : undefined}
                  required
                >
                  <option value="">Select a scheme</option>
                  {(schemes?.results ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.interest_method} @ {s.interest_rate_pct}% — LTV {s.ltv_pct}%
                    </option>
                  ))}
                </Select>
                {selectedScheme && (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted">Interest method</p>
                      <p className="font-medium text-text">{selectedScheme.interest_method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Rate</p>
                      <p className="font-medium text-text">{selectedScheme.interest_rate_pct}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">LTV</p>
                      <p className="font-medium text-text">{selectedScheme.ltv_pct}%</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Section 3 — Loan Details */}
              <section className="app-panel rounded-2xl p-4 space-y-3">
                <h2 className="text-base font-semibold text-text">Loan Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Principal (₹)"
                    name="principal"
                    type="number"
                    step="0.01"
                    value={values.principal}
                    onChange={(e) => setFieldValue("principal", e.target.value)}
                    error={touched.principal && typeof errors.principal === "string" ? errors.principal : undefined}
                    placeholder="0.00"
                    required
                  />
                  <Input
                    label="Tenure (months)"
                    name="tenure_months"
                    type="number"
                    min={1}
                    max={24}
                    value={values.tenure_months}
                    onChange={(e) => setFieldValue("tenure_months", e.target.value)}
                    error={touched.tenure_months && typeof errors.tenure_months === "string" ? errors.tenure_months : undefined}
                    placeholder="1–24"
                    required
                  />
                </div>
                <DatePicker
                  label="Loan date"
                  name="loan_date"
                  value={values.loan_date}
                  onChange={(e) => setFieldValue("loan_date", e.target.value)}
                  touched={touched.loan_date}
                  error={typeof errors.loan_date === "string" ? errors.loan_date : undefined}
                  required
                />
              </section>

              {/* Section 4 — Pledge Items */}
              <section className="app-panel rounded-2xl p-4 space-y-3">
                <h2 className="text-base font-semibold text-text">Pledge Items</h2>
                {typeof errors.pledge_items === "string" && (
                  <p className="text-xs text-danger-600">{errors.pledge_items}</p>
                )}

                <PledgeItemsList
                  values={values}
                  errors={errors}
                  touched={touched}
                  setFieldValue={setFieldValue}
                />

                {/* LTV Preview */}
                {totalPledgeValue > 0 && (
                  <div className={`rounded-xl p-3 text-sm space-y-1 ${overLtv ? "bg-danger-50 border border-danger-200" : "bg-surface2"}`}>
                    <p className="font-semibold text-text">LTV Preview</p>
                    <div className="flex justify-between">
                      <span className="text-muted">Total pledge value</span>
                      <span className="font-medium text-text">{formatINRCurrency(totalPledgeValue)}</span>
                    </div>
                    {selectedScheme && (
                      <div className="flex justify-between">
                        <span className="text-muted">Max loan ({selectedScheme.ltv_pct}% LTV)</span>
                        <span className="font-medium text-text">{formatINRCurrency(maxLoan)}</span>
                      </div>
                    )}
                    {overLtv && (
                      <p className="text-danger-600 font-semibold mt-1">
                        Principal exceeds max loan amount by {formatINRCurrency(principalNum - maxLoan)}
                      </p>
                    )}
                  </div>
                )}
              </section>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(ROUTES.app.jewellery.pledge)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoading || isSubmitting}
                  disabled={isLoading || isSubmitting}
                >
                  Create Loan
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </Screen>
  );
}
