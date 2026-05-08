"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { InvoiceFormContent } from "@/components/jewellery/billing/InvoiceFormContent";
import { PrintTemplatesView } from "@/components/jewellery/billing/PrintTemplatesView";
import { SplitPaymentView } from "@/components/jewellery/billing/SplitPaymentView";
import { CustomerSearchSelect } from "@/components/jewellery/shared/CustomerSearchSelect";
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
import { INVOICE_STATUS_OPTIONS, invoiceStatusVariant } from "@/constants/jewellery";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { ROUTES } from "@/lib/routes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { InvoiceStatus, InvoiceType, JwlInvoice } from "@/store/jewellery-api";
import { useGenerateEInvoiceMutation, useGetAdminFeatureFlagsQuery, useListInvoicesQuery } from "@/store/jewellery-api";
import { setBillingFilters, resetBillingFilters } from "@/store/jewellery-filters-slice";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

const PLACEHOLDER_VIEWS = new Set(["messages-placeholder"]);

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
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.jewelleryFilters.billing);
  const { search, status, customerId, dateFrom, dateTo, ordering, page } = filters;

  // Draft state — edited in filter panel, committed on Apply
  const [draftStatus, setDraftStatus] = useState<InvoiceStatus | "">(status as InvoiceStatus | "");
  const [draftCustomer, setDraftCustomer] = useState(customerId);
  const [draftFromDate, setDraftFromDate] = useState(dateFrom);
  const [draftToDate, setDraftToDate] = useState(dateTo);
  const [draftOrdering, setDraftOrdering] = useState<"-voucher_date" | "voucher_date">(ordering as "-voucher_date" | "voucher_date");

  const debouncedSearch = useDebounce(search, 300);

  const typeFilter: InvoiceType | undefined = view === "estimate"
    ? "ESTIMATE"
    : view === "sale-return"
      ? "CREDIT_NOTE"
      : undefined;

  const { data, isFetching } = useListInvoicesQuery({
    page,
    type: typeFilter,
    status: (status || undefined) as InvoiceStatus | undefined,
    customer: customerId || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    search: debouncedSearch.trim() || undefined,
    ordering: ordering as "-voucher_date" | "voucher_date" | "-created_at" | "created_at" | undefined,
  });

  const loadMore = useCallback(() => dispatch(setBillingFilters({ page: page + 1 })), [dispatch, page]);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlInvoice>(data, isFetching, page, loadMore);

  const hasFilters = useMemo(
    () => Boolean(search || status || customerId || dateFrom || dateTo),
    [search, status, customerId, dateFrom, dateTo],
  );

  const resetFilters = () => {
    dispatch(resetBillingFilters());
    setDraftStatus("");
    setDraftCustomer("");
    setDraftFromDate("");
    setDraftToDate("");
    setDraftOrdering("-voucher_date");
  };

  const applyFilters = () => {
    dispatch(setBillingFilters({
      status: draftStatus,
      customerId: draftCustomer,
      dateFrom: draftFromDate,
      dateTo: draftToDate,
      ordering: draftOrdering,
      page: 1,
    }));
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
            hasActiveFilters={Boolean(status || customerId || dateFrom || dateTo)}
            onApply={applyFilters}
            onReset={resetFilters}
          >
            <FilterSelect
              label="Status"
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value as InvoiceStatus | "")}
            >
              {INVOICE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </FilterSelect>

            <CustomerSearchSelect
              value={draftCustomer}
              onChange={(id) => setDraftCustomer(id)}
              label="Customer"
              showSelectedName={true}
            />

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

            <FilterSelect
              label="Date order"
              value={draftOrdering}
              onChange={(e) => setDraftOrdering(e.target.value as "-voucher_date" | "voucher_date")}
            >
              <option value="-voucher_date">Newest first</option>
              <option value="voucher_date">Oldest first</option>
            </FilterSelect>
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
            dispatch(setBillingFilters({ search: value, page: 1 }));
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
  const [generateEInvoice, eInvoiceState] = useGenerateEInvoiceMutation();
  const { data: adminControls } = useGetAdminFeatureFlagsQuery();
  const einvoiceApplicable = Boolean(adminControls?.einvoice_applicable);
  const [irnTarget, setIrnTarget] = useState<JwlInvoice | null>(null);
  const [irnAck, setIrnAck] = useState(false);

  const openIrnDisclaimer = (invoice: JwlInvoice) => {
    setIrnTarget(invoice);
    setIrnAck(false);
  };

  const confirmGenerateIrn = async () => {
    if (!irnTarget) return;
    try {
      await generateEInvoice(irnTarget.id).unwrap();
    } finally {
      setIrnTarget(null);
      setIrnAck(false);
    }
  };
  const messagesInvoices = useListInvoicesQuery(
    { page: 1, status: "ISSUED" },
    { skip: view !== "messages" },
  );
  const eInvoiceInvoices = useListInvoicesQuery(
    { page: 1, type: "TAX_INVOICE", status: "ISSUED" },
    { skip: view !== "einvoice" },
  );

  if (view === "tax-invoice" || view === "estimate" || view === "sale-return") {
    return (
      <>
        <InvoiceListPanel view={view} onOpenCreate={openCreateDrawer} />
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerTitle} size="2xl">
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
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerTitle} size="2xl">
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

  if (view === "split-payment") {
    return (
      <Screen
        title="Split payment modes"
        subtitle="Accept mixed tender modes and reconcile receipts against invoices."
        backHref={ROUTES.app.jewellery.billing}
      >
        <SplitPaymentView onCreateInvoice={() => openCreateDrawer("TAX_INVOICE")} />
      </Screen>
    );
  }

  if (view === "print") {
    return (
      <Screen
        title="Print templates"
        subtitle="Manage invoice print templates and export layout preferences."
        backHref={ROUTES.app.jewellery.billing}
      >
        <PrintTemplatesView onPrintInvoice={(id) => router.push(`/jewellery/billing/${id}`)} />
      </Screen>
    );
  }

  if (PLACEHOLDER_VIEWS.has(view)) {
    const config = BILLING_VIEW_CONFIG[view];
    return <ModulePlaceholder title={config.title} description={config.description} presetKey={config.title} />;
  }

  if (view === "messages") {
    return (
      <Screen
        title="WhatsApp / SMS send"
        subtitle="Open an issued invoice and send it via WhatsApp, SMS, or Email."
        backHref={ROUTES.app.jewellery.billing}
      >
        {messagesInvoices.isFetching ? <SkeletonList count={4} /> : null}
        <div className="space-y-3">
          {(messagesInvoices.data?.results ?? []).map((invoice) => (
            <div key={invoice.id} className="app-panel rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-text">{invoice.voucher_no || "Issued invoice"}</p>
                <p className="text-xs text-muted mt-1">{invoice.customer_name || "Walk-in"} · {formatINRCurrency(invoice.total_amount)}</p>
              </div>
              <Link href={`/jewellery/billing/${invoice.id}`}>
                <Button type="button" size="sm" className="min-h-11" variant="secondary">
                  Open share
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  if (view === "einvoice") {
    return (
      <Screen
        title="E-invoice (IRN+QR)"
        subtitle="Generate IRN and QR for issued tax invoices."
        backHref={ROUTES.app.jewellery.billing}
      >
        {!einvoiceApplicable ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-3">
            E-invoice is disabled for this branch. Enable it from Admin controls to generate IRN references.
          </div>
        ) : null}
        {eInvoiceInvoices.isFetching ? <SkeletonList count={4} /> : null}
        <div className="space-y-3">
          {(eInvoiceInvoices.data?.results ?? []).map((invoice) => (
            <div key={invoice.id} className="app-panel rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-text">{invoice.voucher_no || "Issued invoice"}</p>
                <p className="text-xs text-muted mt-1">
                  {invoice.customer_name || "Walk-in"} · {invoice.e_invoice_irn ? "IRN generated" : "IRN pending"}
                </p>
                <p className="text-[11px] text-muted mt-1">
                  {invoice.customer_gstin ? "B2B invoice" : "B2C invoice"}
                </p>
                {invoice.e_invoice_irn ? (
                  <p className="text-[11px] text-muted mt-1 break-all">IRN: {invoice.e_invoice_irn}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {!invoice.e_invoice_irn && invoice.customer_gstin && einvoiceApplicable ? (
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-11"
                    onClick={() => openIrnDisclaimer(invoice)}
                    loading={eInvoiceState.isLoading}
                  >
                    Generate IRN
                  </Button>
                ) : null}
                <Link href={`/jewellery/billing/${invoice.id}`}>
                  <Button type="button" size="sm" className="min-h-11" variant="secondary">
                    Open invoice
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <Drawer
          open={Boolean(irnTarget)}
          onClose={() => setIrnTarget(null)}
          title="Generate Reference IRN"
          size="md"
          footer={(
            <>
              <Button type="button" size="sm" variant="secondary" onClick={() => setIrnTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void confirmGenerateIrn()}
                loading={eInvoiceState.isLoading}
                disabled={!irnAck}
              >
                Generate IRN
              </Button>
            </>
          )}
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">For internal use only</p>
              <p>
                This IRN is generated locally and is not submitted to GSTN/IRP. It is not a legally valid e-invoice IRN.
              </p>
            </div>
            <label className="inline-flex items-start gap-2 text-sm text-text">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={irnAck}
                onChange={(e) => setIrnAck(e.target.checked)}
              />
              I understand this is a simulated IRN for internal reference only.
            </label>
          </div>
        </Drawer>
      </Screen>
    );
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
