"use client";

import { useState } from "react";
import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PaymentModeChip } from "@/components/ui/PaymentModeChip";
import { useListBorrowersQuery } from "@/features/borrowers/borrower-api";
import { useListCollectionsQuery } from "@/features/collections/collection-api";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDateDMY } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { isAdmin, isCollector } = useRoleAccess();

  const { data: borrowers, isLoading: searchLoading } = useListBorrowersQuery(
    { search },
    { skip: search.trim().length < 2 },
  );

  const { data: recentCollections } = useListCollectionsQuery(
    { ordering: "-date,-updated_at", page: 1 },
    { skip: !isAdmin && !isCollector },
  );

  return (
    <Screen title="Dashboard">
      {/* Search bar */}
      <div className="mb-6">
        <StickyGlobalSearchBar value={search} onChange={setSearch} />
        {search.trim().length >= 2 && (
          <div className="mt-2 app-panel overflow-hidden">
            {searchLoading && <div className="p-3 text-sm text-muted">Searching…</div>}
            {!searchLoading && (borrowers?.results?.length ?? 0) === 0 && (
              <div className="p-3 text-sm text-muted">No borrowers found.</div>
            )}
            {!searchLoading && (borrowers?.results?.length ?? 0) > 0 && borrowers?.results?.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href={ROUTES.app.loans.borrower(b.uuid ?? b.id)}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-surface2 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-text">{b.name}</p>
                  <p className="text-xs text-muted">{b.mobile_number}</p>
                </div>
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stat cards */}
      {summaryLoading ? (
        <SkeletonList count={2} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card-gradient p-4 rounded-2xl">
            <p className="text-white/70 text-xs font-medium">Today&apos;s Collection</p>
            <p className="text-white text-2xl font-bold mt-1">₹{summary?.today_collection_total ?? "0"}</p>
            <p className="text-white/60 text-xs mt-1">collected today</p>
          </div>
          <div className="stat-card-success p-4 rounded-2xl">
            <p className="text-white/70 text-xs font-medium">Active Loans</p>
            <p className="text-white text-2xl font-bold mt-1">{summary?.active_loans ?? "0"}</p>
            <p className="text-white/60 text-xs mt-1">ongoing loans</p>
          </div>
          <div className="stat-card-warning p-4 rounded-2xl">
            <p className="text-neutral-900/80 text-xs font-medium">Total Outstanding</p>
            <p className="text-neutral-900 text-2xl font-bold mt-1">₹{summary?.total_outstanding ?? "0"}</p>
            <p className="text-neutral-900/60 text-xs mt-1">to be collected</p>
          </div>
          <div className="stat-card-danger p-4 rounded-2xl">
            <p className="text-white/70 text-xs font-medium">Overdue</p>
            <p className="text-white text-2xl font-bold mt-1">{summary?.overdue_count ?? "0"}</p>
            <p className="text-white/60 text-xs mt-1">accounts overdue</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {(isAdmin || isCollector) && (
          <Link href={ROUTES.app.loans.collectionsToday} className="app-panel p-4 card-clickable flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-text">Today&apos;s List</p>
          </Link>
        )}
        <Link href={ROUTES.app.loans.borrowers} className="app-panel p-4 card-clickable flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-green-900/30 flex items-center justify-center text-success-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-text">Borrowers</p>
        </Link>
        <Link href={ROUTES.app.loans.reports} className="app-panel p-4 card-clickable flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-yellow-900/30 flex items-center justify-center text-warning-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-text">Reports</p>
        </Link>
        {isAdmin && (
          <Link href={ROUTES.app.loans.addBorrower} className="app-panel p-4 card-clickable flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-danger-100 dark:bg-red-900/30 flex items-center justify-center text-danger-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-text">Add Borrower</p>
          </Link>
        )}
        {(isAdmin || isCollector) && (
          <Link href={ROUTES.app.loans.locations} className="app-panel p-4 card-clickable flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-text">Locations</p>
          </Link>
        )}
      </div>

      {/* Module Cards */}
      {(isAdmin || isCollector) && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text mb-3">Your Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Customer Ledger */}
            <Link href={ROUTES.app.udhaarbook.root} className="app-panel p-4 card-clickable flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h11a3 3 0 013 3v10a3 3 0 01-3 3H6a2 2 0 00-2 2V6a2 2 0 012-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text mb-1">Udhar Book</p>
                <p className="text-xs text-muted leading-relaxed">Who owes you · Who you owe · All in one place</p>
              </div>
            </Link>

            {/* Notes */}
            <Link href={ROUTES.app.notes.root} className="app-panel p-4 card-clickable flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text mb-1">Notes</p>
                <p className="text-xs text-muted leading-relaxed">Write reminders, daily tasks, and work notes.</p>
              </div>
            </Link>

            {/* Loan Management */}
            <Link href={ROUTES.app.loans.dashboard} className="app-panel p-4 card-clickable flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text mb-1">Loan Management</p>
                <p className="text-xs text-muted leading-relaxed">Borrowers, EMI, daily collection, and dues — all here.</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Upcoming Due Loans */}
      {!summaryLoading && (summary?.upcoming_due_loans?.length ?? 0) > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
              Upcoming Due Loans
            </h2>
            <Link href={ROUTES.app.notifications} className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {summary!.upcoming_due_loans.map((loan) => (
              <Link key={loan.id} href={ROUTES.app.loans.borrower(loan.borrower_uuid ?? loan.borrower_id)} className="block">
                <div className="app-panel p-3 card-clickable border-l-4 border-l-danger-500">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{loan.borrower_name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {loan.loan_code ?? `LN-${loan.id}`} · Due{" "}
                        <span className="font-semibold text-primary-600">{formatDateDMY(loan.due_date ?? "")}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-danger-600">
                        ₹{Number(loan.outstanding_amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted">outstanding</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Collections */}
      {(recentCollections?.results?.length ?? 0) > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text">Recent Collections</h2>
            <Link href={ROUTES.app.loans.collections} className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentCollections!.results.slice(0, 5).map((col) => (
              <div key={col.id} className="app-panel p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                    {col.collection_code ?? `CL-${col.id}`}
                  </p>
                  <p className="text-xs mt-0.5 font-semibold text-primary-600">
                    {formatDateDMY(col.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {col.payment_mode && <PaymentModeChip mode={col.payment_mode} size="xs" />}
                  <p className="text-base font-bold text-text">
                    ₹{Number(col.amount_paid).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Screen>
  );
}
