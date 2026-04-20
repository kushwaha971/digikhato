import { Loan } from "@/features/loans/loan-api";
import { formatCurrencyINR } from "@/lib/format";

export function OverdueCard({ loan }: { loan: Loan }) {
  return (
    <div className="rounded-xl border border-danger-300 bg-danger-50/70 dark:bg-danger-900/10 p-3">
      <p className="font-semibold text-danger-700 dark:text-danger-300">{loan.borrower_name}</p>
      <p className="text-sm text-danger-700/90 dark:text-danger-300/90">Outstanding: {formatCurrencyINR(loan.outstanding_balance)}</p>
    </div>
  );
}
