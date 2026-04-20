"use client";

import { useParams, useRouter } from "next/navigation";

import { BorrowerForm } from "@/components/forms";
import { Screen } from "@/components/layout/Screen";
import {
  useGetBorrowerQuery,
  useUpdateBorrowerMutation,
} from "@/features/borrowers/borrower-api";
import type { BorrowerFormValues } from "@/validation";

export default function EditBorrowerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { data } = useGetBorrowerQuery(id, { skip: !id });
  const [updateBorrower] = useUpdateBorrowerMutation();

  const onSubmit = async (values: BorrowerFormValues) => {
    await updateBorrower({ id, data: values }).unwrap();
    router.push(`/borrowers/${id}`);
  };

  return (
    <Screen title="Edit Borrower" backHref={`/borrowers/${id}`}>
      <BorrowerForm
        onSubmit={onSubmit}
        submitLabel="Update Borrower"
        defaultValues={{
          name: data?.name ?? "",
          mobile_number: data?.mobile_number ?? "",
          address: data?.address ?? "",
        }}
      />
    </Screen>
  );
}
