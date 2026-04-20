"use client";

import Link from "next/link";

import { Borrower } from "@/features/borrowers/borrower-api";
import { Loan } from "@/features/loans/loan-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";

export function BorrowerHubSummary({ borrower, loans }: { borrower: Borrower; loans: Loan[] }) {
  const { isAdmin } = useRoleAccess();
  const activeLoans = loans.filter((l) => l.status === "active");
  const outstanding = activeLoans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 p-3">
      <div>
        <p className="text-lg font-bold">{borrower.name}</p>
        <p className="text-sm text-gray-600">{borrower.mobile_number}</p>
        <p className="text-sm text-gray-600">{borrower.address}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-gray-500">Active Loans</p>
          <p className="text-base font-bold">{activeLoans.length}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-gray-500">Outstanding</p>
          <p className="text-base font-bold">{outstanding.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link href={`/borrowers/${borrower.uuid}`} className="rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-bold text-white">
          Collect Payment
        </Link>
        {isAdmin ? (
          <Link href={`/loans/create?borrower=${borrower.id}`} className="rounded-lg border border-brand-500 px-3 py-2 text-center text-xs font-bold text-brand-700">
            Create New Loan
          </Link>
        ) : null}
      </div>
    </div>
  );
}
