"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoanDrawer } from "@/components/business/LoanDrawer";
import { CollectionDrawer } from "@/components/business/CollectionDrawer";
import { useGetBorrowerQuery, useUpdateBorrowerMutation, useDeleteBorrowerMutation } from "@/features/borrowers/borrower-api";
import { useListLoansQuery } from "@/features/loans/loan-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDateDMY } from "@/lib/format";
import type { Loan } from "@/features/loans/loan-api";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  overdue: "danger",
  closed: "neutral",
  inactive: "neutral",
};

function LoanCard({ loan, canCollect, canManage }: Readonly<{ loan: Loan; canCollect: boolean; canManage: boolean }>) {
  const [collectOpen, setCollectOpen] = useState(false);

  return (
    <>
      <div className="p-4 border-b border-border last:border-0">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/loans/${loan.uuid}`}
              className="font-semibold text-text text-sm hover:text-primary-600 transition-colors"
            >
              {loan.loan_code ?? `LN-${loan.id}`}
            </Link>
            <p className="text-xs text-muted mt-0.5">
              <span className="font-semibold text-primary-600">{formatDateDMY(loan.start_date)}</span>
              {loan.tenure_days ? ` · ${loan.tenure_days}d` : " · Open-ended"}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[loan.status] ?? "neutral"} className="capitalize flex-shrink-0">
            {loan.status}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <p className="text-xs text-muted">Principal</p>
            <p className="text-sm font-bold text-text">₹{Number(loan.principal).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Paid</p>
            <p className="text-sm font-bold text-success-600">₹{Number(loan.paid_amount ?? 0).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Outstanding</p>
            <p className="text-sm font-bold text-warning-600">₹{Number(loan.outstanding_balance ?? loan.principal).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canCollect && loan.status === "active" && (
            <Button size="sm" fullWidth={false} onClick={() => setCollectOpen(true)} type="button">
              + Collect
            </Button>
          )}
          <Link href={`/loans/${loan.uuid}`}>
            <Button size="sm" variant="secondary" fullWidth={false} type="button">
              View Collections
            </Button>
          </Link>
          {canManage && loan.interest_rate && (
            <p className="text-xs text-muted ml-auto">Rate: {loan.interest_rate}%/day</p>
          )}
        </div>
      </div>

      <CollectionDrawer
        loanId={loan.id}
        borrowerId={loan.borrower}
        open={collectOpen}
        onClose={() => setCollectOpen(false)}
      />
    </>
  );
}

function BorrowerActions({
  borrowerStatus,
  onEdit,
  onToggle,
  onDelete,
}: Readonly<{
  borrowerStatus: string | undefined;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}>) {
  const isActive = borrowerStatus === "active";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" title="Edit borrower" onClick={onEdit}
        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button type="button" title={isActive ? "Deactivate borrower" : "Reactivate borrower"} onClick={onToggle}
        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
          isActive
            ? "border-warning-300 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20"
            : "border-success-300 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20"
        }`}>
        {isActive ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
      <button type="button" title="Delete borrower" onClick={onDelete}
        className="w-9 h-9 rounded-lg border border-danger-300 flex items-center justify-center text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

export default function BorrowerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const uuid = params.id;
  const { isAdmin, can } = useRoleAccess();

  const [loanDrawerOpen, setLoanDrawerOpen] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: borrower, isLoading } = useGetBorrowerQuery(uuid, { skip: !uuid });
  const { data: loanData, isLoading: loansLoading } = useListLoansQuery({ borrower: borrower?.id }, { skip: !borrower?.id });
  const [updateBorrower, { isLoading: isToggling }] = useUpdateBorrowerMutation();
  const [deleteBorrower, { isLoading: isDeleting }] = useDeleteBorrowerMutation();

  const loans = loanData?.results ?? [];
  const activeLoans = loans.filter((l) => l.status === "active");
  const pastLoans = loans.filter((l) => l.status !== "active");

  const handleToggleStatus = async () => {
    if (!borrower) return;
    const newStatus = borrower.status === "active" ? "inactive" : "active";
    await updateBorrower({ id: borrower.uuid, data: { status: newStatus } });
    setConfirmToggle(false);
  };

  const handleDelete = async () => {
    try {
      await deleteBorrower(borrower!.uuid).unwrap();
      router.push("/borrowers");
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <Screen
      title={borrower?.name ?? "Borrower"}
      backHref="/borrowers"
      breadcrumb={[{ label: "Borrowers", href: "/borrowers" }, { label: borrower?.name ?? "…" }]}
      actions={
        isAdmin ? (
          <BorrowerActions
            borrowerStatus={borrower?.status}
            onEdit={() => router.push(`/borrowers/${uuid}/edit`)}
            onToggle={() => setConfirmToggle(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        ) : undefined
      }
    >
      {isLoading && <SkeletonList count={3} />}

      {!isLoading && borrower && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="app-panel p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text">{borrower.mobile_number}</p>
              <p className="text-xs text-muted mt-0.5">
                {loans.length} total loan{loans.length !== 1 ? "s" : ""} · {activeLoans.length} active
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[borrower.status] ?? "neutral"} className="capitalize text-xs">
              {borrower.status}
            </Badge>
          </div>

          {/* Active loans */}
          <div className="app-panel overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text">Active Loans</h3>
                {activeLoans.length > 0 && (
                  <p className="text-xs text-muted mt-0.5">{activeLoans.length} loan{activeLoans.length !== 1 ? "s" : ""}</p>
                )}
              </div>
              {can("create:loan") && (
                <Button size="sm" fullWidth={false} onClick={() => setLoanDrawerOpen(true)} type="button">
                  + Add Loan
                </Button>
              )}
            </div>

            {loansLoading ? (
              <div className="p-4"><SkeletonList count={2} /></div>
            ) : (
              <>
                {activeLoans.length === 0 && (
                  <EmptyState
                    title="No active loans"
                    description="Add a new loan for this borrower."
                    action={can("create:loan") ? { label: "Add Loan", onClick: () => setLoanDrawerOpen(true) } : undefined}
                  />
                )}
                {activeLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} canCollect={can("add:collection")} canManage={isAdmin} />
                ))}
              </>
            )}
          </div>

          {/* Past loans */}
          {pastLoans.length > 0 && (
            <div className="app-panel overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-text">Past Loans</h3>
                <p className="text-xs text-muted mt-0.5">{pastLoans.length} loan{pastLoans.length !== 1 ? "s" : ""}</p>
              </div>
              {pastLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} canCollect={false} canManage={isAdmin} />
              ))}
            </div>
          )}
        </div>
      )}

      <LoanDrawer borrowerId={borrower?.id ?? 0} open={loanDrawerOpen} onClose={() => setLoanDrawerOpen(false)} />

      <ConfirmDialog
        open={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        onConfirm={handleToggleStatus}
        isLoading={isToggling}
        title={borrower?.status === "active" ? "Deactivate Borrower" : "Reactivate Borrower"}
        description={
          borrower?.status === "active"
            ? `Deactivating ${borrower.name} will disable their profile. Existing loans are not affected.`
            : `Reactivating ${borrower?.name ?? "this borrower"} will restore their access and allow new loan activity.`
        }
        confirmLabel={borrower?.status === "active" ? "Deactivate" : "Reactivate"}
        confirmVariant={borrower?.status === "active" ? "danger" : "success"}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Borrower"
        description={`Permanently delete ${borrower?.name ?? "this borrower"}? All associated loan and collection data will also be removed. This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </Screen>
  );
}
