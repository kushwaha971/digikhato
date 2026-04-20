import Link from "next/link";

import { Loan } from "@/features/loans/loan-api";

export function LoanSummaryCard({ loan }: { loan: Loan }) {
  return (
    <Link href={`/loans/${loan.uuid}`} className="block rounded-xl border border-gray-200 p-3">
      <p className="font-semibold">{loan.borrower_name}</p>
      <p className="text-sm text-gray-600">Daily EMI: {loan.daily_emi}</p>
      <p className="text-sm text-gray-600">Outstanding: {loan.outstanding_balance}</p>
    </Link>
  );
}
