"use client";

import { useRouter } from "next/navigation";

import { BorrowerForm } from "@/components/forms";
import { Screen } from "@/components/layout/Screen";
import { useAddBorrowerMutation } from "@/features/borrowers/borrower-api";
import type { BorrowerFormValues } from "@/validation";

export default function AddBorrowerPage() {
  const router = useRouter();
  const [addBorrower] = useAddBorrowerMutation();

  const onSubmit = async (values: BorrowerFormValues) => {
    const borrower = await addBorrower(values).unwrap();
    router.push(`/borrowers/${borrower.uuid}`);
  };

  return (
    <Screen title="Add Borrower" backHref="/borrowers">
      <BorrowerForm onSubmit={onSubmit} submitLabel="Create Borrower" />
      <p className="mt-3 text-xs text-muted">
        A login account is automatically created using the borrower&apos;s mobile number.
        They will be asked to set their password on first login.
      </p>
    </Screen>
  );
}
