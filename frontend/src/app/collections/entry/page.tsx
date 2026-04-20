"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";

import { CollectionEntryForm } from "@/components/business/CollectionEntryForm";
import { NumberInput, formikFieldState } from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCreateCollectionMutation } from "@/features/collections/collection-api";
import type { LoanCollectionFormValues } from "@/validation";

export default function CollectionEntryPage() {
  const router = useRouter();
  const [createCollection] = useCreateCollectionMutation();
  const [context, setContext] = useState<{ loan: number; borrower: number } | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const loan = Number(search.get("loan") || "");
    const borrower = Number(search.get("borrower") || "");
    if (Number.isFinite(loan) && loan > 0 && Number.isFinite(borrower) && borrower > 0) {
      setContext({ loan, borrower });
    }
  }, []);

  const onSubmit = async (values: LoanCollectionFormValues) => {
    await createCollection({
      loan: values.loan,
      borrower: values.borrower,
      amount_paid: values.amount_paid,
      payment_mode: values.payment_mode,
      reference_id: values.reference_id?.trim() || undefined,
      date: values.date,
      notes: values.notes?.trim() || "",
    }).unwrap();
    router.push("/collections");
  };

  const mappingForm = useFormik<{ loan: number; borrower: number }>({
    initialValues: { loan: 0, borrower: 0 },
    validate: (values) => {
      const errors: Partial<Record<"loan" | "borrower", string>> = {};
      const loanId = Number(values.loan);
      const borrowerId = Number(values.borrower);
      if (!Number.isFinite(loanId) || loanId <= 0) errors.loan = "Loan ID is required";
      if (!Number.isFinite(borrowerId) || borrowerId <= 0) errors.borrower = "Borrower ID is required";
      return errors;
    },
    onSubmit: async (values) => {
      setContext({ loan: Number(values.loan), borrower: Number(values.borrower) });
    },
  });
  const loanState = formikFieldState(mappingForm, "loan");
  const borrowerState = formikFieldState(mappingForm, "borrower");

  return (
    <Screen title="Collection Entry" backHref="/collections">
      {!context ? (
        <div className="max-w-md mx-auto space-y-4">
          <div className="app-panel p-4">
            <p className="text-sm text-text font-semibold mb-1">Map collection to a valid context</p>
            <p className="text-xs text-muted mb-4">
              To avoid ambiguous entries, every collection must be linked to a specific borrower and loan.
            </p>

            <form className="space-y-3" onSubmit={mappingForm.handleSubmit} noValidate>
              <NumberInput
                label="Loan ID"
                name="loan"
                value={mappingForm.values.loan}
                onChange={mappingForm.handleChange}
                onBlur={mappingForm.handleBlur}
                touched={loanState.touched}
                error={loanState.error}
                required
              />
              <NumberInput
                label="Borrower ID"
                name="borrower"
                value={mappingForm.values.borrower}
                onChange={mappingForm.handleChange}
                onBlur={mappingForm.handleBlur}
                touched={borrowerState.touched}
                error={borrowerState.error}
                required
              />
              <Button type="submit" fullWidth>
                Continue
              </Button>
            </form>
          </div>

          <EmptyState
            title="Recommended flow"
            description="Start collection from Today Due list or from a borrower’s loan card for pre-mapped context."
            action={{
              label: "Open Today Due List",
              onClick: () => router.push("/collections/today"),
            }}
          />
        </div>
      ) : (
        <>
          <div className="app-panel p-3 mb-4">
            <p className="text-sm text-text">
              Recording collection for Loan <span className="font-semibold">{context.loan}</span> · Borrower{" "}
              <span className="font-semibold">{context.borrower}</span>
            </p>
            <Link href="/collections/today" className="text-xs text-primary-500 font-semibold hover:text-primary-600">
              Change context from due list
            </Link>
          </div>
          <CollectionEntryForm
            loanId={context.loan}
            borrowerId={context.borrower}
            defaultValues={{ loan: context.loan, borrower: context.borrower }}
            onSubmit={onSubmit}
          />
        </>
      )}
    </Screen>
  );
}
