"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { InvoiceFormContent } from "@/components/jewellery/billing/InvoiceFormContent";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCancelInvoiceMutation,
  useGetInvoiceQuery,
  useLazyGetInvoicePdfQuery,
  useIssueInvoiceMutation,
} from "@/store/jewellery-api";
import { ROUTES } from "@/lib/routes";
import { formatINRCurrency } from "@/utils/jewellery/formulas";
import { useAppSelector } from "@/store/hooks";

function statusVariant(status: string): "success" | "danger" | "warning" {
  if (status === "ISSUED") return "success";
  if (status === "CANCELLED") return "danger";
  return "warning";
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceId = String(params.id);
  const { data: invoice, isLoading } = useGetInvoiceQuery(invoiceId);
  const [issueInvoice, issueState] = useIssueInvoiceMutation();
  const [cancelInvoice, cancelState] = useCancelInvoiceMutation();
  const [fetchInvoicePdf, pdfState] = useLazyGetInvoicePdfQuery();

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const canCancel = useMemo(() => {
    const jwlRoles = (currentUser?.module_roles ?? [])
      .filter((role) => role.module === "jewellery" && role.is_active)
      .map((role) => role.role_code);
    return jwlRoles.includes("jwl_admin") || jwlRoles.includes("jwl_manager") || currentUser?.role === "admin";
  }, [currentUser]);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [creditNoteDrawerOpen, setCreditNoteDrawerOpen] = useState(false);

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
    anchor.download = `${invoice.voucher_no || invoice.id}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
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

  if (isLoading || !invoice) {
    return (
      <Screen title="Invoice detail" subtitle="Loading invoice..." backHref={ROUTES.app.jewellery.billing}>
        {null}
      </Screen>
    );
  }

  const actions = (
    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
      {invoice.status === "DRAFT" ? (
        <Button type="button" size="sm" className="min-h-11" onClick={handleIssue} loading={issueState.isLoading}>
          Issue invoice
        </Button>
      ) : null}
      {invoice.status === "ISSUED" && canCancel ? (
        <Button type="button" size="sm" className="min-h-11" variant="danger" onClick={() => setCancelOpen(true)}>
          Cancel invoice
        </Button>
      ) : null}
      {invoice.status === "ISSUED" ? (
        <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={handlePrint}>
          Print
        </Button>
      ) : null}
      {invoice.status === "ISSUED" ? (
        <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={handleDownloadPdf} loading={pdfState.isFetching}>
          Download PDF
        </Button>
      ) : null}
      {invoice.status === "ISSUED" && invoice.invoice_type !== "CREDIT_NOTE" ? (
        <Button
          type="button"
          size="sm"
          className="min-h-11"
          variant="secondary"
          onClick={() => setCreditNoteDrawerOpen(true)}
        >
          Create credit note
        </Button>
      ) : null}
      <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={() => router.push(`/jewellery/billing/new`)}>
        Duplicate as new
      </Button>
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
        <section className="app-panel rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <div>
            <p className="text-muted">Status</p>
            <Badge variant={statusVariant(invoice.status)} className="mt-1">
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
    </Screen>
  );
}
