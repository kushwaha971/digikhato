import { Loan } from "@/features/loans/loan-api";
import { formatCurrencyINR } from "@/lib/format";

export function OverdueCard({ loan }: { loan: Loan }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="font-semibold text-red-800">{loan.borrower_name}</p>
      <p className="text-sm text-red-700">Outstanding: {formatCurrencyINR(loan.outstanding_balance)}</p>
    </div>
  );
}
