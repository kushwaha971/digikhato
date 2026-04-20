"use client";

import { useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveFilterPanel } from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
import { todayIsoDate } from "@/lib/date";
import { formatDateDMY } from "@/lib/format";
import {
  useGetDailyReportQuery,
  useGetLoanReportQuery,
  useGetOverdueReportQuery,
} from "@/features/reports/report-api";

type ReportTab = "daily" | "accounts" | "overdue";

const tabs: { id: ReportTab; label: string }[] = [
  { id: "daily", label: "Daily Collection" },
  { id: "accounts", label: "Account Summary" },
  { id: "overdue", label: "Overdue" },
];

const statusVariant: Record<string, "success" | "neutral" | "danger"> = {
  active: "success",
  closed: "neutral",
  overdue: "danger",
};

function formatCurrency(value: string | number | undefined | null) {
  if (value === undefined || value === null) return "₹0";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function SkeletonStatCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Daily Report Tab ─────────────────────────────────────────────────────────
function DailyReport({ date }: { date: string }) {
  const { data, isLoading, isError } = useGetDailyReportQuery({ date });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <>
          <SkeletonStatCards count={2} />
          <SkeletonList count={4} />
        </>
      ) : isError ? (
        <EmptyState title="Failed to load report" description="Something went wrong. Please try again." />
      ) : !data ? (
        <EmptyState title="No data for selected date" description="No collections were recorded on this date." />
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card-gradient p-4 rounded-2xl">
              <p className="text-white/70 text-xs">Total Collected</p>
              <p className="text-white text-2xl font-bold mt-1">{formatCurrency(data.total_collected)}</p>
            </div>
            <div className="stat-card-success p-4 rounded-2xl">
              <p className="text-white/70 text-xs">Collections Made</p>
              <p className="text-white text-2xl font-bold mt-1">{data.collections_count ?? 0}</p>
            </div>
          </div>

          {/* Collections table */}
          {data.collections?.length > 0 ? (
            <div className="app-panel overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-text text-sm">Collection Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Account</th>
                      <th>Mode</th>
                      <th className="text-right">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.collections.map((c) => (
                      <tr key={c.id}>
                        <td className="font-medium">{c.borrower_name}</td>
                        <td className="text-muted">{c.loan_id}</td>
                        <td className="text-muted capitalize">{c.payment_mode ? c.payment_mode.replace("_", " ") : "—"}</td>
                        <td className="text-right font-semibold text-success-600">{formatCurrency(c.payment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState title="No collections on this date" />
          )}
        </>
      )}
    </div>
  );
}

// ── Account Summary Tab ──────────────────────────────────────────────────────
function AccountSummaryReport() {
  const { data, isLoading, isError } = useGetLoanReportQuery();

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonList count={5} />
      </>
    );
  }

  if (isError) return <EmptyState title="Failed to load accounts" />;
  if (!data) return <EmptyState title="No account data available" description="Create accounts to see summary reports." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="stat-card-gradient p-4 rounded-2xl">
          <p className="text-white/70 text-xs">Total Given</p>
          <p className="text-white text-xl font-bold mt-1">{formatCurrency(data.total_given)}</p>
        </div>
        <div className="stat-card-success p-4 rounded-2xl">
          <p className="text-white/70 text-xs">Total Paid</p>
          <p className="text-white text-xl font-bold mt-1">{formatCurrency(data.total_paid)}</p>
        </div>
        <div className="stat-card-warning p-4 rounded-2xl col-span-2 lg:col-span-1">
          <p className="text-[#1c1400]/80 text-xs">Outstanding</p>
          <p className="text-[#1c1400] text-xl font-bold mt-1">{formatCurrency(data.total_outstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: data.active_count, variant: "success" as const },
          { label: "Closed", value: data.closed_count, variant: "neutral" as const },
          { label: "Overdue", value: data.overdue_count, variant: "danger" as const },
        ].map(({ label, value, variant }) => (
          <div key={label} className="app-panel p-3 text-center">
            <p className="text-xs text-muted">{label}</p>
            <p className="text-xl font-bold text-text mt-0.5">{value ?? 0}</p>
            <Badge variant={variant} className="mt-1 text-[10px]">{label}</Badge>
          </div>
        ))}
      </div>

      {data.accounts?.length > 0 && (
        <div className="app-panel overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-text text-sm">All Accounts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th className="text-right">Given</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Outstanding</th>
                  <th>Status</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.borrower_name}</td>
                    <td className="text-right">{formatCurrency(a.amount_given)}</td>
                    <td className="text-right text-success-600">{formatCurrency(a.amount_paid)}</td>
                    <td className="text-right font-semibold">{formatCurrency(a.outstanding_amount)}</td>
                    <td>
                      <Badge variant={statusVariant[a.status] ?? "neutral"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="text-muted text-xs">{formatDateDMY(a.start_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overdue Report Tab ───────────────────────────────────────────────────────
function OverdueReport() {
  const { data, isLoading, isError } = useGetOverdueReportQuery();

  if (isLoading) return <SkeletonList count={4} />;
  if (isError) return <EmptyState title="Failed to load overdue report" />;
  if (!data || data.overdue_count === 0) {
    return <EmptyState title="No overdue accounts" description="All accounts are up to date." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card-danger p-4 rounded-2xl">
          <p className="text-white/70 text-xs">Overdue Accounts</p>
          <p className="text-white text-2xl font-bold mt-1">{data.overdue_count}</p>
        </div>
        <div className="stat-card-danger p-4 rounded-2xl">
          <p className="text-white/70 text-xs">Total Overdue</p>
          <p className="text-white text-2xl font-bold mt-1">{formatCurrency(data.total_overdue_amount)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.accounts?.map((a) => (
          <div key={a.id} className="app-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-text">{a.borrower_name}</p>
              <Badge variant="danger">Overdue</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted text-xs">Amount Given</p>
                <p className="font-medium">{formatCurrency(a.amount_given)}</p>
              </div>
              <div>
                <p className="text-muted text-xs">Outstanding</p>
                <p className="font-semibold text-danger-600">{formatCurrency(a.outstanding_amount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Reports Page ────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("daily");
  const [dailyDate, setDailyDate] = useState(todayIsoDate());
  const [dailyDateDraft, setDailyDateDraft] = useState(dailyDate);

  function applyDailyFilter() {
    setDailyDate(dailyDateDraft);
  }

  function resetDailyFilter() {
    const currentDate = todayIsoDate();
    setDailyDate(currentDate);
    setDailyDateDraft(currentDate);
  }

  return (
    <Screen
      title="Reports"
      actions={
        activeTab === "daily" ? (
          <ResponsiveFilterPanel
            title="Filter Report"
            hasActiveFilters={dailyDate !== todayIsoDate()}
            onApply={applyDailyFilter}
            onReset={resetDailyFilter}
          >
            <DatePicker
              name="reports_daily_date"
              label="Report date"
              value={dailyDateDraft}
              onChange={(event) => setDailyDateDraft(event.target.value)}
            />
          </ResponsiveFilterPanel>
        ) : undefined
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-surface text-primary-500 shadow-card"
                : "text-muted hover:text-text",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "daily" && <DailyReport date={dailyDate} />}
        {activeTab === "accounts" && <AccountSummaryReport />}
        {activeTab === "overdue" && <OverdueReport />}
      </div>
    </Screen>
  );
}
