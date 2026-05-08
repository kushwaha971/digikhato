"use client";

import { useState } from "react";
import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import {
  FilterSelect,
  ResponsiveFilterPanel,
} from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGetAccountsQuery } from "@/features/accounts/account-api";
import { formatDateDMY } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Overdue", value: "overdue" },
  { label: "Closed", value: "closed" },
];

const STATUS_VARIANT: Record<string, "success" | "neutral" | "danger"> = {
  active: "success",
  closed: "neutral",
  overdue: "danger",
};

function fmt(val: string | number | undefined) {
  if (!val) return "₹0";
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

export default function PortalPage() {
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const [status, setStatus] = useState("");
  const [draftStatus, setDraftStatus] = useState(status);

  const { data: accountData, isLoading } = useGetAccountsQuery(
    { status: status || undefined, ordering: "-created_at" },
    { skip: !currentUser },
  );
  const accounts = accountData?.results ?? [];

  function applyFilters() {
    setStatus(draftStatus);
  }

  function resetFilters() {
    setStatus("");
    setDraftStatus("");
  }

  return (
    <Screen
      title="My Loans"
      actions={
        <ResponsiveFilterPanel
          title="Filter Loans"
          hasActiveFilters={Boolean(status)}
          onApply={applyFilters}
          onReset={resetFilters}
        >
          <FilterSelect
            label="Status"
            value={draftStatus}
            onChange={(event) => setDraftStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
        </ResponsiveFilterPanel>
      }
    >
      <div className="space-y-4">
        {/* Welcome card */}
        <div className="stat-card-gradient p-5 rounded-2xl">
          <p className="text-white/70 text-sm mb-1">Welcome back</p>
          <p className="text-white text-xl font-bold">{currentUser?.full_name ?? "Borrower"}</p>
          <p className="text-white/60 text-xs mt-1">View your loan accounts and payment history below</p>
        </div>

        {status ? <p className="text-xs text-muted">Filters applied</p> : null}

        {isLoading && <SkeletonList count={3} />}

        {!isLoading && accounts.length === 0 && (
          <EmptyState
            title="No accounts found"
            description={status ? "No accounts match this status." : "Your loan accounts will appear here once created by your lender."}
          />
        )}

        {!isLoading && accounts.length > 0 && (
          <div className="space-y-3">
            {accounts.map((account) => (
              <Link key={account.id} href={`/portal/accounts/${account.uuid ?? account.id}`} className="block">
                <div className="app-panel p-4 card-clickable">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-text">{`Account #${account.id}`}</p>
                      <p className="text-xs text-muted">
                        {formatDateDMY(account.start_date)} · {account.duration_days ? `${account.duration_days} days` : "Open-ended"}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[account.status] ?? "neutral"} className="capitalize">
                      {account.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted">Amount Given</p>
                      <p className="font-bold text-text">{fmt(account.amount_given)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Paid</p>
                      <p className="font-bold text-success-600">{fmt(account.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Outstanding</p>
                      <p className="font-bold text-warning-600">{fmt(account.outstanding_amount)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
