"use client";

import { useParams } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetAccountQuery, useGetDailyCollectionsQuery } from "@/features/accounts/account-api";
import { formatDateDMY } from "@/lib/format";

function fmt(val: string | number | undefined) {
  if (val === undefined || val === null) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

export default function PortalAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const accountRef = params.id;

  const { data: account, isLoading: accountLoading } = useGetAccountQuery(accountRef, { skip: !accountRef });
  const { data: collectionsData, isLoading: collectionsLoading } = useGetDailyCollectionsQuery({
    account: accountRef,
  }, { skip: !accountRef });

  const collections = collectionsData?.results ?? [];

  return (
    <Screen
      title={account ? `Account ${account.uuid?.slice(0, 8) ?? account.id}` : "Account"}
      backHref="/portal"
      breadcrumb={[
        { label: "My Accounts", href: "/portal" },
        { label: account ? `Account ${account.uuid?.slice(0, 8) ?? account.id}` : "Account" },
      ]}
    >
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="app-panel p-4 text-center">
          <p className="text-xs text-muted mb-1">Amount Given</p>
          {accountLoading ? (
            <Skeleton className="h-7 w-20 mx-auto" />
          ) : (
            <p className="text-xl font-bold text-text">{fmt(account?.amount_given)}</p>
          )}
        </div>
        <div className="app-panel p-4 text-center">
          <p className="text-xs text-muted mb-1">Amount Paid</p>
          {accountLoading ? (
            <Skeleton className="h-7 w-20 mx-auto" />
          ) : (
            <p className="text-xl font-bold text-success-600">{fmt(account?.amount_paid)}</p>
          )}
        </div>
        <div className="app-panel p-4 text-center">
          <p className="text-xs text-muted mb-1">Outstanding</p>
          {accountLoading ? (
            <Skeleton className="h-7 w-20 mx-auto" />
          ) : (
            <p className="text-xl font-bold text-warning-600">{fmt(account?.outstanding_amount)}</p>
          )}
        </div>
      </div>

      <div className="app-panel overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-text">Payment History</h2>
        </div>
        {collectionsLoading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!collectionsLoading && collections.length === 0 && (
          <EmptyState title="No payments yet" description="Your payment history will appear here." />
        )}
        {!collectionsLoading && collections.length > 0 && (
          <ul className="divide-y divide-border">
            {collections.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted">{formatDateDMY(c.date)}</span>
                <span className="font-semibold text-text">{fmt(c.payment)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}
