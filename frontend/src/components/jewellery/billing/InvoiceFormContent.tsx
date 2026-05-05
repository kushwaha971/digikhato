"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { InvoiceLineRow, type InvoiceLineDraft } from "@/components/jewellery/billing/InvoiceLineRow";
import { PaymentSplitTable, type InvoicePaymentDraft } from "@/components/jewellery/billing/PaymentSplitTable";
import { GstBreakdown } from "@/components/jewellery/billing/GstBreakdown";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCalculateInvoiceMutation,
  useCreateInvoiceMutation,
  useGetLiveRatesQuery,
  useIssueInvoiceMutation,
  useLazyScanItemQuery,
  useListCustomersQuery,
  useListItemsQuery,
  type InvoiceType,
  type JwlCreateInvoiceParams,
  type JwlInvoice,
  type JwlItem,
} from "@/store/jewellery-api";
import { calcOldGoldDeduction, formatINRCurrency } from "@/utils/jewellery/formulas";

interface OldGoldDraft {
  metal_code: string;
  description: string;
  gross_wt: string;
  tested_purity: string;
  buy_rate_per_gram: string;
}

interface InvoiceFormContentProps {
  initialInvoiceType?: InvoiceType;
  initialReferenceInvoiceId?: string;
  initialCustomerId?: string;
  seedOldGold?: boolean;
  onSuccess?: (invoice: JwlInvoice) => void;
  onCancel?: () => void;
}

const DEFAULT_STATE_CODE = "27";

function createEmptyLine(defaultRate = "0"): InvoiceLineDraft {
  return {
    item: "",
    description: "",
    hsn_code: "7113",
    metal_code: "GOLD",
    purity_code: "22K",
    gross_wt: "0",
    net_wt: "0",
    stone_wt: "0",
    rate_per_gram: defaultRate,
    making_mode: "PER_GRAM",
    making_rate: "0",
    wastage_pct: "0",
    hallmarking_fee: "0",
    stone_value: "0",
    gst_rate_pct: "3",
  };
}

function createEmptyPayment(): InvoicePaymentDraft {
  return { mode: "CASH", amount: "0", reference: "" };
}

function createEmptyOldGold(): OldGoldDraft {
  return {
    metal_code: "GOLD",
    description: "",
    gross_wt: "0",
    tested_purity: "75",
    buy_rate_per_gram: "0",
  };
}

function isLineComplete(line: InvoiceLineDraft) {
  return Boolean(line.description.trim()) && Number(line.net_wt) > 0;
}

function isPaymentComplete(payment: InvoicePaymentDraft) {
  return Number(payment.amount) > 0;
}

function isOldGoldComplete(row: OldGoldDraft) {
  return Number(row.gross_wt) > 0 && Number(row.tested_purity) > 0 && Number(row.buy_rate_per_gram) > 0;
}

function SectionCard({
  title,
  open,
  onToggle,
  summary,
  children,
  action,
}: Readonly<{
  title: string;
  open: boolean;
  onToggle: () => void;
  summary?: string;
  children: ReactNode;
  action?: ReactNode;
}>) {
  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-left min-w-0"
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        >
          <svg
            className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : "rotate-0"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            {summary ? <p className="text-xs text-muted truncate">{summary}</p> : null}
          </div>
        </button>
        {action}
      </div>
      {open ? <div className="p-4">{children}</div> : null}
    </section>
  );
}

export function InvoiceFormContent({
  initialInvoiceType = "TAX_INVOICE",
  initialReferenceInvoiceId = "",
  initialCustomerId = "",
  seedOldGold = false,
  onSuccess,
  onCancel,
}: InvoiceFormContentProps) {
  const router = useRouter();

  const { data: rateRows } = useGetLiveRatesQuery();
  const defaultRate = useMemo(() => {
    const preferred = rateRows?.find((row) => row.metal === "GOLD" && row.purity === "22K");
    return preferred?.sell_rate ?? rateRows?.[0]?.sell_rate ?? "0";
  }, [rateRows]);

  const [invoiceType, setInvoiceType] = useState<InvoiceType>(initialInvoiceType);
  const [referenceInvoiceId, setReferenceInvoiceId] = useState(initialReferenceInvoiceId);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [sellerStateCode, setSellerStateCode] = useState(DEFAULT_STATE_CODE);
  const [placeStateCode, setPlaceStateCode] = useState(DEFAULT_STATE_CODE);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<InvoiceLineDraft[]>([]);
  const [payments, setPayments] = useState<InvoicePaymentDraft[]>([]);
  const [oldGoldRows, setOldGoldRows] = useState<OldGoldDraft[]>(seedOldGold ? [createEmptyOldGold()] : []);
  const [lineExpanded, setLineExpanded] = useState<Record<number, boolean>>({ 0: true });

  const [scanCode, setScanCode] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [saleOpen, setSaleOpen] = useState(true);
  const [lineOpen, setLineOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [oldGoldOpen, setOldGoldOpen] = useState(seedOldGold);
  const [reviewOpen, setReviewOpen] = useState(true);

  const [calculateInvoice, calculateState] = useCalculateInvoiceMutation();
  const [createInvoice, createState] = useCreateInvoiceMutation();
  const [issueInvoice, issueState] = useIssueInvoiceMutation();
  const [scanItem, scanState] = useLazyScanItemQuery();

  const { data: customerList } = useListCustomersQuery({ search: customerSearch || undefined });
  const { data: inventoryList } = useListItemsQuery({ page: 1, status: "IN_STOCK" });

  const inventoryItems: JwlItem[] = inventoryList?.results ?? [];

  useEffect(() => {
    setInvoiceType(initialInvoiceType);
  }, [initialInvoiceType]);

  useEffect(() => {
    setReferenceInvoiceId(initialReferenceInvoiceId);
  }, [initialReferenceInvoiceId]);

  useEffect(() => {
    if (!seedOldGold) return;
    if (oldGoldRows.length > 0) return;
    setOldGoldRows([createEmptyOldGold()]);
    setOldGoldOpen(true);
  }, [seedOldGold, oldGoldRows.length]);

  useEffect(() => {
    setLines((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((line) => {
        if (Number(line.rate_per_gram) > 0) return line;
        return { ...line, rate_per_gram: defaultRate };
      });
    });
  }, [defaultRate]);

  useEffect(() => {
    if (lines.length === 0) return;

    const timer = window.setTimeout(async () => {
      const payload = {
        seller_state_code: sellerStateCode,
        place_of_supply_state_code: placeStateCode,
        discount_amount: discountAmount || "0",
        lines: lines.map((line) => ({
          item: line.item || undefined,
          description: line.description,
          hsn_code: line.hsn_code,
          metal_code: line.metal_code,
          purity_code: line.purity_code,
          gross_wt: line.gross_wt || "0",
          net_wt: line.net_wt || "0",
          stone_wt: line.stone_wt || "0",
          rate_per_gram: line.rate_per_gram || "0",
          making_mode: line.making_mode,
          making_rate: line.making_rate || "0",
          wastage_pct: line.wastage_pct || "0",
          hallmarking_fee: line.hallmarking_fee || "0",
          stone_value: line.stone_value || "0",
          gst_rate_pct: line.gst_rate_pct || "3",
        })),
      };

      try {
        await calculateInvoice(payload).unwrap();
      } catch {
        // Keep draft editable while backend catches invalid partial values.
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [lines, discountAmount, sellerStateCode, placeStateCode, calculateInvoice]);

  const handleLinePatch = (index: number, patch: Partial<InvoiceLineDraft>) => {
    setLines((prev) => {
      const next = [...prev];
      const merged = { ...next[index], ...patch };

      if (patch.item) {
        const picked = inventoryItems.find((item) => item.id === patch.item);
        if (picked) {
          merged.description = merged.description || picked.design_name || picked.sku;
          merged.metal_code = picked.metal_code || merged.metal_code;
          merged.purity_code = picked.purity_code || merged.purity_code;
          merged.gross_wt = picked.gross_wt || merged.gross_wt;
          merged.net_wt = picked.net_wt || merged.net_wt;
        }
      }

      next[index] = merged;
      return next;
    });
  };

  const handleScan = async () => {
    if (!scanCode.trim()) return;
    setScanError(null);
    try {
      const item = await scanItem(scanCode.trim()).unwrap();
      setLines((prev) => {
        const next = [...prev];
        if (next.length === 0) {
          next.push(createEmptyLine(defaultRate));
        }
        const first = next[0];
        next[0] = {
          ...first,
          item: item.id,
          description: first.description || item.design_name || item.sku,
          metal_code: item.metal_code,
          purity_code: item.purity_code,
          gross_wt: item.gross_wt,
          net_wt: item.net_wt,
          rate_per_gram: first.rate_per_gram || defaultRate,
        };
        return next;
      });
      setLineOpen(true);
      setScanCode("");
    } catch {
      setScanError("Item not found for this code.");
    }
  };

  const addLine = () => {
    const hasIncomplete = lines.some((line) => !isLineComplete(line));
    if (hasIncomplete) {
      setFormError("Complete the current line item before adding another.");
      setLineOpen(true);
      return;
    }
    setFormError(null);
    setLines((prev) => {
      const nextIndex = prev.length;
      setLineExpanded((current) => ({ ...current, [nextIndex]: true }));
      return [...prev, createEmptyLine(defaultRate)];
    });
    setLineOpen(true);
  };

  const toggleLineExpanded = (index: number) => {
    setLineExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const removeLine = (targetIndex: number) => {
    setLines((prev) => prev.filter((_, i) => i !== targetIndex));
    setLineExpanded((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key);
        if (idx < targetIndex) next[idx] = value;
        if (idx > targetIndex) next[idx - 1] = value;
      });
      if (Object.keys(next).length === 0) next[0] = true;
      return next;
    });
  };

  const addPaymentRow = () => {
    const hasIncomplete = payments.some((payment) => !isPaymentComplete(payment));
    if (hasIncomplete) {
      setFormError("Complete the current payment row before adding another.");
      setPaymentOpen(true);
      return;
    }
    setFormError(null);
    setPayments((prev) => [...prev, createEmptyPayment()]);
    setPaymentOpen(true);
  };

  const submitInvoice = async (mode: "draft" | "issue") => {
    setFormError(null);

    const filteredLines = lines.filter((line) => line.description.trim() && Number(line.net_wt) > 0);
    if (filteredLines.length === 0) {
      setFormError("Add at least one line with description and net weight.");
      setLineOpen(true);
      return;
    }
    if (invoiceType === "CREDIT_NOTE" && !referenceInvoiceId.trim()) {
      setFormError("Reference invoice ID is required for credit note.");
      setSaleOpen(true);
      return;
    }

    const payload: JwlCreateInvoiceParams = {
      customer: customerId || undefined,
      reference_invoice: invoiceType === "CREDIT_NOTE" ? referenceInvoiceId.trim() : undefined,
      invoice_type: invoiceType,
      seller_state_code: sellerStateCode,
      place_of_supply_state_code: placeStateCode,
      discount_amount: discountAmount || "0",
      notes,
      lines: filteredLines.map((line) => ({
        item: line.item || undefined,
        description: line.description,
        hsn_code: line.hsn_code,
        metal_code: line.metal_code,
        purity_code: line.purity_code,
        gross_wt: line.gross_wt || "0",
        net_wt: line.net_wt || "0",
        stone_wt: line.stone_wt || "0",
        rate_per_gram: line.rate_per_gram || "0",
        making_mode: line.making_mode,
        making_rate: line.making_rate || "0",
        wastage_pct: line.wastage_pct || "0",
        hallmarking_fee: line.hallmarking_fee || "0",
        stone_value: line.stone_value || "0",
        gst_rate_pct: line.gst_rate_pct || "3",
      })),
      payments: payments
        .filter((payment) => Number(payment.amount) > 0)
        .map((payment) => ({ mode: payment.mode, amount: payment.amount, reference: payment.reference })),
      old_gold: oldGoldRows
        .filter((row) => Number(row.gross_wt) > 0 && Number(row.tested_purity) > 0 && Number(row.buy_rate_per_gram) > 0)
        .map((row) => ({
          metal_code: row.metal_code,
          description: row.description,
          gross_wt: row.gross_wt,
          tested_purity: row.tested_purity,
          buy_rate_per_gram: row.buy_rate_per_gram,
        })),
    };

    try {
      const created = await createInvoice(payload).unwrap();
      let target: JwlInvoice = created;
      if (mode === "issue") {
        target = await issueInvoice(created.id).unwrap();
      }
      if (onSuccess) {
        onSuccess(target);
      } else {
        router.push(`/jewellery/billing/${target.id}`);
      }
    } catch {
      setFormError("Could not save invoice. Check values and try again.");
    }
  };

  const preview = calculateState.data;

  const lineTotal = lines.length;
  const payableTotal = preview?.total_amount;
  const hasIncompleteLine = lines.some((line) => !isLineComplete(line));
  const hasIncompletePayment = payments.some((payment) => !isPaymentComplete(payment));
  const hasIncompleteOldGold = oldGoldRows.some((row) => !isOldGoldComplete(row));

  return (
    <div className="space-y-4 pb-2">
      {formError ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 text-danger-700 text-sm px-3 py-2">
          {formError}
        </div>
      ) : null}

      <SectionCard
        title="Basic details"
        open={saleOpen}
        onToggle={() => setSaleOpen((prev) => !prev)}
        summary={invoiceType === "CREDIT_NOTE" ? "Credit note details" : "Invoice details"}
      >
        <div className="space-y-3">
          <Select
            label="Document type"
            value={invoiceType}
            onChange={(event) => setInvoiceType(event.target.value as InvoiceType)}
          >
            <option value="TAX_INVOICE">Tax invoice</option>
            <option value="ESTIMATE">Estimate</option>
            <option value="CASH_MEMO">Cash memo</option>
            <option value="NON_GST">Non GST</option>
            <option value="CREDIT_NOTE">Credit note</option>
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Seller state"
              value={sellerStateCode}
              onChange={(event) => setSellerStateCode(event.target.value.slice(0, 2))}
              placeholder="27"
            />
            <Input
              label="Place of supply"
              value={placeStateCode}
              onChange={(event) => setPlaceStateCode(event.target.value.slice(0, 2))}
              placeholder="27"
            />
          </div>

          {invoiceType === "CREDIT_NOTE" ? (
            <Input
              label="Reference invoice ID"
              value={referenceInvoiceId}
              onChange={(event) => setReferenceInvoiceId(event.target.value)}
              placeholder="Paste original invoice ID"
            />
          ) : null}

          <div className="space-y-2">
            <Input
              label="Search customer"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Name or mobile"
            />
            <Select label="Customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Walk-in customer</option>
              {(customerList?.results ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.mobile}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Discount amount"
            type="number"
            step="0.01"
            min="0"
            value={discountAmount}
            onChange={(event) => setDiscountAmount(event.target.value)}
          />

          <Input
            label="Scan item code"
            value={scanCode}
            onChange={(event) => setScanCode(event.target.value)}
            placeholder="Barcode / SKU / HUID"
            helperText={scanError ?? undefined}
            error={scanError ?? undefined}
          />
          <Button
            type="button"
            onClick={handleScan}
            loading={scanState.isFetching}
            disabled={!scanCode.trim()}
            fullWidth
          >
            Scan and fill first line
          </Button>

          <Textarea
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes"
            maxLength={500}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Line items"
        open={lineOpen}
        onToggle={() => setLineOpen((prev) => !prev)}
        summary={lineTotal > 0 ? `${lineTotal} item(s) added` : "No line items yet"}
        action={(
          <Button type="button" size="sm" className="min-h-11" onClick={addLine} disabled={hasIncompleteLine}>
            Add line item
          </Button>
        )}
      >
        {lines.length === 0 ? (
          <p className="text-sm text-muted">No line items yet. Tap "Add line item" to begin.</p>
        ) : (
          <>
            {hasIncompleteLine ? (
              <p className="text-xs text-warning-700 mb-2">Finish current line before adding next one.</p>
            ) : null}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {lines.map((line, index) => (
                <InvoiceLineRow
                  key={`line-${index}`}
                  index={index}
                  line={line}
                  items={inventoryItems}
                  computedLine={preview?.computed_lines?.[index]}
                  onChange={handleLinePatch}
                  onRemove={removeLine}
                  disableRemove={lines.length <= 1}
                  collapsible
                  expanded={lineExpanded[index] ?? (index === 0 && lines.length === 1)}
                  onToggleExpand={toggleLineExpanded}
                />
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Payments"
        open={paymentOpen}
        onToggle={() => setPaymentOpen((prev) => !prev)}
        summary={payments.length > 0 ? `${payments.length} payment row(s)` : "No payment rows yet"}
        action={(
          <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={addPaymentRow} disabled={hasIncompletePayment}>
            Add payment
          </Button>
        )}
      >
        {payments.length === 0 ? (
          <p className="text-sm text-muted">Add payment rows only when needed. Balance will be auto-calculated.</p>
        ) : (
          <>
            {hasIncompletePayment ? (
              <p className="text-xs text-warning-700 mb-2">Finish current payment row before adding next one.</p>
            ) : null}
            <PaymentSplitTable
              rows={payments}
              onAdd={addPaymentRow}
              onRemove={(index) => setPayments((prev) => prev.filter((_, i) => i !== index))}
              onChange={(index, patch) => setPayments((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))}
              totalPayable={payableTotal}
              disableAdd={hasIncompletePayment}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Old gold deduction"
        open={oldGoldOpen}
        onToggle={() => setOldGoldOpen((prev) => !prev)}
        summary={oldGoldRows.length > 0 ? `${oldGoldRows.length} row(s)` : "Optional"}
        action={(
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            variant="secondary"
            onClick={() => {
              const hasIncomplete = oldGoldRows.some((row) => !isOldGoldComplete(row));
              if (hasIncomplete) {
                setFormError("Complete the current old-gold row before adding another.");
                setOldGoldOpen(true);
                return;
              }
              setFormError(null);
              setOldGoldRows((prev) => [...prev, createEmptyOldGold()]);
              setOldGoldOpen(true);
            }}
            disabled={hasIncompleteOldGold}
          >
            Add old-gold row
          </Button>
        )}
      >
        {oldGoldRows.length === 0 ? (
          <p className="text-sm text-muted">No old-gold entries added.</p>
        ) : (
          <>
            {hasIncompleteOldGold ? (
              <p className="text-xs text-warning-700 mb-2">Finish current old-gold row before adding next one.</p>
            ) : null}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {oldGoldRows.map((row, index) => {
                const deduction = calcOldGoldDeduction(row.gross_wt, row.tested_purity, row.buy_rate_per_gram);
                return (
                  <div key={`og-${index}`} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <Input
                        label="Metal"
                        value={row.metal_code}
                        onChange={(event) => setOldGoldRows((prev) => prev.map((item, i) => (i === index ? { ...item, metal_code: event.target.value.toUpperCase() } : item)))}
                      />
                      <Textarea
                        label="Description"
                        value={row.description}
                        onChange={(event) => setOldGoldRows((prev) => prev.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)))}
                        rows={2}
                      />
                      <Input
                        label="Gross wt"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={row.gross_wt}
                        onChange={(event) => setOldGoldRows((prev) => prev.map((item, i) => (i === index ? { ...item, gross_wt: event.target.value } : item)))}
                      />
                      <Input
                        label="Tested purity %"
                        type="number"
                        step="0.001"
                        min="0"
                        value={row.tested_purity}
                        onChange={(event) => setOldGoldRows((prev) => prev.map((item, i) => (i === index ? { ...item, tested_purity: event.target.value } : item)))}
                      />
                      <Input
                        label="Buy rate / gram"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={row.buy_rate_per_gram}
                        onChange={(event) => setOldGoldRows((prev) => prev.map((item, i) => (i === index ? { ...item, buy_rate_per_gram: event.target.value } : item)))}
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          className="min-h-11"
                          variant="secondary"
                          onClick={() => setOldGoldRows((prev) => prev.filter((_, i) => i !== index))}
                          disabled={oldGoldRows.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Pure grams: <span className="font-semibold text-text">{deduction.pureGrams.toFixed(4)} g</span>
                      {" · "}
                      Deduction: <span className="font-semibold text-text">{formatINRCurrency(deduction.deductionValue)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Review"
        open={reviewOpen}
        onToggle={() => setReviewOpen((prev) => !prev)}
        summary="GST and final payable"
      >
        <GstBreakdown result={preview ?? {}} discountAmount={discountAmount} />
      </SectionCard>

      <div className="sticky bottom-0 -mx-1 px-1 pt-2">
        <div className="rounded-2xl border border-border bg-surface/95 backdrop-blur p-3 flex items-center gap-2 justify-end">
          {onCancel ? (
            <Button type="button" size="sm" className="min-h-11" variant="secondary" onClick={onCancel}>
              Close
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            variant="secondary"
            onClick={() => submitInvoice("draft")}
            loading={createState.isLoading}
            disabled={createState.isLoading || issueState.isLoading}
          >
            Save draft
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            onClick={() => submitInvoice("issue")}
            loading={issueState.isLoading || (createState.isLoading && !issueState.isLoading)}
            disabled={createState.isLoading || issueState.isLoading}
          >
            Save & issue
          </Button>
        </div>
      </div>
    </div>
  );
}
