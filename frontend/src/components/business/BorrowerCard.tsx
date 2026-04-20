"use client";

import Link from "next/link";

import { Borrower } from "@/features/borrowers/borrower-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";

export function BorrowerCard({ borrower }: { borrower: Borrower }) {
  const { isAdmin } = useRoleAccess();

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <p className="text-base font-semibold">{borrower.name}</p>
      <p className="text-sm text-gray-600">{borrower.mobile_number}</p>
      <p className="mt-1 text-xs uppercase text-gray-500">{borrower.status}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link href={`/borrowers/${borrower.uuid}`} className="rounded-lg border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">
          Open Profile
        </Link>
        <Link href={`/borrowers/${borrower.uuid}`} className="rounded-lg bg-brand-500 px-2 py-2 text-center text-xs font-semibold text-white">
          Collect
        </Link>
        {isAdmin ? (
          <Link href={`/loans/create?borrower=${borrower.id}`} className="rounded-lg border border-brand-500 px-2 py-2 text-center text-xs font-semibold text-brand-700">
            New Loan
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
