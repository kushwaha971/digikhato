"use client";

import { useParams, useRouter } from "next/navigation";

import { CollectionEntryForm } from "@/components/business/CollectionEntryForm";
import { Screen } from "@/components/layout/Screen";
import {
  useGetCollectionQuery,
  useUpdateCollectionMutation,
} from "@/features/collections/collection-api";
import type { LoanCollectionFormValues } from "@/validation";

export default function EditCollectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const uuid = params.id;
  const { data: collection, isLoading } = useGetCollectionQuery(uuid, { skip: !uuid });
  const [updateCollection] = useUpdateCollectionMutation();

  const onSubmit = async (values: LoanCollectionFormValues) => {
    await updateCollection({
      id: uuid,
      data: {
        loan: values.loan,
        borrower: values.borrower,
        amount_paid: values.amount_paid,
        payment_mode: values.payment_mode,
        reference_id: values.reference_id?.trim() || undefined,
        date: values.date,
        notes: values.notes?.trim() || "",
      },
    }).unwrap();
    router.push("/collections");
  };

  return (
    <Screen title="Edit Collection" backHref="/collections">
      {collection ? (
        <CollectionEntryForm
          loanId={collection.loan}
          borrowerId={collection.borrower}
          defaultValues={{
            loan: collection.loan,
            borrower: collection.borrower,
            amount_paid: Number(collection.amount_paid ?? 0),
            payment_mode: collection.payment_mode ?? "cash",
            reference_id: collection.reference_id ?? "",
            date: collection.date,
            notes: collection.notes ?? "",
          }}
          onSubmit={onSubmit}
        />
      ) : (
        <p className="text-muted text-sm">{isLoading ? "Loading..." : "Collection not found."}</p>
      )}
    </Screen>
  );
}
