"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { PaymentMode } from "@/store/jewellery-api";
import { useListInvoicesQuery } from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";
import {
  PAYMENT_MODE_LABELS,
  PAYMENT_MODE_ICONS,
  SPLIT_PAYMENT_MODE_FILTERS,
} from "@/constants/jewellery";

export interface SplitPaymentViewProps {
  onCreateInvoice: () => void;
}

type ModeFilter = PaymentMode | "ALL";

export function SplitPaymentView({ onCreateInvoice }: SplitPaymentViewProps) {
  const [activeMode, setActiveMode] = useState<ModeFilter>("ALL");

  const { data, isFetching } = useListInvoicesQuery({ page: 1, status: "ISSUED" });
  const invoices = data?.results ?? [];

  const filteredInvoices = activeMode === "ALL"
    ? invoices
    : invoices.filter((invoice) =>
        invoice.payments.some((payment) => payment.mode === activeMode),
      );

  // Build summary counts per mode
  const modeCounts = (["CASH", "UPI", "CARD", "BANK"] as PaymentMode[]).map((mode) => ({
    mode,
    count: invoices.filter((inv) => inv.payments.some((p) => p.mode === mode)).length,
  }));

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="app-panel rounded-2xl p-4 text-sm text-muted">
        <p className="font-semibold text-text mb-1">About split payment</p>
        <p>
          Split payment lets you accept multiple tender modes per invoice. Select any mode below to
          view recent invoices paid with that method.
        </p>
      </div>

      {/* Summary cards */}
      <div>
        <h2 className="text-base font-semibold text-text mb-3">Payment mode breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {modeCounts.map(({ mode, count }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveMode(activeMode === mode ? "ALL" : mode)}
              className={[
                "app-panel rounded-2xl p-4 text-left transition-all",
                activeMode === mode
                  ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "card-clickable",
              ].join(" ")}
            >
              <span className="text-2xl">{PAYMENT_MODE_ICONS[mode]}</span>
              <p className="font-semibold text-text mt-2">{PAYMENT_MODE_LABELS[mode]}</p>
              <p className="text-xs text-muted mt-0.5">
                {count} {count === 1 ? "invoice" : "invoices"}
              </p>
              <p className="text-[11px] text-muted mt-0.5">This period</p>
            </button>
          ))}
        </div>
      </div>

      {/* Mode filter pills */}
      <div>
        <p className="text-sm font-semibold text-text mb-2">Filter by payment mode</p>
        <div className="flex flex-wrap gap-2">
          {SPLIT_PAYMENT_MODE_FILTERS.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveMode(mode)}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                activeMode === mode
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-surface border-border text-muted hover:border-primary-400",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list */}
      <div>
        <h2 className="text-base font-semibold text-text mb-3">
          {activeMode === "ALL" ? "Issued invoices" : `${PAYMENT_MODE_LABELS[activeMode]} invoices`}
        </h2>

        {isFetching ? <SkeletonList count={4} /> : null}

        {!isFetching && filteredInvoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              activeMode === "ALL"
                ? "No issued invoices yet."
                : `No issued invoices have a ${PAYMENT_MODE_LABELS[activeMode]} payment row.`
            }
            action={{
              label: "Create invoice with split payment",
              onClick: onCreateInvoice,
            }}
          />
        ) : null}

        {filteredInvoices.length > 0 ? (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="app-panel rounded-2xl p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text truncate">
                      {invoice.voucher_no || "Draft"}
                    </p>
                    <Badge variant="success">ISSUED</Badge>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {invoice.customer_name || "Walk-in customer"}
                    <span className="mx-1.5">·</span>
                    {invoice.voucher_date ?? "No date"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                    <div>
                      <p className="text-muted">Total</p>
                      <p className="font-bold text-text">{formatINRCurrency(invoice.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted">Paid</p>
                      <p className="font-bold text-text">{formatINRCurrency(invoice.paid_amount)}</p>
                    </div>
                  </div>
                  {invoice.payments.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {invoice.payments.map((payment) => (
                        <span
                          key={payment.id}
                          className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300"
                        >
                          {PAYMENT_MODE_ICONS[payment.mode] ?? ""}{" "}
                          {payment.mode} {formatINRCurrency(payment.amount)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Link href={`/jewellery/billing/${invoice.id}`} className="shrink-0">
                  <Button type="button" size="sm" className="min-h-11" variant="secondary">
                    View invoice
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* How to use */}
      <div className="app-panel rounded-2xl p-4 border border-border text-sm space-y-3">
        <p className="font-semibold text-text">How to record a split payment</p>
        <p className="text-muted">
          To record a split payment, create or edit an invoice and use the Payment split section to
          add multiple payment rows with different modes.
        </p>
        <Button type="button" onClick={onCreateInvoice}>
          Create invoice with split payment
        </Button>
      </div>
    </div>
  );
}
