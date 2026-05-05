"use client";

import Link from "next/link";
import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { InvoiceFormContent } from "@/components/jewellery/billing/InvoiceFormContent";
import { ModulePlaceholder } from "@/components/jewellery/shared/ModulePlaceholder";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FilterSelect,
  ResponsiveFilterPanel,
} from "@/components/ui/ResponsiveFilterPanel";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { ROUTES } from "@/lib/routes";
import type { InvoiceStatus, InvoiceType, JwlInvoice } from "@/store/jewellery-api";
import { useListInvoicesQuery } from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

const PLACEHOLDER_VIEWS = new Set(["einvoice", "split-payment", "print", "messages"]);

const BILLING_VIEW_CONFIG: Record<string, { title: string; description: string }> = {
  default: {
    title: "Tax invoice (GST)",
    description: "Create and manage B2C and B2B invoices with full GST compliance.",
  },
  "tax-invoice": {
    title: "Tax invoice (GST)",
    description: "Create and manage B2C and B2B invoices with full GST compliance.",
  },
  estimate: {
    title: "Estimate / Quotation",
    description: "Create estimates with no tax impact. Convert to invoice in one click.",
  },
  "sale-return": {
    title: "Sale return / credit note",
    description: "Record returns, issue credit notes, and adjust stock and tax impact.",
  },
  "old-gold": {
    title: "Old Gold Exchange",
    description: "Old-gold deductions and valuation with invoice issue flow.",
  },
  einvoice: {
    title: "E-invoice (IRN+QR)",
    description: "Generate IRN, QR, and compliance payloads for eligible invoices.",
  },
  "split-payment": {
    title: "Split payment modes",
    description: "Accept mixed tender modes and reconcile receipts against invoices.",
  },
  print: {
    title: "Print templates",
    description: "Manage invoice print templates and export layout preferences.",
  },
  messages: {
    title: "WhatsApp / SMS send",
    description: "Send invoice and payment links to customers via WhatsApp and SMS.",
  },
};

function invoiceStatusVariant(status: string): "success" | "danger" | "warning" {
  if (status === "ISSUED") return "success";
  if (status === "CANCELLED") return "danger";
  return "warning";
}

function InvoiceListCard({ invoice }: { invoice: JwlInvoice }) {
  return (
    <Link href={`/jewellery/billing/${invoice.id}`} className="block">
      <div className="app-panel p-4 card-clickable">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{invoice.voucher_no || "Draft"}</p>
            <p className="text-xs text-muted mt-0.5">
              {invoice.voucher_date ?? "No voucher date"}
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-primary-600">{invoice.invoice_type.replaceAll("_", " ")}</span>
            </p>
          </div>
          <Badge variant={invoiceStatusVariant(invoice.status)} className="shrink-0">
            {invoice.status}
          </Badge>
        </div>

        <p className="text-sm text-muted truncate">{invoice.customer_name || "Walk-in customer"}</p>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="text-sm font-bold text-text">{formatINRCurrency(invoice.total_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Balance</p>
            <p className="text-sm font-bold text-warning-700">{formatINRCurrency(invoice.balance_amount)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function InvoiceListPanel({
  view,
  onOpenCreate,
}: Readonly<{
  view: "tax-invoice" | "estimate" | "sale-return";
  onOpenCreate: (type: InvoiceType) => void;
}>) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [draftStatus, setDraftStatus] = useState<InvoiceStatus | "">(status);
  const [draftFromDate, setDraftFromDate] = useState(fromDate);
  const [draftToDate, setDraftToDate] = useState(toDate);

  const [page, setPage] = useState(1);
  const typeFilter: InvoiceType | undefined = view === "estimate"
    ? "ESTIMATE"
    : view === "sale-return"
      ? "CREDIT_NOTE"
      : undefined;

  const { data, isFetching } = useListInvoicesQuery({
    page,
    type: typeFilter,
    status: status || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    search: search.trim() || undefined,
  });

  const loadMore = useCallback(() => setPage((prev) => prev + 1), []);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlInvoice>(data, isFetching, page, loadMore);

  const hasFilters = Boolean(status || fromDate || toDate || search.trim());

  const resetFilters = () => {
    setStatus("");
    setFromDate("");
    setToDate("");
    setDraftStatus("");
    setDraftFromDate("");
    setDraftToDate("");
    setPage(1);
  };

  const applyFilters = () => {
    setStatus(draftStatus);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setPage(1);
  };

  const isCreditNoteView = view === "sale-return";

  return (
    <Screen
      title={isCreditNoteView ? "Sale return / credit note" : view === "estimate" ? "Estimate / Quotation" : "Tax invoice (GST)"}
      subtitle={
        isCreditNoteView
          ? "Create return credit notes and track return settlements"
          : view === "estimate"
            ? "Draft and track customer estimates"
            : "Create, issue, and monitor sales invoices"
      }
      backHref={ROUTES.app.jewellery.dashboard}
      actions={(
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ResponsiveFilterPanel
            title="Filter invoices"
            hasActiveFilters={Boolean(status || fromDate || toDate)}
            onApply={applyFilters}
            onReset={resetFilters}
          >
            <FilterSelect
              label="Status"
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value as InvoiceStatus | "")}
            >
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="CANCELLED">Cancelled</option>
            </FilterSelect>

            <div className="grid grid-cols-1 gap-2">
              <DatePicker
                name="from_date"
                label="From date"
                value={draftFromDate}
                onChange={(event) => setDraftFromDate(event.target.value)}
                placeholder="From date"
              />
              <DatePicker
                name="to_date"
                label="To date"
                value={draftToDate}
                onChange={(event) => setDraftToDate(event.target.value)}
                placeholder="To date"
              />
            </div>
          </ResponsiveFilterPanel>

          <Button
            onClick={() => onOpenCreate(isCreditNoteView ? "CREDIT_NOTE" : view === "estimate" ? "ESTIMATE" : "TAX_INVOICE")}
          >
            {isCreditNoteView ? "New credit note" : "New invoice"}
          </Button>
        </div>
      )}
    >
      <div className="space-y-3 mb-4">
        <StickyGlobalSearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by customer, mobile, or voucher"
          sticky={false}
        />
        {hasFilters ? <p className="text-xs text-muted">Filters applied</p> : null}
      </div>

      {isFetching && page === 1 && <SkeletonList count={4} />}

      {!isFetching && items.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description={hasFilters ? "No records match your current filters." : isCreditNoteView ? "Create your first credit note to record a return." : "Create your first invoice to start billing."}
          action={{
            label: isCreditNoteView ? "New credit note" : "New invoice",
            onClick: () => onOpenCreate(isCreditNoteView ? "CREDIT_NOTE" : view === "estimate" ? "ESTIMATE" : "TAX_INVOICE"),
          }}
        />
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="space-y-3">
            {items.map((invoice) => (
              <InvoiceListCard key={invoice.id} invoice={invoice} />
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
    </Screen>
  );
}

function BillingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawView = searchParams.get("view") ?? "tax-invoice";
  const view = rawView in BILLING_VIEW_CONFIG ? rawView : "tax-invoice";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<InvoiceType>("TAX_INVOICE");
  const [drawerSeedOldGold, setDrawerSeedOldGold] = useState(false);

  const openCreateDrawer = (type: InvoiceType, seedOldGold = false) => {
    setDrawerType(type);
    setDrawerSeedOldGold(seedOldGold);
    setDrawerOpen(true);
  };

  const drawerTitle = drawerType === "CREDIT_NOTE" ? "New Credit Note" : drawerType === "ESTIMATE" ? "New Estimate" : "New Invoice";

  if (view === "tax-invoice" || view === "estimate" || view === "sale-return") {
    return (
      <>
        <InvoiceListPanel view={view} onOpenCreate={openCreateDrawer} />
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerTitle}>
          <InvoiceFormContent
            initialInvoiceType={drawerType}
            seedOldGold={drawerSeedOldGold}
            onCancel={() => setDrawerOpen(false)}
            onSuccess={(invoice) => {
              setDrawerOpen(false);
              router.push(`/jewellery/billing/${invoice.id}`);
            }}
          />
        </Drawer>
      </>
    );
  }

  if (view === "old-gold") {
    return (
      <>
        <Screen
          title="Old Gold Exchange"
          subtitle="Use the old-gold invoice flow to add valuation deductions and issue bill."
          backHref={ROUTES.app.jewellery.billing}
        >
          <div className="app-panel rounded-2xl p-5 text-sm text-muted space-y-3">
            <p>Start from the old-gold billing form to add exchange entries and auto deduction calculations.</p>
            <Button onClick={() => openCreateDrawer("TAX_INVOICE", true)}>
              Open old-gold invoice drawer
            </Button>
          </div>
        </Screen>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerTitle}>
          <InvoiceFormContent
            initialInvoiceType={drawerType}
            seedOldGold={drawerSeedOldGold}
            onCancel={() => setDrawerOpen(false)}
            onSuccess={(invoice) => {
              setDrawerOpen(false);
              router.push(`/jewellery/billing/${invoice.id}`);
            }}
          />
        </Drawer>
      </>
    );
  }

  if (PLACEHOLDER_VIEWS.has(view)) {
    const config = BILLING_VIEW_CONFIG[view];
    return <ModulePlaceholder title={config.title} description={config.description} presetKey={config.title} />;
  }

  const fallback = BILLING_VIEW_CONFIG.default;
  return <ModulePlaceholder title={fallback.title} description={fallback.description} presetKey={fallback.title} />;
}

export default function JewelleryBillingPage() {
  return (
    <Suspense fallback={<Screen title="Billing" subtitle="Loading...">{null}</Screen>}>
      <BillingPageInner />
    </Suspense>
  );
}
