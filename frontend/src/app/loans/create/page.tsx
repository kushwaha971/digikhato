"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoanForm } from "@/components/forms";
import { Screen } from "@/components/layout/Screen";
import { useCreateLoanMutation } from "@/features/loans/loan-api";
import type { LoanFormValues } from "@/validation";

export default function CreateLoanPage() {
  const router = useRouter();
  const [lockedBorrowerId, setLockedBorrowerId] = useState<number | undefined>(undefined);
  const [createLoan] = useCreateLoanMutation();

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const borrower = Number(search.get("borrower") || "");
    if (Number.isFinite(borrower) && borrower > 0) {
      setLockedBorrowerId(borrower);
    }
  }, []);

  const onSubmit = async (values: LoanFormValues) => {
    const loan = await createLoan(values).unwrap();
    router.push(`/loans/${loan.id}`);
  };

  return (
    <Screen
      title="Create Loan"
      backHref={lockedBorrowerId ? `/borrowers/${lockedBorrowerId}` : "/loans"}
    >
      <LoanForm
        onSubmit={onSubmit}
        lockedBorrowerId={lockedBorrowerId}
        submitLabel="Create Loan"
      />
    </Screen>
  );
}
