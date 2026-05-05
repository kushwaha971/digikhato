"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/layout/Screen";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  useListLedgerCustomersQuery,
  useCreateLedgerCustomerMutation,
} from "@/features/customer_ledger/customer-ledger-api";

function fmt(val: string | number) {
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y ago`;
}

type FilterTab = "all" | "credit" | "debit" | "settled";

const FILTERS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "credit", label: "Will Get" },
  { value: "debit", label: "Will Give" },
  { value: "settled", label: "Settled" },
];

function getPartyAvatarBg(balance: number): string {
  if (balance > 0) return "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400";
  if (balance < 0) return "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400";
  return "bg-neutral-100 dark:bg-neutral-800 text-neutral-500";
}

function getNetBalanceClass(net: number): string {
  if (net > 0) return "text-success-600 dark:text-success-400";
  if (net < 0) return "text-primary-600 dark:text-primary-400";
  return "text-text";
}

function PartyAvatar({ name, balance }: Readonly<{ name: string; balance: number }>) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const bg = getPartyAvatarBg(balance);
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${bg}`}>
      {initials}
    </div>
  );
}

function EmptyBook({ onAdd }: Readonly<{ onAdd: () => void }>) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-soft">
          <svg className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h11a3 3 0 013 3v10a3 3 0 01-3 3H6a2 2 0 00-2 2V6a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h5" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-success-500 flex items-center justify-center border-2 border-white dark:border-neutral-950">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
      <p className="text-xl font-bold text-text mb-2">Open your Udhar Book</p>
      <p className="text-sm text-muted max-w-xs leading-relaxed mb-8">
        Add a party — customer, supplier, or friend — and start tracking every credit and repayment.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-primary text-white font-semibold text-sm shadow-soft active:scale-[0.97] transition-transform"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add First Party
      </button>
    </div>
  );
}

export default function UdharBookPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [nameErr, setNameErr] = useState("");

  const { data: customers, isFetching } = useListLedgerCustomersQuery({ search: search || undefined });
  const [createCustomer, { isLoading: creating }] = useCreateLedgerCustomerMutation();

  const stats = useMemo(() => {
    if (!customers) return { owed: 0, owes: 0, settled: 0, net: 0 };
    let owed = 0, owes = 0, settled = 0;
    for (const c of customers) {
      const b = Number.parseFloat(c.balance);
      if (b > 0) owed += b;
      else if (b < 0) owes += Math.abs(b);
      else settled++;
    }
    return { owed, owes, settled, net: owed - owes };
  }, [customers]);

  const filtered = useMemo(() => {
    if (!customers) return [];
    return customers.filter((c) => {
      const b = Number.parseFloat(c.balance);
      if (filter === "credit") return b > 0;
      if (filter === "debit") return b < 0;
      if (filter === "settled") return b === 0;
      return true;
    });
  }, [customers, filter]);

  function resetAdd() { setShowAdd(false); setName(""); setMobile(""); setAddress(""); setNameErr(""); }

  function submitAdd() {
    if (!name.trim()) { setNameErr("Name is required"); return; }
    setNameErr("");
    createCustomer({ name: name.trim(), mobile: mobile.trim(), notes: address.trim() || undefined }).then((res) => {
      if ("data" in res && res.data) { resetAdd(); router.push(`/udhaarbook/${res.data.id}`); }
    });
  }

  const hasParties = customers && customers.length > 0;

  function renderList() {
    if (isFetching) return <SkeletonList count={5} />;
    if (!hasParties) return <EmptyBook onAdd={() => setShowAdd(true)} />;
    if (filtered.length === 0) return <p className="py-10 text-center text-sm text-muted">No parties match this filter.</p>;
    return (
      <div className="flex flex-col gap-2">
        {filtered.map((c) => {
          const bal = Number.parseFloat(c.balance);
          const isPos = bal > 0;
          const amtClass = isPos ? "text-success-600 dark:text-success-400" : "text-primary-600 dark:text-primary-400";
          const labelClass = isPos ? "text-success-500" : "text-primary-500";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/udhaarbook/${c.id}`)}
              className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-surface border border-border hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-card transition-all text-left w-full active:scale-[0.99]"
            >
              <PartyAvatar name={c.name} balance={bal} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text text-sm">{c.name}</p>
                <p className="text-xs text-muted mt-0.5">{relativeTime(c.updated_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {bal === 0 ? (
                  <span className="text-xs font-medium text-muted">Settled</span>
                ) : (
                  <>
                    <p className={`text-sm font-bold ${amtClass}`}>{fmt(Math.abs(bal))}</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mt-0.5 ${labelClass}`}>
                      {isPos ? "will give" : "you will give"}
                    </p>
                  </>
                )}
              </div>
              <svg className="w-3.5 h-3.5 text-border group-hover:text-muted flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Screen title="Udhar Book">
      {/* ── Search — always at the top ── */}
      <div className="mb-3 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input placeholder="Search parties…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* ── Filter chips ── */}
      {hasParties && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f.value
                  ? "bg-primary-500 border-primary-500 text-white shadow-soft"
                  : "bg-surface border-border text-muted hover:border-primary-300 hover:text-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Overview panel — below search/filters ── */}
      {hasParties && (
        <div className="mb-5 app-panel overflow-hidden">
          {/* Net row */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">Net Balance</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tracking-tight ${getNetBalanceClass(stats.net)}`}>
                {stats.net === 0 ? "₹0" : fmt(Math.abs(stats.net))}
              </span>
              {stats.net !== 0 && (
                <span className={`text-sm font-semibold ${stats.net > 0 ? "text-success-500" : "text-primary-500"}`}>
                  {stats.net > 0 ? "will get" : "will give"}
                </span>
              )}
            </div>
          </div>

          {/* Two counters */}
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-success-600 dark:text-success-400 mb-1">Will Get</p>
              <p className="text-lg font-bold text-success-700 dark:text-success-300">{fmt(stats.owed)}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-1">Will Give</p>
              <p className="text-lg font-bold text-primary-700 dark:text-primary-300">{fmt(stats.owes)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {renderList()}

      {/* ── FAB ── */}
      <div className="fixed bottom-[4.75rem] lg:bottom-8 right-4 z-20">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-primary text-white font-bold text-sm shadow-soft active:scale-[0.96] transition-transform"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Party
        </button>
      </div>

      {/* ── Add party drawer ── */}
      <Drawer
        open={showAdd}
        onClose={resetAdd}
        title="Add Party"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={resetAdd}>Cancel</Button>
            <Button fullWidth onClick={submitAdd} disabled={creating}>
              {creating ? "Saving…" : "Save Party"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={nameErr} placeholder="e.g. Ramesh Kumar" autoFocus />
          <Input label="Mobile (optional)" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit number" type="tel" />
          <Textarea
            label="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, state…"
            rows={3}
          />
        </div>
      </Drawer>
    </Screen>
  );
}
