"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { CustomerSearchSelect } from "@/components/jewellery/shared/CustomerSearchSelect";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon } from "@/components/ui/icons";
import { FilterSelect, ResponsiveFilterPanel } from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { LOAN_STATUS_OPTIONS, loanStatusVariant } from "@/constants/jewellery";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { ROUTES } from "@/lib/routes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { JwlPledgeLoan } from "@/store/jewellery-api";
import { useListPledgeLoansQuery } from "@/store/jewellery-api";
import { setPledgeFilters, resetPledgeFilters } from "@/store/jewellery-filters-slice";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

type LoanStatus = "ACTIVE" | "CLOSED" | "RENEWED" | "AUCTIONED" | "LOSS";

function LoanCard({ loan }: Readonly<{ loan: JwlPledgeLoan }>) {
  return (
    <Link href={`/jewellery/gold-pledge/${loan.id}`} className="block">
      <div className="app-panel p-4 card-clickable">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{loan.loan_no}</p>
            <p className="text-xs text-muted mt-0.5">
              {loan.loan_date}
              {loan.maturity_date ? (
                <>
                  <span className="mx-1.5">·</span>
                  <span>Due: {loan.maturity_date}</span>
                </>
              ) : null}
            </p>
          </div>
          <Badge variant={loanStatusVariant(loan.status)} className="shrink-0">
            {loan.status}
          </Badge>
        </div>

        <p className="text-sm text-muted truncate">{loan.customer_name}</p>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-xs text-muted">Principal</p>
            <p className="text-sm font-bold text-text">{formatINRCurrency(loan.principal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Scheme</p>
            <p className="text-sm font-semibold text-text truncate">{loan.scheme_name}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GoldPledgePage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.jewelleryFilters.pledge);
  const { status, customerId, page } = filters;

  const [draftStatus, setDraftStatus] = useState<LoanStatus | "">(status as LoanStatus | "");
  const [draftCustomer, setDraftCustomer] = useState(customerId);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const { data, isFetching } = useListPledgeLoansQuery({
    status: status || undefined,
    customer: customerId || undefined,
  });

  const loadMore = useCallback(() => dispatch(setPledgeFilters({ page: page + 1 })), [dispatch, page]);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlPledgeLoan>(data, isFetching, page, loadMore);

  const hasFilters = useMemo(() => Boolean(status || customerId), [status, customerId]);

  const applyFilters = () => {
    dispatch(setPledgeFilters({ status: draftStatus, customerId: draftCustomer, page: 1 }));
  };

  const resetFilters = () => {
    dispatch(resetPledgeFilters());
    setDraftStatus("");
    setDraftCustomer("");
  };

  return (
    <Screen
      title="Gold Pledge Loans"
      subtitle="Manage gold-secured loans, pledge items, and repayments"
      backHref={ROUTES.app.jewellery.dashboard}
      actions={(
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ResponsiveFilterPanel
            title="Filter loans"
            hasActiveFilters={hasFilters}
            onApply={applyFilters}
            onReset={resetFilters}
          >
            <FilterSelect
              label="Status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value as LoanStatus | "")}
            >
              {LOAN_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </FilterSelect>

            <CustomerSearchSelect
              value={draftCustomer}
              onChange={(id) => setDraftCustomer(id)}
              label="Customer"
              showSelectedName={true}
            />
          </ResponsiveFilterPanel>

          <Button onClick={() => setCreateDrawerOpen(true)} leftIcon={<PlusIcon />}>
            New Loan
          </Button>
        </div>
      )}
    >
      {hasFilters ? <p className="text-xs text-muted mb-3">Filters applied</p> : null}

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && items.length === 0 ? (
        <EmptyState
          title="No loans found"
          description={hasFilters ? "No loans match your current filters." : "Create your first gold pledge loan to get started."}
          action={{
            label: "New Loan",
            onClick: () => setCreateDrawerOpen(true),
          }}
        />
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="space-y-3">
            {items.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>

          {hasMore ? <div ref={sentinelRef} className="h-1 mt-2" /> : null}
          {isFetching && page > 1 ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          ) : null}
        </>
      ) : null}

      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="New Gold Pledge Loan"
        size="2xl"
      >
        <iframe
          src="/jewellery/gold-pledge/new"
          className="w-full h-[80vh] rounded-xl border border-border"
          title="Create gold pledge loan form"
        />
      </Drawer>
    </Screen>
  );
}
