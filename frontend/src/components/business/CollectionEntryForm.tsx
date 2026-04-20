"use client";

import { LoanCollectionForm } from "@/components/forms";
import type { LoanCollectionFormValues } from "@/validation";

type Props = Readonly<{
  loanId: number;
  borrowerId: number;
  defaultValues?: Partial<LoanCollectionFormValues>;
  onSubmit: (values: LoanCollectionFormValues) => Promise<void>;
}>;

export function CollectionEntryForm({
  loanId,
  borrowerId,
  defaultValues,
  onSubmit,
}: Props) {
  return (
    <LoanCollectionForm
      onSubmit={onSubmit}
      defaultValues={defaultValues}
      lockedLoanId={loanId}
      lockedBorrowerId={borrowerId}
      submitLabel="Save Collection"
    />
  );
}
