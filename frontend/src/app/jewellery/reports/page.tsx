"use client";

import Link from "next/link";
import { memo, useCallback, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ROUTES } from "@/lib/routes";
import { useListInvoicesQuery, type JwlInvoice } from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function invoiceTypeVariant(type: string): "primary" | "neutral" | "warning" {
  if (type === "TAX_INVOICE") return "primary";
  if (type === "CREDIT_NOTE") return "warning";
  return "neutral";
}

function invoiceStatusVariant(status: string): "success" | "danger" | "neutral" | "warning" {
  if (status === "ISSUED") return "success";
  if (status === "CANCELLED") return "danger";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

function friendlyType(type: string): string {
  if (type === "TAX_INVOICE") return "Tax Invoice";
  if (type === "CREDIT_NOTE") return "Credit Note";
  if (type === "ESTIMATE") return "Estimate";
  return type;
}

// ─── Sales Register Table ─────────────────────────────────────────────────────

const SalesRegisterTable = memo(function SalesRegisterTable({ invoices }: { invoices: JwlInvoice[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm" data-testid="sales-register-table">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-2 py-2">Voucher No</th>
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Customer</th>
            <th className="px-2 py-2">Taxable</th>
            <th className="px-2 py-2">GST</th>
            <th className="px-2 py-2">Total</th>
            <th className="px-2 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const gstTotal =
              parseFloat(inv.cgst || "0") +
              parseFloat(inv.sgst || "0") +
              parseFloat(inv.igst || "0");
            return (
              <tr key={inv.id} className="border-b border-border/70 last:border-0">
                <td className="px-2 py-2 font-medium text-text">{inv.voucher_no || "—"}</td>
                <td className="px-2 py-2">{inv.voucher_date || "—"}</td>
                <td className="px-2 py-2">
                  <Badge variant={invoiceTypeVariant(inv.invoice_type)}>
                    {friendlyType(inv.invoice_type)}
                  </Badge>
                </td>
                <td className="px-2 py-2">{inv.customer_name || "—"}</td>
                <td className="px-2 py-2">{formatINRCurrency(inv.taxable_amount)}</td>
                <td className="px-2 py-2">{formatINRCurrency(gstTotal)}</td>
                <td className="px-2 py-2">{formatINRCurrency(inv.total_amount)}</td>
                <td className="px-2 py-2">
                  <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

// ─── GST Filing Cards ─────────────────────────────────────────────────────────

interface GstFilingCardProps {
  title: string;
  description: string;
  href: string;
  tag?: string;
}

function GstFilingCard({ title, description, href, tag }: GstFilingCardProps) {
  return (
    <Link
      href={href}
      className="app-panel flex flex-col gap-2 p-5 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer"
      data-testid={`gst-card-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-text">{title}</span>
        {tag && <Badge variant="primary">{tag}</Badge>}
      </div>
      <p className="text-xs text-muted leading-relaxed">{description}</p>
    </Link>
  );
}

// ─── Sales Register Section ───────────────────────────────────────────────────

function SalesRegisterSection() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [queryParams, setQueryParams] = useState<{ from?: string; to?: string; page_size: number } | null>(null);

  const { data, isLoading, isFetching, error } = useListInvoicesQuery(
    { from: queryParams?.from, to: queryParams?.to, page: 1 },
    { skip: !loaded || !queryParams },
  );

  const invoices = data?.results ?? [];
  const isWorking = isLoading || isFetching;

  const handleLoad = useCallback(() => {
    setQueryParams({ from: dateFrom || undefined, to: dateTo || undefined, page_size: 50 });
    setLoaded(true);
  }, [dateFrom, dateTo]);

  return (
    <div className="space-y-3">
      <div className="app-panel p-4 grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs text-muted">Date From</span>
          <input
            type="date"
            aria-label="Date From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Date To</span>
          <input
            type="date"
            aria-label="Date To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-end">
          <Button
            onClick={handleLoad}
            data-testid="sales-register-load"
            size="sm"
          >
            Load
          </Button>
        </div>
      </div>

      {!loaded && (
        <EmptyState
          title="Select a date range"
          description="Choose a date range above and click Load to view the sales register."
        />
      )}

      {loaded && isWorking && <SkeletonList count={5} />}

      {loaded && !isWorking && error && (
        <EmptyState
          title="Could not load invoices"
          description="There was an error fetching the sales register. Please try again."
        />
      )}

      {loaded && !isWorking && !error && invoices.length === 0 && (
        <EmptyState
          title="No invoices found"
          description="No invoices were found for the selected date range."
        />
      )}

      {loaded && !isWorking && !error && invoices.length > 0 && (
        <div className="app-panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-text">
              {data?.count ?? invoices.length} invoice{(data?.count ?? invoices.length) !== 1 ? "s" : ""}
            </span>
            <Badge variant="neutral">{invoices.length} shown</Badge>
          </div>
          <SalesRegisterTable invoices={invoices} />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JewelleryReportsPage() {
  return (
    <Screen
      title="Reports"
      subtitle="Access GST filings and the sales register for your jewellery business."
    >
      <div className="space-y-8">
        {/* Section A — GST Filings */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            GST Filings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <GstFilingCard
              title="GSTR-1"
              description="Section-wise invoice preview + CSV export"
              href={ROUTES.app.jewellery.gstReports}
            />
            <GstFilingCard
              title="GSTR-3B"
              description="Net tax summary with outward supplies + ITC"
              href={ROUTES.app.jewellery.gstReports}
              tag="Summary"
            />
          </div>
        </section>

        {/* Section B — Sales Register */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Sales Register
          </h2>
          <SalesRegisterSection />
        </section>
      </div>
    </Screen>
  );
}
