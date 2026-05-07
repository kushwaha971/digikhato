"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { PAYMENT_MODE_OPTIONS, loanStatusVariant } from "@/constants/jewellery";
import { ROUTES } from "@/lib/routes";
import {
  useGetPledgeLoanQuery,
  useGetPledgeLoanInterestQuery,
  useRepayPledgeLoanMutation,
} from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";
import type { JwlPledgeLoan } from "@/store/jewellery-api";

const today = new Date().toISOString().slice(0, 10);

function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

interface RepayFormValues {
  date: string;
  principal_paid: string;
  interest_paid: string;
  mode: string;
  reference: string;
  items_released: string[];
}

const repaySchema = Yup.object({
  date: Yup.string().required("Date is required"),
  principal_paid: Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Required"),
  interest_paid: Yup.number().typeError("Must be a number").min(0, "Cannot be negative").required("Required"),
  mode: Yup.string().required("Payment mode is required"),
  reference: Yup.string(),
  items_released: Yup.array(Yup.string()),
});

function InterestPreviewSection({ loanId, loanDate }: Readonly<{ loanId: string; loanDate: string }>) {
  const [days, setDays] = useState<number>(() => daysSince(loanDate));
  const [queryDays, setQueryDays] = useState<number>(() => daysSince(loanDate));

  const { data: preview, isFetching } = useGetPledgeLoanInterestQuery(
    { id: loanId, days: queryDays },
    { skip: queryDays <= 0 },
  );

  return (
    <section className="app-panel rounded-2xl p-4 space-y-3">
      <h2 className="text-base font-semibold text-text">Interest Preview</h2>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Days elapsed"
            type="number"
            min={1}
            value={String(days)}
            onChange={(e) => setDays(Number(e.target.value))}
            placeholder="Days"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setQueryDays(days)}
          loading={isFetching}
          className="mb-0.5"
        >
          Calculate
        </Button>
      </div>

      {preview && !isFetching && (
        <div className="rounded-xl bg-surface2 p-3 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted">Method</span>
            <span className="font-medium text-text">{preview.method}</span>
          </div>
          {preview.days !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted">Days</span>
              <span className="font-medium text-text">{preview.days}</span>
            </div>
          )}
          {preview.months !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted">Months</span>
              <span className="font-medium text-text">{preview.months}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Interest accrued</span>
            <span className="font-semibold text-text">{formatINRCurrency(preview.interest)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="font-semibold text-text">Total due</span>
            <span className="font-bold text-primary-600">{formatINRCurrency(preview.total_due)}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function RepaymentForm({ loan }: Readonly<{ loan: JwlPledgeLoan }>) {
  const [repayLoan, { isLoading }] = useRepayPledgeLoanMutation();
  const { refetch } = useGetPledgeLoanQuery(loan.id);

  const unreleasedItems = loan.pledge_items.filter((item) => !item.is_released);

  const initialValues: RepayFormValues = {
    date: today,
    principal_paid: "",
    interest_paid: "",
    mode: "CASH",
    reference: "",
    items_released: [],
  };

  const handleSubmit = async (values: RepayFormValues, { resetForm }: { resetForm: () => void }) => {
    await repayLoan({
      id: loan.id,
      date: values.date,
      principal_paid: values.principal_paid,
      interest_paid: values.interest_paid,
      mode: values.mode,
      reference: values.reference || undefined,
      items_released: values.items_released,
    }).unwrap();
    resetForm();
    await refetch();
  };

  return (
    <section className="app-panel rounded-2xl p-4 space-y-3">
      <h2 className="text-base font-semibold text-text">Record Repayment</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={repaySchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form className="space-y-3">
            <DatePicker
              label="Payment date"
              name="date"
              value={values.date}
              onChange={(e) => setFieldValue("date", e.target.value)}
              touched={touched.date}
              error={typeof errors.date === "string" ? errors.date : undefined}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Principal paid (₹)"
                type="number"
                step="0.01"
                value={values.principal_paid}
                onChange={(e) => setFieldValue("principal_paid", e.target.value)}
                error={touched.principal_paid && typeof errors.principal_paid === "string" ? errors.principal_paid : undefined}
                placeholder="0.00"
                required
              />
              <Input
                label="Interest paid (₹)"
                type="number"
                step="0.01"
                value={values.interest_paid}
                onChange={(e) => setFieldValue("interest_paid", e.target.value)}
                error={touched.interest_paid && typeof errors.interest_paid === "string" ? errors.interest_paid : undefined}
                placeholder="0.00"
                required
              />
            </div>

            <Select
              label="Payment mode"
              value={values.mode}
              onChange={(e) => setFieldValue("mode", e.target.value)}
              error={touched.mode && typeof errors.mode === "string" ? errors.mode : undefined}
              required
            >
              {PAYMENT_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            <Input
              label="Reference (optional)"
              value={values.reference}
              onChange={(e) => setFieldValue("reference", e.target.value)}
              placeholder="Transaction ID, cheque no., etc."
            />

            {unreleasedItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text mb-2">Release pledge items</p>
                <div className="space-y-2">
                  {unreleasedItems.map((item) => {
                    const checked = values.items_released.includes(String(item.id));
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 cursor-pointer text-sm text-text"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? values.items_released.filter((id) => id !== String(item.id))
                              : [...values.items_released, String(item.id)];
                            void setFieldValue("items_released", next);
                          }}
                          className="rounded border-border accent-primary-500"
                        />
                        <span>
                          {item.description || `Item ${item.line_no}`}
                          {" "}— {item.net_wt}g @ {formatINRCurrency(item.valuation_rate)}/g
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={isLoading || isSubmitting}
                disabled={isLoading || isSubmitting}
              >
                Record repayment
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </section>
  );
}

export default function PledgeLoanDetailPage() {
  const params = useParams<{ id: string }>();
  const loanId = String(params.id);
  const { data: loan, isLoading } = useGetPledgeLoanQuery(loanId);

  if (isLoading || !loan) {
    return (
      <Screen title="Loan detail" subtitle="Loading..." backHref={ROUTES.app.jewellery.pledge}>
        {null}
      </Screen>
    );
  }

  return (
    <Screen
      title={loan.loan_no}
      subtitle={`${loan.scheme_name} · ${loan.interest_method} @ ${loan.interest_rate_pct}%`}
      backHref={ROUTES.app.jewellery.pledge}
      actions={(
        <Badge variant={loanStatusVariant(loan.status)}>
          {loan.status}
        </Badge>
      )}
    >
      <div className="space-y-4 max-w-2xl">
        {/* Header summary */}
        <section className="app-panel rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted">Customer</p>
            <p className="font-semibold text-text mt-0.5">{loan.customer_name}</p>
          </div>
          <div>
            <p className="text-muted">Loan date</p>
            <p className="font-semibold text-text mt-0.5">{loan.loan_date}</p>
          </div>
          <div>
            <p className="text-muted">Maturity date</p>
            <p className="font-semibold text-text mt-0.5">{loan.maturity_date ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted">Tenure</p>
            <p className="font-semibold text-text mt-0.5">{loan.tenure_months} months</p>
          </div>
        </section>

        {/* Loan summary card */}
        <section className="app-panel rounded-2xl p-4 space-y-3">
          <h2 className="text-base font-semibold text-text">Loan Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted">Principal</p>
              <p className="font-bold text-text mt-0.5">{formatINRCurrency(loan.principal)}</p>
            </div>
            <div>
              <p className="text-muted">Interest method</p>
              <p className="font-semibold text-text mt-0.5">{loan.interest_method}</p>
            </div>
            <div>
              <p className="text-muted">Interest rate</p>
              <p className="font-semibold text-text mt-0.5">{loan.interest_rate_pct}%</p>
            </div>
            <div>
              <p className="text-muted">LTV</p>
              <p className="font-semibold text-text mt-0.5">{loan.ltv_pct}%</p>
            </div>
          </div>
        </section>

        {/* Pledge Items table */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Pledge Items</h2>
          </header>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface2 text-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Description</th>
                  <th className="px-4 py-2 text-left font-semibold">Metal / Purity</th>
                  <th className="px-4 py-2 text-left font-semibold">Gross wt</th>
                  <th className="px-4 py-2 text-left font-semibold">Net wt</th>
                  <th className="px-4 py-2 text-left font-semibold">Rate</th>
                  <th className="px-4 py-2 text-left font-semibold">Value</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.pledge_items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-2">{item.description || "—"}</td>
                    <td className="px-4 py-2">{item.metal} / {item.purity}</td>
                    <td className="px-4 py-2">{item.gross_wt}g</td>
                    <td className="px-4 py-2">{item.net_wt}g</td>
                    <td className="px-4 py-2">{formatINRCurrency(item.valuation_rate)}/g</td>
                    <td className="px-4 py-2 font-semibold">{formatINRCurrency(item.valuation_amount)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={item.is_released ? "neutral" : "success"}>
                        {item.is_released ? "Released" : "Pledged"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden p-4 space-y-3">
            {loan.pledge_items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface2/40 p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-text">{item.description || `Item ${item.line_no}`}</p>
                  <Badge variant={item.is_released ? "neutral" : "success"}>
                    {item.is_released ? "Released" : "Pledged"}
                  </Badge>
                </div>
                <p className="text-xs text-muted">{item.metal} / {item.purity}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <p className="text-muted">Gross wt</p>
                    <p className="font-semibold text-text">{item.gross_wt}g</p>
                  </div>
                  <div>
                    <p className="text-muted">Net wt</p>
                    <p className="font-semibold text-text">{item.net_wt}g</p>
                  </div>
                  <div>
                    <p className="text-muted">Rate</p>
                    <p className="font-semibold text-text">{formatINRCurrency(item.valuation_rate)}/g</p>
                  </div>
                  <div>
                    <p className="text-muted">Value</p>
                    <p className="font-semibold text-text">{formatINRCurrency(item.valuation_amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interest Preview */}
        <InterestPreviewSection loanId={loan.id} loanDate={loan.loan_date} />

        {/* Repayment form — active loans only */}
        {loan.status === "ACTIVE" && <RepaymentForm loan={loan} />}
      </div>
    </Screen>
  );
}
