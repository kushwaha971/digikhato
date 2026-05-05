"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Screen } from "@/components/layout/Screen";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import {
  useGetLedgerCustomerQuery,
  useListLedgerTransactionsQuery,
  useAddLedgerCreditMutation,
  useAddLedgerPaymentMutation,
  useDeleteLedgerCustomerMutation,
} from "@/features/customer_ledger/customer-ledger-api";

/* ─── helpers ─── */
function fmt(val: string | number) {
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function getBalanceLabel(balance: number, isPos: boolean): string {
  if (balance === 0) return "Settled";
  return isPos ? "Will Get" : "Will Give";
}

function getRunningBalanceClass(balance: number): string {
  if (balance > 0) return "text-success-600 dark:text-success-400";
  if (balance < 0) return "text-primary-600 dark:text-primary-400";
  return "text-muted";
}

function getBannerBg(isPos: boolean, isNeg: boolean): string {
  if (isPos) return "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800";
  if (isNeg) return "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800";
  return "bg-neutral-50 dark:bg-neutral-800/40 border-border";
}

function getBalanceLabelColor(isPos: boolean, isNeg: boolean): string {
  if (isPos) return "text-success-600 dark:text-success-400";
  if (isNeg) return "text-primary-600 dark:text-primary-400";
  return "text-muted";
}

function getBalanceValueColor(isPos: boolean, isNeg: boolean): string {
  if (isPos) return "text-success-700 dark:text-success-300";
  if (isNeg) return "text-primary-700 dark:text-primary-300";
  return "text-text";
}

type TxMode = "credit" | "payment";
interface TxForm { amount: string; date: string; notes: string; }

interface EnrichedTx {
  id: number;
  tx_type: "credit" | "payment";
  amount: string;
  date: string;
  notes: string;
  created_at: string;
  balanceAfter: number;
}

function groupByDate(txs: EnrichedTx[]): Array<{ date: string; items: EnrichedTx[] }> {
  const groups = new Map<string, EnrichedTx[]>();
  for (const tx of txs) {
    const existing = groups.get(tx.date);
    if (existing) { existing.push(tx); } else { groups.set(tx.date, [tx]); }
  }
  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
}

/* ─── Avatar ─── */
function Avatar({ name, size = "lg" }: Readonly<{ name: string; size?: "sm" | "lg" }>) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const dim = size === "lg" ? "w-14 h-14 text-xl" : "w-9 h-9 text-sm";
  return (
    <div className={`${dim} rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0 shadow-soft`}>
      {initials}
    </div>
  );
}

/* ─── Transaction card ─── */
function TxCard({ tx }: Readonly<{ tx: EnrichedTx }>) {
  const isCredit = tx.tx_type === "credit";
  const chipClass = isCredit
    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400"
    : "bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400";
  const amountClass = isCredit
    ? "text-primary-600 dark:text-primary-400"
    : "text-success-600 dark:text-success-400";
  const runningClass = getRunningBalanceClass(tx.balanceAfter);
  return (
    <div className={`relative pl-4 py-3.5 pr-3 rounded-xl border mb-2 overflow-hidden ${
      isCredit
        ? "border-primary-200 dark:border-primary-900 bg-primary-50/40 dark:bg-primary-900/10"
        : "border-success-200 dark:border-success-900 bg-success-50/40 dark:bg-success-900/10"
    }`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isCredit ? "bg-primary-400" : "bg-success-500"}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${chipClass}`}>
              {isCredit ? "Gave" : "Got Back"}
            </span>
            <p className={`text-base font-bold ${amountClass}`}>{fmt(tx.amount)}</p>
          </div>
          {tx.notes ? <p className="text-sm text-text mb-1 leading-snug">{tx.notes}</p> : null}
          <p className="text-[11px] text-muted">{fmtDate(`${tx.date}T00:00:00`)} · {fmtTime(tx.created_at)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Balance</p>
          <p className={`text-sm font-bold ${runningClass}`}>{fmt(tx.balanceAfter)}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Amount entry form (used inside drawer) ─── */
interface EntryFormProps {
  txMode: TxMode;
  form: TxForm;
  amountErr: string;
  partyName: string;
  onChange: (patch: Partial<TxForm>) => void;
}
function EntryForm({ txMode, form, amountErr, partyName, onChange }: Readonly<EntryFormProps>) {
  const isCredit = txMode === "credit";
  const tagClass = isCredit
    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
    : "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold truncate max-w-full ${tagClass}`}>
          {isCredit ? `You Gave ₹ to ${partyName}` : `Got Back ₹ from ${partyName}`}
        </span>
      </div>

      <Input
        label="Amount"
        id="tx-amount"
        type="number"
        prefix="₹"
        placeholder="0"
        value={form.amount}
        onChange={(e) => onChange({ amount: e.target.value })}
        autoFocus
        min="0"
        step="1"
        error={amountErr}
      />

      <Input
        label="Date"
        type="date"
        value={form.date}
        onChange={(e) => onChange({ date: e.target.value })}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tx-notes" className="text-sm font-medium text-text">
          Note <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="tx-notes"
          rows={2}
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="e.g. grocery, rent, medicine…"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
        />
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function UdharDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = Number(params.id);
  const router = useRouter();

  const { data: customer, isFetching: loadingCustomer } = useGetLedgerCustomerQuery(customerId);
  const { data: txData, isFetching: loadingTx } = useListLedgerTransactionsQuery(customerId);

  const [addCredit] = useAddLedgerCreditMutation();
  const [addPayment] = useAddLedgerPaymentMutation();
  const [deleteCustomer, { isLoading: deleting }] = useDeleteLedgerCustomerMutation();

  const [txMode, setTxMode] = useState<TxMode | null>(null);
  const [form, setForm] = useState<TxForm>({ amount: "", date: today(), notes: "" });
  const [amountErr, setAmountErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const enrichedTxs = useMemo<EnrichedTx[]>(() => {
    if (!txData || !customer) return [];
    let running = Number.parseFloat(customer.balance);
    return txData.results.map((tx) => {
      const after = running;
      const sign = tx.tx_type === "credit" ? 1 : -1;
      running -= sign * Number.parseFloat(tx.amount);
      return { ...tx, balanceAfter: after };
    });
  }, [txData, customer]);

  const grouped = useMemo(() => groupByDate(enrichedTxs), [enrichedTxs]);

  function openTx(mode: TxMode) {
    setTxMode(mode);
    setForm({ amount: "", date: today(), notes: "" });
    setAmountErr("");
  }

  function closeTx() { setTxMode(null); }

  async function submitTx() {
    const amt = Number.parseFloat(form.amount);
    if (!form.amount || Number.isNaN(amt) || amt <= 0) {
      setAmountErr("Enter a valid amount");
      return;
    }
    setAmountErr("");
    setSubmitting(true);
    const mutation = txMode === "credit" ? addCredit : addPayment;
    const res = await mutation({ customerId, amount: form.amount, date: form.date, notes: form.notes });
    setSubmitting(false);
    if ("data" in res) closeTx();
  }

  async function handleDelete() {
    const res = await deleteCustomer(customerId);
    if ("data" in res || !("error" in res)) router.push("/udhaarbook");
  }

  if (loadingCustomer) {
    return <Screen title="Udhar Book" backHref="/udhaarbook"><SkeletonList count={4} /></Screen>;
  }
  if (!customer) {
    return (
      <Screen title="Udhar Book" backHref="/udhaarbook">
        <div className="py-20 text-center text-muted text-sm">Party not found.</div>
      </Screen>
    );
  }

  const balance = Number.parseFloat(customer.balance);
  const isPos = balance > 0;
  const isNeg = balance < 0;

  const bannerBg = getBannerBg(isPos, isNeg);
  const balanceLabelColor = getBalanceLabelColor(isPos, isNeg);
  const balanceValueColor = getBalanceValueColor(isPos, isNeg);
  const balanceLabel = getBalanceLabel(balance, isPos);

  const drawerTitle = txMode === "credit" ? "You Gave ₹" : "Got Back ₹";

  return (
    <Screen title={customer.name} backHref="/udhaarbook">
      {/* ── Party + balance ── */}
      <div className={`rounded-2xl border p-5 mb-5 ${bannerBg}`}>
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={customer.name} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-lg leading-tight truncate">{customer.name}</p>
            {customer.mobile ? (
              <a
                href={`tel:${customer.mobile}`}
                className="inline-flex items-center gap-1.5 mt-1 text-sm text-primary-500 font-medium hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {customer.mobile}
              </a>
            ) : null}
          </div>
        </div>
        <div className="border-t border-current border-opacity-10 pt-4 flex items-end justify-between">
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${balanceLabelColor}`}>
              {balanceLabel}
            </p>
            <p className={`text-4xl font-bold tracking-tight ${balanceValueColor}`}>
              {balance === 0 ? "₹0" : fmt(Math.abs(balance))}
            </p>
          </div>
          {balance !== 0 && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              isPos
                ? "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400"
                : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
            }`}>
              {isPos ? `${customer.name} will give` : `You will give ${customer.name}`}
            </span>
          )}
        </div>
      </div>

      {/* ── History ── */}
      {loadingTx && <SkeletonList count={4} />}

      {!loadingTx && enrichedTxs.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text mb-1">No entries yet</p>
          <p className="text-xs text-muted">Use the buttons below to add the first entry.</p>
        </div>
      )}

      {!loadingTx && enrichedTxs.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="rounded-xl border border-primary-200 dark:border-primary-900 bg-primary-50/50 dark:bg-primary-900/10 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary-500 mb-0.5">Total Gave</p>
              <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{fmt(customer.credit_total)}</p>
            </div>
            <div className="rounded-xl border border-success-200 dark:border-success-900 bg-success-50/50 dark:bg-success-900/10 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-success-600 mb-0.5">Total Got Back</p>
              <p className="text-sm font-bold text-success-600 dark:text-success-400">{fmt(customer.payment_total)}</p>
            </div>
          </div>
          {grouped.map(({ date, items }) => (
            <div key={date} className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted px-2 py-1 rounded-full border border-border bg-surface">
                  {fmtDate(`${date}T00:00:00`)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {items.map((tx) => <TxCard key={tx.id} tx={tx} />)}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-5 border-t border-border text-center">
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="text-xs text-muted hover:text-danger-500 transition-colors"
        >
          Delete this party
        </button>
      </div>

      <div className="h-20 lg:h-16" />

      {/* ── Action bar: two direct buttons, NOT a full-width split ── */}
      <div className="fixed bottom-[4.75rem] lg:bottom-0 left-0 right-0 lg:left-[4rem] xl:left-[16rem] z-20 bg-surface/95 backdrop-blur-sm border-t border-border px-4 py-2">
        <div className="flex gap-2.5 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => openTx("credit")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold text-sm transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Gave ₹
          </button>
          <button
            type="button"
            onClick={() => openTx("payment")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-success-500 text-success-600 dark:text-success-400 font-bold text-sm hover:bg-success-50 dark:hover:bg-success-900/20 active:bg-success-100 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
            Got Back ₹
          </button>
        </div>
      </div>

      {/* ── Entry drawer ── */}
      <Drawer
        open={txMode !== null}
        onClose={closeTx}
        title={drawerTitle}
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={closeTx}>Cancel</Button>
            <Button fullWidth onClick={submitTx} disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        {txMode !== null && (
          <EntryForm
            txMode={txMode}
            form={form}
            amountErr={amountErr}
            partyName={customer.name}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Party"
        description={`Remove ${customer.name} and all their entries? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </Screen>
  );
}
