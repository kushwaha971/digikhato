"use client";

import { useState } from "react";
import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  ResponsiveFilterPanel,
} from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useListLoansQuery } from "@/features/loans/loan-api";
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

  const { data: loanData, isLoading } = useListLoansQuery(
    // Borrower users are already server-scoped by auth user relation.
    // Passing currentUser.id as borrower filter causes invalid filter usage
    // because borrower id != user id.
    { status: status || undefined, ordering: "-updated_at" },
    { skip: !currentUser },
  );
  const loans = loanData?.results ?? [];

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
          <div className="grid grid-cols-1 gap-2">
            <label className={FILTER_LABEL_CLASS}>Status</label>
            <select
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value)}
              className={FILTER_FIELD_CLASS}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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

        {!isLoading && loans.length === 0 && (
          <EmptyState
            title="No loans found"
            description={status ? "No loans match this status." : "Your loan accounts will appear here once created by your lender."}
          />
        )}

        {!isLoading && loans.length > 0 && (
          <div className="space-y-3">
            {loans.map((loan) => (
              <Link key={loan.id} href={`/portal/accounts/${loan.id}`} className="block">
                <div className="app-panel p-4 card-clickable">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-text">{loan.loan_code ?? `Loan ID ${loan.id}`}</p>
                      <p className="text-xs text-muted">
                        {formatDateDMY(loan.start_date)} · {loan.tenure_days ? `${loan.tenure_days} days` : "Open-ended"}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[loan.status] ?? "neutral"} className="capitalize">
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted">Principal</p>
                      <p className="font-bold text-text">{fmt(loan.principal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Paid</p>
                      <p className="font-bold text-success-600">{fmt(loan.paid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Outstanding</p>
                      <p className="font-bold text-warning-600">{fmt(loan.outstanding_balance)}</p>
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
