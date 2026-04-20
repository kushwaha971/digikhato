import Link from "next/link";

type DueLoan = {
  id: number;
  borrower: number;
  borrower_name: string;
  daily_emi: string;
  outstanding_balance: string;
};

export function DueBorrowerList({ items }: { items: DueLoan[] }) {
  if (!items.length) {
    return <p className="text-sm text-muted">No dues for today.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((loan) => (
        <li key={loan.id} className="app-panel p-3">
          <p className="font-semibold text-text">{loan.borrower_name}</p>
          <p className="text-sm text-muted">Daily EMI: ₹{Number(loan.daily_emi).toLocaleString("en-IN")}</p>
          <p className="text-sm text-muted">Outstanding: ₹{Number(loan.outstanding_balance).toLocaleString("en-IN")}</p>
          <Link
            href={`/collections/entry?loan=${loan.id}&borrower=${loan.borrower}`}
            className="mt-2 inline-block rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Record Collection
          </Link>
        </li>
      ))}
    </ul>
  );
}
