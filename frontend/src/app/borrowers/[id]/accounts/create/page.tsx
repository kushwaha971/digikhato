"use client";

import { useParams, useRouter } from "next/navigation";

import { AccountForm } from "@/components/forms";
import { Screen } from "@/components/layout/Screen";
import { useCreateAccountMutation } from "@/features/accounts/account-api";
import type { AccountFormValues } from "@/validation";

export default function CreateAccountPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const borrowerId = Number(params.id);
  const [createAccount] = useCreateAccountMutation();

  const handleSubmit = async (values: AccountFormValues) => {
    const account = await createAccount(values).unwrap();
    router.push(`/borrowers/${borrowerId}/accounts/${account.id}`);
  };

  return (
    <Screen
      title="Create Account"
      backHref={`/borrowers/${borrowerId}`}
      breadcrumb={[
        { label: "Borrowers", href: "/borrowers" },
        { label: "Borrower", href: `/borrowers/${borrowerId}` },
        { label: "Create Account" },
      ]}
    >
      <div className="max-w-lg mx-auto">
        <div className="app-panel p-6 space-y-4">
          <p className="text-sm text-muted">Create a new loan account for this borrower.</p>
          <AccountForm
            borrowerId={borrowerId}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            submitLabel="Create Account"
          />
        </div>
      </div>
    </Screen>
  );
}
