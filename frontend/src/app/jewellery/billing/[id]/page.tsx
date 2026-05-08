"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

import { InvoiceFormContent } from "@/components/jewellery/billing/InvoiceFormContent";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCancelInvoiceMutation,
  useConvertToInvoiceMutation,
  useGenerateEInvoiceMutation,
  useGetInvoiceQuery,
  useLazyGetInvoicePdfQuery,
  useIssueInvoiceMutation,
  useSendInvoiceMutation,
} from "@/store/jewellery-api";
import { invoiceStatusVariant } from "@/constants/jewellery";
import { ROUTES } from "@/lib/routes";
import { formatINRCurrency } from "@/utils/jewellery/formulas";
import { useAppSelector } from "@/store/hooks";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceId = String(params.id);
  const { data: invoice, isLoading } = useGetInvoiceQuery(invoiceId);
  const [issueInvoice, issueState] = useIssueInvoiceMutation();
  const [cancelInvoice, cancelState] = useCancelInvoiceMutation();
  const [convertToInvoice, convertState] = useConvertToInvoiceMutation();
  const [fetchInvoicePdf, pdfState] = useLazyGetInvoicePdfQuery();
  const [sendInvoice, sendState] = useSendInvoiceMutation();
  const [generateEInvoice, eInvoiceState] = useGenerateEInvoiceMutation();

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const canCancel = useMemo(() => {
    const jwlRoles = new Set(
      (currentUser?.module_roles ?? [])
        .filter((role) => role.module === "jewellery" && role.is_active)
        .map((role) => role.role_code),
    );
    return jwlRoles.has("jwl_admin") || jwlRoles.has("jwl_manager") || currentUser?.role === "admin";
  }, [currentUser]);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [creditNoteDrawerOpen, setCreditNoteDrawerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareChannel, setShareChannel] = useState<"WA" | "SMS" | "EMAIL">("WA");
  const [shareTo, setShareTo] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [irnDisclaimerOpen, setIrnDisclaimerOpen] = useState(false);
  const [irnAcknowledged, setIrnAcknowledged] = useState(false);

  const handleIssue = async () => {
    if (!invoice) return;
    await issueInvoice(invoice.id).unwrap();
  };

  const handleCancel = async () => {
    if (!invoice) return;
    await cancelInvoice({ id: invoice.id, reason: cancelReason.trim() }).unwrap();
    setCancelOpen(false);
    setCancelReason("");
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    const blob = await fetchInvoicePdf(invoice.id).unwrap();
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${invoice.voucher_no || "invoice-draft"}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  };

  const handleGenerateEInvoice = async () => {
    if (!invoice) return;
    await generateEInvoice(invoice.id).unwrap();
    setIrnDisclaimerOpen(false);
    setIrnAcknowledged(false);
  };

  const openIrnDisclaimer = () => {
    setIrnAcknowledged(false);
    setIrnDisclaimerOpen(true);
  };

  const handleConvertToInvoice = async () => {
    if (!invoice) return;
    try {
      const created = await convertToInvoice(invoice.id).unwrap();
      router.push(`/jewellery/billing/${created.id}`);
    } catch {
      // error surfaced by RTK
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    setShareError(null);
    if (!shareTo.trim()) {
      setShareError("Recipient is required.");
      return;
    }
    try {
      const payload = await sendInvoice({ id: invoice.id, channel: shareChannel, to: shareTo.trim() }).unwrap();
      window.open(payload.share_url, "_blank", "noopener,noreferrer");
      setShareOpen(false);
    } catch {
      setShareError("Could not prepare share link. Verify recipient and try again.");
    }
  };

  const handlePrint = () => {
    if (!invoice) return;
    const token = window.localStorage.getItem("accessToken");
    const target = `${window.location.origin}/api/jwl/v1/sales/invoices/${invoice.id}/pdf/`;
    if (!token) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
    fetch(target, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const printWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
        if (printWindow) {
          printWindow.focus();
        }
      })
      .catch(() => {
        // Keep UI stable if popup or network fails.
      });
  };

  // "More" menu items — must be declared before early return (Rules of Hooks)
  const moreItems = useMemo(() => {
    if (!invoice) return [];
    const items: Array<{ label: string; onClick: () => void; loading?: boolean; danger?: boolean }> = [];
    if (invoice.status === "ISSUED") {
      items.push(
        { label: "Print", onClick: handlePrint },
        { label: "Download PDF", onClick: handleDownloadPdf, loading: pdfState.isFetching },
        { label: "Share", onClick: () => { setShareError(null); setShareTo(""); setShareOpen(true); } },
      );
    }
    if (
      invoice.status === "ISSUED"
      && invoice.invoice_type === "TAX_INVOICE"
      && Boolean(invoice.customer_gstin?.trim())
      && !invoice.e_invoice_irn
    ) {
      items.push({ label: "Generate IRN", onClick: openIrnDisclaimer, loading: eInvoiceState.isLoading });
    }
    if (invoice.status === "ISSUED" && invoice.invoice_type !== "CREDIT_NOTE") {
      items.push({ label: "Create credit note", onClick: () => setCreditNoteDrawerOpen(true) });
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, pdfState.isFetching, eInvoiceState.isLoading]);

  if (isLoading || !invoice) {
    return (
      <Screen title="Invoice detail" subtitle="Loading invoice..." backHref={ROUTES.app.jewellery.billing}>
        {null}
      </Screen>
    );
  }

  const isB2BTaxInvoice = invoice.invoice_type === "TAX_INVOICE" && Boolean(invoice.customer_gstin?.trim());

  const actions = (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      {/* Primary actions — always visible */}
      {invoice.status === "DRAFT" ? (
        <Button type="button" size="sm" className="min-h-11" onClick={handleIssue} loading={issueState.isLoading}>
          Issue invoice
        </Button>
      ) : null}
      {invoice.invoice_type === "ESTIMATE" ? (
        <Button
          type="button"
          size="sm"
          className="min-h-11"
          onClick={handleConvertToInvoice}
          loading={convertState.isLoading}
        >
          Convert to invoice
        </Button>
      ) : null}
      {invoice.status === "ISSUED" && canCancel ? (
        <Button type="button" size="sm" className="min-h-11" variant="danger" onClick={() => setCancelOpen(true)}>
          Cancel
        </Button>
      ) : null}

      {/* More menu — secondary actions */}
      {moreItems.length > 0 ? (
        <div className="relative">
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            variant="secondary"
            onClick={() => setMoreOpen((prev) => !prev)}
          >
            More ▾
          </Button>
          {moreOpen ? (
            <>
              {/* backdrop to close on outside click */}
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
                {moreItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.loading}
                    onClick={() => { setMoreOpen(false); item.onClick(); }}
                    className={[
                      "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface2",
                      item.danger ? "text-danger-600" : "text-text",
                      item.loading ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {item.loading ? "Loading…" : item.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <Screen
      title={invoice.voucher_no || "Draft invoice"}
      subtitle={`Invoice type: ${invoice.invoice_type.replaceAll("_", " ")}`}
      backHref={ROUTES.app.jewellery.billing}
      actions={actions}
    >
      <div className="space-y-4">
        {invoice.e_invoice_is_simulated && invoice.e_invoice_irn && isB2BTaxInvoice ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 flex items-start gap-3">
            <span className="text-amber-600 dark:text-amber-400 text-lg leading-none mt-0.5">⚠</span>
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">IRN not submitted to GSTN</p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                The IRN on this invoice was generated locally for internal reference only. It has <strong>not</strong> been
                registered with the Government e-invoice portal. For B2B invoices above the threshold, you must submit
                via your GSP/IRP to obtain a valid IRN before sharing with the buyer.
              </p>
            </div>
          </div>
        ) : null}

        <section className="app-panel rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <div>
            <p className="text-muted">Status</p>
            <Badge variant={invoiceStatusVariant(invoice.status)} className="mt-1">
              {invoice.status}
            </Badge>
          </div>
          <div>
            <p className="text-muted">Customer</p>
            <p className="font-medium text-text mt-1">{invoice.customer_name || "Walk-in"}</p>
          </div>
          <div>
            <p className="text-muted">Voucher date</p>
            <p className="font-medium text-text mt-1">{invoice.voucher_date ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted">Branch</p>
            <p className="font-medium text-text mt-1">{invoice.branch_name || "-"}</p>
          </div>
          <div>
            <p className="text-muted">Reference invoice</p>
            <p className="font-medium text-text mt-1">{invoice.reference_invoice_no || "-"}</p>
          </div>
        </section>

        {invoice.e_invoice_irn ? (
          <section className={[
            "rounded-2xl p-4",
            invoice.e_invoice_is_simulated
              ? "border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700"
              : "app-panel",
          ].join(" ")}>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold text-text">E-invoice details</h2>
              {invoice.e_invoice_is_simulated ? (
                <Badge variant="warning">SIMULATED</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted">IRN</p>
            <p className="text-sm font-semibold text-text break-all">{invoice.e_invoice_irn}</p>
            {invoice.e_invoice_qr ? (
              <>
                <p className="text-sm text-muted mt-3">QR code</p>
                <div className="mt-1 inline-flex rounded-lg border border-border bg-surface p-2">
                  <QRCodeSVG value={invoice.e_invoice_qr} size={128} />
                </div>
                <p className="text-xs text-muted mt-2">Simulated payload shown for reference only.</p>
              </>
            ) : null}
          </section>
        ) : null}

        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Invoice lines</h2>
          </header>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface2 text-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Description</th>
                  <th className="px-4 py-2 text-left font-semibold">Metal/Purity</th>
                  <th className="px-4 py-2 text-left font-semibold">Net wt</th>
                  <th className="px-4 py-2 text-left font-semibold">Rate</th>
                  <th className="px-4 py-2 text-left font-semibold">GST</th>
                  <th className="px-4 py-2 text-left font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-t border-border">
                    <td className="px-4 py-2">{line.description || "-"}</td>
                    <td className="px-4 py-2">{line.metal_code} / {line.purity_code}</td>
                    <td className="px-4 py-2">{line.net_wt}</td>
                    <td className="px-4 py-2">{formatINRCurrency(line.rate_per_gram)}</td>
                    <td className="px-4 py-2">{formatINRCurrency(line.gst_amount)}</td>
                    <td className="px-4 py-2 font-semibold">{formatINRCurrency(line.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden p-4 space-y-3">
            {invoice.lines.map((line) => (
              <div key={line.id} className="rounded-xl border border-border bg-surface2/40 p-3">
                <p className="text-sm font-semibold text-text">{line.description || "-"}</p>
                <p className="text-xs text-muted mt-1">{line.metal_code} / {line.purity_code}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <p className="text-muted">Net wt</p>
                    <p className="font-semibold text-text">{line.net_wt} g</p>
                  </div>
                  <div>
                    <p className="text-muted">Rate</p>
                    <p className="font-semibold text-text">{formatINRCurrency(line.rate_per_gram)}</p>
                  </div>
                  <div>
                    <p className="text-muted">GST</p>
                    <p className="font-semibold text-text">{formatINRCurrency(line.gst_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Line total</p>
                    <p className="font-semibold text-text">{formatINRCurrency(line.line_total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="app-panel rounded-2xl overflow-hidden">
            <header className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-text">Payment split</h2>
            </header>
            <div className="p-4 text-sm space-y-2">
              {invoice.payments.length === 0 ? (
                <p className="text-muted">No payment rows saved.</p>
              ) : (
                invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <p className="text-text">{payment.mode}</p>
                    <p className="font-semibold text-text">{formatINRCurrency(payment.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="app-panel rounded-2xl overflow-hidden">
            <header className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-text">Invoice totals</h2>
            </header>
            <div className="p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted">Gross</span><span>{formatINRCurrency(invoice.gross_amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Discount</span><span>{formatINRCurrency(invoice.discount_amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Taxable</span><span>{formatINRCurrency(invoice.taxable_amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted">CGST</span><span>{formatINRCurrency(invoice.cgst)}</span></div>
              <div className="flex justify-between"><span className="text-muted">SGST</span><span>{formatINRCurrency(invoice.sgst)}</span></div>
              <div className="flex justify-between"><span className="text-muted">IGST</span><span>{formatINRCurrency(invoice.igst)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Round-off</span><span>{formatINRCurrency(invoice.round_off)}</span></div>
              <div className="pt-2 border-t border-border flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatINRCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>
        </section>

        {invoice.old_gold_purchases.length > 0 ? (
          <section className="app-panel rounded-2xl overflow-hidden">
            <header className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold text-text">Old-gold deductions</h2>
            </header>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface2 text-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                    <th className="px-4 py-2 text-left font-semibold">Gross wt</th>
                    <th className="px-4 py-2 text-left font-semibold">Purity</th>
                    <th className="px-4 py-2 text-left font-semibold">Rate</th>
                    <th className="px-4 py-2 text-left font-semibold">Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.old_gold_purchases.map((og) => (
                    <tr key={og.id} className="border-t border-border">
                      <td className="px-4 py-2">{og.description || og.metal_code}</td>
                      <td className="px-4 py-2">{og.gross_wt}</td>
                      <td className="px-4 py-2">{og.tested_purity}%</td>
                      <td className="px-4 py-2">{formatINRCurrency(og.buy_rate_per_gram)}</td>
                      <td className="px-4 py-2 font-semibold">{formatINRCurrency(og.deduction_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden p-4 space-y-3">
              {invoice.old_gold_purchases.map((og) => (
                <div key={og.id} className="rounded-xl border border-border bg-surface2/40 p-3">
                  <p className="text-sm font-semibold text-text">{og.description || og.metal_code}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <p className="text-muted">Gross wt</p>
                      <p className="font-semibold text-text">{og.gross_wt}</p>
                    </div>
                    <div>
                      <p className="text-muted">Purity</p>
                      <p className="font-semibold text-text">{og.tested_purity}%</p>
                    </div>
                    <div>
                      <p className="text-muted">Rate</p>
                      <p className="font-semibold text-text">{formatINRCurrency(og.buy_rate_per_gram)}</p>
                    </div>
                    <div>
                      <p className="text-muted">Deduction</p>
                      <p className="font-semibold text-text">{formatINRCurrency(og.deduction_value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel invoice"
        footer={(
          <>
            <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep invoice
            </Button>
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              variant="danger"
              onClick={handleCancel}
              loading={cancelState.isLoading}
              disabled={cancelReason.trim().length < 3}
            >
              Confirm cancel
            </Button>
          </>
        )}
      >
        <div className="space-y-2">
          <p className="text-sm text-muted">Cancellation reason (minimum 3 characters)</p>
          <Textarea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={3}
            placeholder="Reason for cancellation"
          />
        </div>
      </Modal>

      <Drawer
        open={creditNoteDrawerOpen}
        onClose={() => setCreditNoteDrawerOpen(false)}
        title="New Credit Note"
        size="2xl"
      >
        <InvoiceFormContent
          initialInvoiceType="CREDIT_NOTE"
          initialReferenceInvoiceId={invoice.id}
          initialCustomerId={invoice.customer ?? ""}
          onCancel={() => setCreditNoteDrawerOpen(false)}
          onSuccess={(created) => {
            setCreditNoteDrawerOpen(false);
            router.push(`/jewellery/billing/${created.id}`);
          }}
        />
      </Drawer>

      <Modal
        open={irnDisclaimerOpen}
        onClose={() => setIrnDisclaimerOpen(false)}
        title="Generate Reference IRN"
        footer={(
          <>
            <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={() => setIrnDisclaimerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              onClick={handleGenerateEInvoice}
              loading={eInvoiceState.isLoading}
              disabled={!irnAcknowledged}
            >
              Generate IRN
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">⚠ For internal use only</p>
            <p>
              This will generate a <strong>locally-computed</strong> IRN hash. It is <strong>not</strong> registered
              with the GSTN / IRP portal and carries no legal validity under the GST e-invoicing mandate.
              Do not share this IRN with B2B buyers as a valid e-invoice.
            </p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              checked={irnAcknowledged}
              onChange={(e) => setIrnAcknowledged(e.target.checked)}
            />
            <span className="text-sm text-text">
              I understand this IRN is for internal reference only and has not been submitted to the government e-invoice portal.
            </span>
          </label>
        </div>
      </Modal>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share invoice"
        footer={(
          <>
            <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={() => setShareOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              onClick={handleShare}
              loading={sendState.isLoading}
              disabled={!shareTo.trim()}
            >
              Open share link
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Select
            label="Channel"
            value={shareChannel}
            onChange={(event) => setShareChannel(event.target.value as "WA" | "SMS" | "EMAIL")}
          >
            <option value="WA">WhatsApp</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </Select>
          <Input
            label={shareChannel === "EMAIL" ? "Email" : "Phone number"}
            value={shareTo}
            onChange={(event) => setShareTo(event.target.value)}
            placeholder={shareChannel === "EMAIL" ? "customer@example.com" : "919999999999"}
            error={shareError ?? undefined}
            helperText={shareError ?? undefined}
          />
        </div>
      </Modal>
    </Screen>
  );
}
