"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { CollectionDrawer } from "@/components/business/CollectionDrawer";
import { DatePicker } from "@/components/ui/DatePicker";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PaymentModeChip } from "@/components/ui/PaymentModeChip";
import { ResponsiveFilterPanel } from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useListCollectionsQuery } from "@/features/collections/collection-api";
import { useGetLoanQuery } from "@/features/loans/loan-api";
import type { Loan } from "@/features/loans/loan-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDateDMY } from "@/lib/format";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  overdue: "danger",
  closed: "neutral",
};

const PAGE_SIZE = 20;

function fmt(val: string | number | undefined) {
  return Number(val ?? 0).toLocaleString("en-IN");
}

const FILTER_INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

// --- CollectionLedgerSection ---

interface CollectionLedgerProps {
  loan: Loan;
  canAddCollection: boolean;
  onRecordCollection: () => void;
}

function CollectionLedgerSection({ loan, canAddCollection, onRecordCollection }: Readonly<CollectionLedgerProps>) {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [draftMinAmt, setDraftMinAmt] = useState("");
  const [draftMaxAmt, setDraftMaxAmt] = useState("");

  const hasFilters = Boolean(dateFrom || dateTo || minAmt || maxAmt);

  const { data: collectionsData, isLoading } = useListCollectionsQuery(
    {
      loan: loan.id,
      date__gte: dateFrom || undefined,
      date__lte: dateTo || undefined,
      amount_paid__gte: minAmt ? Number(minAmt) : undefined,
      amount_paid__lte: maxAmt ? Number(maxAmt) : undefined,
      ordering: "-date,-updated_at",
      page,
    },
  );

  function applyFilters() {
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setMinAmt(draftMinAmt);
    setMaxAmt(draftMaxAmt);
    setPage(1);
  }

  function clearFilters() {
    setDateFrom(""); setDateTo(""); setMinAmt(""); setMaxAmt("");
    setDraftDateFrom(""); setDraftDateTo(""); setDraftMinAmt(""); setDraftMaxAmt("");
    setPage(1);
  }

  const emptyDescription = hasFilters ? "No entries match your filters." : "Collections for this loan will appear here.";
  const emptyAction =
    !hasFilters && loan.status === "active" && canAddCollection
      ? { label: "Record First Collection", onClick: onRecordCollection }
      : undefined;

  return (
    <div className="app-panel overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text">Daily Collection Ledger</h3>
          <p className="text-xs text-muted mt-0.5">Total: {collectionsData?.count ?? 0} entries</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-xs text-primary-500 font-semibold hover:text-primary-600 transition-colors">
              Clear filters
            </button>
          )}
          <ResponsiveFilterPanel
            title="Filter Collections"
            hasActiveFilters={hasFilters}
            onApply={applyFilters}
            onReset={clearFilters}
          >
            <DatePicker name="loan_date_from" label="Date from" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} />
            <DatePicker name="loan_date_to" label="Date to" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Min ₹" value={draftMinAmt} onChange={(e) => setDraftMinAmt(e.target.value)} className={FILTER_INPUT_CLASS} />
              <input type="number" placeholder="Max ₹" value={draftMaxAmt} onChange={(e) => setDraftMaxAmt(e.target.value)} className={FILTER_INPUT_CLASS} />
            </div>
          </ResponsiveFilterPanel>
        </div>
      </div>

      {isLoading && <div className="p-4"><SkeletonList count={5} /></div>}

      {!isLoading && (collectionsData?.results?.length ?? 0) === 0 && (
        <EmptyState title="No collections found" description={emptyDescription} action={emptyAction} />
      )}

      {!isLoading && (collectionsData?.results?.length ?? 0) > 0 && (
        <div className="divide-y divide-border">
          {collectionsData!.results.map((entry) => (
            <div key={entry.id} className="p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                {entry.collection_code ?? `CL-${entry.id}`}
              </p>
              <p className="text-xl font-bold text-text mb-1.5">
                ₹{fmt(entry.amount_paid)}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-primary-600">{formatDateDMY(entry.date)}</span>
                {entry.payment_mode && <PaymentModeChip mode={entry.payment_mode} />}
              </div>
              {entry.notes ? <p className="text-xs text-muted mt-1.5">{entry.notes}</p> : null}
            </div>
          ))}
        </div>
      )}

      {(collectionsData?.count ?? 0) > PAGE_SIZE && (
        <div className="p-3 border-t border-border">
          <Pagination
            page={page}
            count={collectionsData?.count ?? 0}
            pageSize={PAGE_SIZE}
            onChange={(p) => { setPage(p); globalThis.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
        </div>
      )}
    </div>
  );
}

// --- LoanDetailPage ---

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useRoleAccess();
  const [collectOpen, setCollectOpen] = useState(false);

  const { data: loan, isLoading: loanLoading } = useGetLoanQuery(id, { skip: !id });

  const borrowerHref = loan
    ? `/borrowers/${(loan as Loan & { borrower_uuid?: string }).borrower_uuid ?? loan.borrower}`
    : "/borrowers";

  return (
    <Screen
      title={loan ? loan.loan_code ?? `Loan ${loan.id}` : "Loan Detail"}
      backHref={borrowerHref}
      breadcrumb={[
        { label: "Borrowers", href: "/borrowers" },
        ...(loan?.borrower_name ? [{ label: loan.borrower_name, href: borrowerHref }] : []),
        { label: loan ? loan.loan_code ?? `Loan ${loan.id}` : "…" },
      ]}
      actions={
        loan?.status === "active" && can("add:collection") ? (
          <Button size="sm" fullWidth={false} onClick={() => setCollectOpen(true)} type="button">
            + Record Collection
          </Button>
        ) : undefined
      }
    >
      {loanLoading && <SkeletonList count={3} />}

      {!loanLoading && loan && (
        <div className="space-y-4">
          {/* Loan summary */}
          <div className="app-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-text">{loan.loan_code ?? `Loan ${loan.id}`}</p>
                <p className="text-xs text-muted">
                  {loan.borrower_name} · Started{" "}
                  <span className="font-semibold text-primary-600">{formatDateDMY(loan.start_date)}</span>
                </p>
                {loan.notes ? <p className="text-xs text-muted mt-1">{loan.notes}</p> : null}
              </div>
              <Badge variant={STATUS_VARIANT[loan.status] ?? "neutral"} className="capitalize">
                {loan.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface2 rounded-xl p-3 text-center">
                <p className="text-xs text-muted">Principal</p>
                <p className="text-base font-bold text-text">₹{fmt(loan.principal)}</p>
              </div>
              <div className="bg-surface2 rounded-xl p-3 text-center">
                <p className="text-xs text-muted">Total Due</p>
                <p className="text-base font-bold text-text">₹{fmt(loan.total_amount)}</p>
              </div>
              <div className="bg-surface2 rounded-xl p-3 text-center">
                <p className="text-xs text-muted">Paid</p>
                <p className="text-base font-bold text-success-600">₹{fmt(loan.paid_amount)}</p>
              </div>
              <div className="bg-surface2 rounded-xl p-3 text-center">
                <p className="text-xs text-muted">Outstanding</p>
                <p className="text-base font-bold text-warning-600">₹{fmt(loan.outstanding_balance)}</p>
              </div>
            </div>
          </div>

          <CollectionLedgerSection
            loan={loan}
            canAddCollection={can("add:collection")}
            onRecordCollection={() => setCollectOpen(true)}
          />
        </div>
      )}

      {!loanLoading && !loan && (
        <EmptyState title="Loan not found" description="This loan may have been removed." />
      )}

      {loan && (
        <CollectionDrawer
          loanId={loan.id}
          borrowerId={loan.borrower}
          open={collectOpen}
          onClose={() => setCollectOpen(false)}
        />
      )}
    </Screen>
  );
}
