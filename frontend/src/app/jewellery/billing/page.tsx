import { ModulePlaceholder } from "@/components/jewellery/shared/ModulePlaceholder";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
    description: "Feature interface for old-gold exchange and valuation adjustments.",
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

export default async function JewelleryBillingPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawView = params.view;
  const view = typeof rawView === "string" ? rawView : Array.isArray(rawView) ? rawView[0] : "tax-invoice";
  const config = BILLING_VIEW_CONFIG[view] ?? BILLING_VIEW_CONFIG.default;

  return <ModulePlaceholder title={config.title} description={config.description} presetKey={config.title} />;
}
