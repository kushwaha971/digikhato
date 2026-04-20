"use client";

import { Drawer } from "@/components/ui/Drawer";
import { LoanCollectionForm } from "@/components/forms";
import { useCreateCollectionMutation } from "@/features/collections/collection-api";
import type { LoanCollectionFormValues } from "@/validation";

interface Props {
  readonly loanId: number;
  readonly borrowerId: number;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function CollectionDrawer({ loanId, borrowerId, open, onClose }: Props) {
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const handleSubmit = async (values: LoanCollectionFormValues) => {
    await createCollection({
      loan: loanId,
      borrower: borrowerId,
      amount_paid: values.amount_paid,
      payment_mode: values.payment_mode,
      reference_id: values.reference_id?.trim() || undefined,
      date: values.date,
      notes: values.notes?.trim() || "",
    }).unwrap();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Record Collection"
    >
      <LoanCollectionForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel={isLoading ? "Saving..." : "Save"}
        lockedLoanId={loanId}
        lockedBorrowerId={borrowerId}
      />
    </Drawer>
  );
}
