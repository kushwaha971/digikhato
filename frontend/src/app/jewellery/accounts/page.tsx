"use client";

import { useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills } from "@/components/ui/FilterPills";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { JwlAccount, JwlVoucher } from "@/store/jewellery-api";
import {
  useCreateVoucherMutation,
  useGetCoaTreeQuery,
  useGetTrialBalanceQuery,
  useListVouchersQuery,
  usePostVoucherMutation,
} from "@/store/jewellery-api";

// ─── Constants ────────────────────────────────────────────────────────────────

const TAB_OPTIONS = [
  { label: "Chart of Accounts", value: "coa" },
  { label: "Vouchers", value: "vouchers" },
  { label: "Trial Balance", value: "trial-balance" },
];

const VOUCHER_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Receipt", value: "RECEIPT" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Journal", value: "JOURNAL" },
  { label: "Contra", value: "CONTRA" },
];

const ACCOUNT_TYPE_VARIANT: Record<string, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  ASSET: "success",
  LIABILITY: "danger",
  INCOME: "primary",
  EXPENSE: "warning",
  EQUITY: "neutral",
};

const VOUCHER_STATUS_VARIANT: Record<string, "success" | "neutral"> = {
  POSTED: "success",
  DRAFT: "neutral",
};

// ─── COA Tree Node ────────────────────────────────────────────────────────────

function CoaNode({ account, level = 0 }: { account: JwlAccount; level?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-surface2 cursor-pointer"
        style={{ paddingLeft: `${12 + level * 20}px` }}
        onClick={() => hasChildren && setExpanded((v) => !v)}
      >
        {hasChildren ? (
          <span className="text-muted text-xs w-4 select-none">{expanded ? "▾" : "▸"}</span>
        ) : (
          <span className="w-4" />
        )}
        <span className="font-mono text-xs text-muted w-14 shrink-0">{account.code}</span>
        <span className="text-sm text-text flex-1">{account.name}</span>
        <Badge variant={ACCOUNT_TYPE_VARIANT[account.account_type] ?? "neutral"}>
          {account.account_type}
        </Badge>
      </div>
      {hasChildren && expanded &&
        account.children!.map((child) => (
          <CoaNode key={child.id} account={child} level={level + 1} />
        ))}
    </div>
  );
}

// ─── COA Tab ──────────────────────────────────────────────────────────────────

function CoaTab() {
  const { data: accounts, isLoading, isError } = useGetCoaTreeQuery();

  if (isLoading) return <SkeletonList count={4} />;
  if (isError) return <EmptyState title="Failed to load accounts" description="Please try again." />;
  if (!accounts || accounts.length === 0)
    return <EmptyState title="No accounts yet" description="Seed defaults to populate the chart of accounts." />;

  return (
    <div className="app-panel divide-y divide-border">
      {accounts.map((account) => (
        <CoaNode key={account.id} account={account} />
      ))}
    </div>
  );
}

// ─── Voucher Form (inside Drawer) ─────────────────────────────────────────────

interface VoucherFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

function VoucherForm({ onSuccess, onClose }: VoucherFormProps) {
  const [createVoucher, { isLoading }] = useCreateVoucherMutation();

  const [form, setForm] = useState({
    voucher_no: "",
    voucher_date: new Date().toISOString().split("T")[0],
    voucher_type: "RECEIPT",
    narration: "",
    total_amount: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createVoucher({ ...form, entries: [] }).unwrap();
      onSuccess();
    } catch {
      // error handled by RTK
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Voucher No</label>
        <input
          className="app-input w-full"
          required
          value={form.voucher_no}
          onChange={(e) => setForm((f) => ({ ...f, voucher_no: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Date</label>
        <input
          type="date"
          className="app-input w-full"
          required
          value={form.voucher_date}
          onChange={(e) => setForm((f) => ({ ...f, voucher_date: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Type</label>
        <select
          className="app-input w-full"
          value={form.voucher_type}
          onChange={(e) => setForm((f) => ({ ...f, voucher_type: e.target.value }))}
        >
          <option value="RECEIPT">Receipt</option>
          <option value="PAYMENT">Payment</option>
          <option value="JOURNAL">Journal</option>
          <option value="CONTRA">Contra</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Narration</label>
        <input
          className="app-input w-full"
          value={form.narration}
          onChange={(e) => setForm((f) => ({ ...f, narration: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Total Amount</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="app-input w-full"
          required
          value={form.total_amount}
          onChange={(e) => setForm((f) => ({ ...f, total_amount: e.target.value }))}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" size="sm" loading={isLoading}>
          Save Draft
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Voucher Row ──────────────────────────────────────────────────────────────

function VoucherRow({ voucher }: { voucher: JwlVoucher }) {
  const [postVoucher, { isLoading }] = usePostVoucherMutation();

  return (
    <div className="app-panel p-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text text-sm">{voucher.voucher_no}</span>
          <Badge variant="neutral">{voucher.voucher_type}</Badge>
          <Badge variant={VOUCHER_STATUS_VARIANT[voucher.status] ?? "neutral"}>{voucher.status}</Badge>
        </div>
        <div className="mt-1 text-xs text-muted">
          {voucher.voucher_date} &middot; &#8377;{Number(voucher.total_amount).toLocaleString("en-IN")}
          {voucher.narration && ` · ${voucher.narration}`}
        </div>
      </div>
      {voucher.status === "DRAFT" && (
        <Button
          size="xs"
          variant="outline"
          loading={isLoading}
          onClick={() => postVoucher(voucher.id)}
        >
          Post
        </Button>
      )}
    </div>
  );
}

// ─── Vouchers Tab ─────────────────────────────────────────────────────────────

function VouchersTab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voucherType, setVoucherType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError } = useListVouchersQuery({
    voucher_type: voucherType || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const vouchers = data?.results ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="app-panel p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <FilterPills options={VOUCHER_TYPE_OPTIONS} value={voucherType} onChange={setVoucherType} />
          <Button size="sm" variant="primary" onClick={() => setDrawerOpen(true)}>
            New Voucher
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted">From</label>
            <input
              type="date"
              className="app-input text-xs"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted">To</label>
            <input
              type="date"
              className="app-input text-xs"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading && <SkeletonList count={3} />}
      {isError && <EmptyState title="Failed to load vouchers" description="Please try again." />}
      {!isLoading && !isError && vouchers.length === 0 && (
        <EmptyState
          title="No vouchers found"
          description="Create your first voucher using the button above."
          action={{ label: "New Voucher", onClick: () => setDrawerOpen(true) }}
        />
      )}
      {!isLoading && !isError && vouchers.length > 0 && (
        <div className="space-y-2">
          {vouchers.map((v) => (
            <VoucherRow key={v.id} voucher={v} />
          ))}
        </div>
      )}

      {/* New voucher drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New Voucher">
        <VoucherForm
          onSuccess={() => setDrawerOpen(false)}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
}

// ─── Trial Balance Tab ────────────────────────────────────────────────────────

function TrialBalanceTab() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [queryArgs, setQueryArgs] = useState<{ date_from: string; date_to: string } | null>(null);

  const { data: rows, isLoading, isFetching } = useGetTrialBalanceQuery(
    queryArgs ?? { date_from: dateFrom, date_to: dateTo },
    { skip: !queryArgs }
  );

  function handleLoad() {
    setQueryArgs({ date_from: dateFrom, date_to: dateTo });
  }

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-4">
      {/* Date range filter */}
      <div className="app-panel p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-xs text-muted">From</label>
          <input
            type="date"
            className="app-input text-xs"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-muted">To</label>
          <input
            type="date"
            className="app-input text-xs"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <Button size="sm" variant="primary" loading={loading} onClick={handleLoad}>
          Load
        </Button>
      </div>

      {/* Table */}
      {loading && <SkeletonList count={4} />}
      {!loading && rows && rows.length === 0 && (
        <EmptyState title="No data for this period" description="Try a different date range." />
      )}
      {!loading && rows && rows.length > 0 && (
        <div className="app-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-4 py-2 text-left font-semibold">Code</th>
                <th className="px-4 py-2 text-left font-semibold">Account Name</th>
                <th className="px-4 py-2 text-right font-semibold">Debit</th>
                <th className="px-4 py-2 text-right font-semibold">Credit</th>
                <th className="px-4 py-2 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const balance = Number(row.balance);
                return (
                  <tr key={row.account_id} className="hover:bg-surface2 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs text-muted">{row.account_code}</td>
                    <td className="px-4 py-2 text-text">{row.account_name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {Number(row.debit_total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {Number(row.credit_total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-semibold tabular-nums ${
                        balance >= 0 ? "text-success-700 dark:text-success-400" : "text-danger-700 dark:text-danger-400"
                      }`}
                    >
                      {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const [tab, setTab] = useState("coa");

  return (
    <Screen title="Accounts & Ledger">
      <div className="space-y-4">
        <FilterPills options={TAB_OPTIONS} value={tab} onChange={setTab} />

        {tab === "coa" && <CoaTab />}
        {tab === "vouchers" && <VouchersTab />}
        {tab === "trial-balance" && <TrialBalanceTab />}
      </div>
    </Screen>
  );
}
