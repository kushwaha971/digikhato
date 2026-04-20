"use client";

import { useParams, useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AccountDetailPage() {
  const params = useParams<{ id: string; aid: string }>();
  const router = useRouter();
  const { id: borrowerId, aid: accountId } = params;

  const collectHref = `/borrowers/${borrowerId}/accounts/${accountId}/collect`;

  return (
    <Screen
      title={`Account ${accountId}`}
      backHref={`/borrowers/${borrowerId}`}
      breadcrumb={[
        { label: "Borrowers", href: "/borrowers" },
        { label: "Borrower", href: `/borrowers/${borrowerId}` },
        { label: `Account ${accountId}` },
      ]}
      actions={
        <Button size="sm" fullWidth={false} onClick={() => router.push(collectHref)}>
          + Add Collection
        </Button>
      }
    >
      {/* Account summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="app-panel p-4 text-center">
          <p className="text-xs text-muted mb-1">Amount Given</p>
          <p className="text-xl font-bold text-text">₹—</p>
        </div>
        <div className="app-panel p-4 text-center">
          <p className="text-xs text-muted mb-1">Amount Paid</p>
          <p className="text-xl font-bold text-success-600">₹—</p>
        </div>
        <div className="app-panel p-4 text-center">
          <p className="text-xs text-muted mb-1">Outstanding</p>
          <p className="text-xl font-bold text-warning-600">₹—</p>
        </div>
      </div>

      {/* Collection history */}
      <div className="app-panel overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-text">Collection History</h2>
        </div>
        <EmptyState
          title="No collections yet"
          description="Add the first daily collection to get started."
          action={{ label: "Add Collection", onClick: () => router.push(collectHref) }}
        />
      </div>
    </Screen>
  );
}
