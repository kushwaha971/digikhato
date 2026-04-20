"use client";

import { useParams, useRouter } from "next/navigation";

import { LoanForm } from "@/components/forms";
import { Screen } from "@/components/layout/Screen";
import { useGetLoanQuery, useUpdateLoanMutation } from "@/features/loans/loan-api";
import type { LoanFormValues } from "@/validation";

export default function EditLoanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { data: loan } = useGetLoanQuery(id, { skip: !id });
  const [updateLoan] = useUpdateLoanMutation();

  const onSubmit = async (values: LoanFormValues) => {
    await updateLoan({ id, data: values }).unwrap();
    router.push(`/loans/${id}`);
  };

  return (
    <Screen title="Edit Loan" backHref={`/loans/${id}`}>
      <LoanForm
        onSubmit={onSubmit}
        submitLabel="Update Loan"
        defaultValues={{
          borrower: Number(loan?.borrower ?? 0),
          principal: Number(loan?.principal ?? 0),
          interest_rate:
            loan?.interest_rate === null || loan?.interest_rate === undefined
              ? null
              : Number(loan.interest_rate),
          interest_type: "flat",
          tenure_days: loan?.tenure_days ?? null,
          start_date: loan?.start_date ?? new Date().toISOString().slice(0, 10),
          notes: loan?.notes ?? "",
        }}
      />
    </Screen>
  );
}
