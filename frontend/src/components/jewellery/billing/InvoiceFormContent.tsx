"use client";

import { type ReactNode, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { InvoiceLineRow, type InvoiceLineDraft } from "@/components/jewellery/billing/InvoiceLineRow";
import { PaymentSplitTable, type InvoicePaymentDraft } from "@/components/jewellery/billing/PaymentSplitTable";
import { GstBreakdown } from "@/components/jewellery/billing/GstBreakdown";
import { CustomerSearchSelect } from "@/components/jewellery/shared/CustomerSearchSelect";
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
  useListInvoicesQuery,
  type InvoiceType,
  type JwlCreateInvoiceParams,
  type JwlInvoice,
  type JwlItem,
} from "@/store/jewellery-api";
import { useDebounce } from "@/hooks/useDebounce";
import { calcOldGoldDeduction, formatINRCurrency } from "@/utils/jewellery/formulas";
import {
  BILLING_DEFAULT_GST_RATE_PCT,
  BILLING_DEFAULT_HSN_CODE,
  BILLING_DEFAULT_INVOICE_TYPE,
  BILLING_DEFAULT_LINE_METAL_CODE,
  BILLING_DEFAULT_MAKING_MODE,
  BILLING_DEFAULT_PAYMENT_MODE,
  BILLING_DEFAULT_LINE_PURITY_CODE,
  BILLING_DEFAULT_NUMERIC_VALUE,
  INDIAN_STATE_CODES,
  INVOICE_TYPE_FORM_OPTIONS,
} from "@/constants/jewellery";

import { IconButton } from "@/components/ui/IconButton";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";

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

function createEmptyLine(defaultRate = BILLING_DEFAULT_NUMERIC_VALUE): InvoiceLineDraft {
  return {
    item: "",
    huid: "",
    description: "",
    hsn_code: BILLING_DEFAULT_HSN_CODE,
    metal_code: BILLING_DEFAULT_LINE_METAL_CODE,
    purity_code: BILLING_DEFAULT_LINE_PURITY_CODE,
    gross_wt: BILLING_DEFAULT_NUMERIC_VALUE,
    net_wt: BILLING_DEFAULT_NUMERIC_VALUE,
    stone_wt: BILLING_DEFAULT_NUMERIC_VALUE,
    rate_per_gram: defaultRate,
    making_mode: BILLING_DEFAULT_MAKING_MODE,
    making_rate: BILLING_DEFAULT_NUMERIC_VALUE,
    wastage_pct: BILLING_DEFAULT_NUMERIC_VALUE,
    hallmarking_fee: BILLING_DEFAULT_NUMERIC_VALUE,
    stone_value: BILLING_DEFAULT_NUMERIC_VALUE,
    gst_rate_pct: BILLING_DEFAULT_GST_RATE_PCT,
    auto_rate_per_gram: defaultRate,
    rate_overridden: false,
    rate_unavailable: false,
  };
}

function createEmptyPayment(): InvoicePaymentDraft {
  return { mode: BILLING_DEFAULT_PAYMENT_MODE, amount: BILLING_DEFAULT_NUMERIC_VALUE, reference: "" };
}

function createEmptyOldGold(): OldGoldDraft {
  return {
    metal_code: BILLING_DEFAULT_LINE_METAL_CODE,
    description: "",
    gross_wt: BILLING_DEFAULT_NUMERIC_VALUE,
    tested_purity: "75",
    buy_rate_per_gram: BILLING_DEFAULT_NUMERIC_VALUE,
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

const SectionCard = memo(function SectionCard({
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
});

export function InvoiceFormContent({
  initialInvoiceType = BILLING_DEFAULT_INVOICE_TYPE,
  initialReferenceInvoiceId = "",
  initialCustomerId = "",
  seedOldGold = false,
  onSuccess,
  onCancel,
}: InvoiceFormContentProps) {
  const router = useRouter();

  const { data: rateRows } = useGetLiveRatesQuery();
  const defaultRate = useMemo(() => {
    const preferred = rateRows?.find(
      (row) => row.metal === BILLING_DEFAULT_LINE_METAL_CODE && row.purity === BILLING_DEFAULT_LINE_PURITY_CODE,
    );
    return preferred?.sell_rate ?? rateRows?.[0]?.sell_rate ?? BILLING_DEFAULT_NUMERIC_VALUE;
  }, [rateRows]);

  const [invoiceType, setInvoiceType] = useState<InvoiceType>(initialInvoiceType);
  const [referenceInvoiceId, setReferenceInvoiceId] = useState(initialReferenceInvoiceId);
  const [referenceInvoiceNo, setReferenceInvoiceNo] = useState("");
  const [refSearch, setRefSearch] = useState("");
  const [refDropdownOpen, setRefDropdownOpen] = useState(false);
  const debouncedRefSearch = useDebounce(refSearch, 300);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [sellerStateCode, setSellerStateCode] = useState(DEFAULT_STATE_CODE);
  const [placeStateCode, setPlaceStateCode] = useState(DEFAULT_STATE_CODE);
  const [discountAmount, setDiscountAmount] = useState(BILLING_DEFAULT_NUMERIC_VALUE);
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

  const { data: refInvoiceResults } = useListInvoicesQuery(
    { page: 1, search: debouncedRefSearch.trim() || undefined, status: "ISSUED" },
    { skip: invoiceType !== "CREDIT_NOTE" || debouncedRefSearch.trim().length < 1 },
  );

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
        discount_amount: discountAmount || BILLING_DEFAULT_NUMERIC_VALUE,
        lines: lines.map((line) => ({
          item: line.item || undefined,
          description: line.description,
          huid: line.huid,
          hsn_code: line.hsn_code,
          metal_code: line.metal_code,
          purity_code: line.purity_code,
          gross_wt: line.gross_wt || BILLING_DEFAULT_NUMERIC_VALUE,
          net_wt: line.net_wt || BILLING_DEFAULT_NUMERIC_VALUE,
          stone_wt: line.stone_wt || BILLING_DEFAULT_NUMERIC_VALUE,
          rate_per_gram: line.rate_per_gram || BILLING_DEFAULT_NUMERIC_VALUE,
          making_mode: line.making_mode,
          making_rate: line.making_rate || BILLING_DEFAULT_NUMERIC_VALUE,
          wastage_pct: line.wastage_pct || BILLING_DEFAULT_NUMERIC_VALUE,
          hallmarking_fee: line.hallmarking_fee || BILLING_DEFAULT_NUMERIC_VALUE,
          stone_value: line.stone_value || BILLING_DEFAULT_NUMERIC_VALUE,
          gst_rate_pct: line.gst_rate_pct || BILLING_DEFAULT_GST_RATE_PCT,
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

  const handleLinePatch = useCallback((index: number, patch: Partial<InvoiceLineDraft>) => {
    setLines((prev) => {
      const next = [...prev];
      const merged = { ...next[index], ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, "rate_per_gram") && merged.auto_rate_per_gram) {
        merged.rate_overridden = (patch.rate_per_gram ?? "") !== (merged.auto_rate_per_gram ?? "");
      }
      next[index] = merged;
      return next;
    });
  }, []);

  const handleItemSelect = useCallback((index: number, itemId: string, item?: JwlItem) => {
    setLines((prev) => {
      const next = [...prev];
      if (!item) {
        // Cleared — reset item field only, leave other fields as-is
        next[index] = { ...next[index], item: "", huid: "" };
        return next;
      }
      // Auto-fill rate from live rates for this item's metal/purity
      const matchedRate = rateRows?.find(
        (r) => r.metal === item.metal_code && r.purity === item.purity_code,
      )?.sell_rate;
      const resolvedRate = matchedRate ?? BILLING_DEFAULT_NUMERIC_VALUE;

      next[index] = {
        ...next[index],
        item: itemId,
        huid: item.huid ?? "",
        description: next[index].description || `${item.design_name || item.sku} ${item.purity_code}`.trim(),
        hsn_code: next[index].hsn_code || item.hsn_code || BILLING_DEFAULT_HSN_CODE,
        metal_code: item.metal_code || next[index].metal_code,
        purity_code: item.purity_code || next[index].purity_code,
        gross_wt: item.gross_wt || next[index].gross_wt,
        net_wt: item.net_wt || next[index].net_wt,
        stone_wt: item.stone_wt || next[index].stone_wt,
        rate_per_gram: resolvedRate,
        auto_rate_per_gram: resolvedRate,
        rate_overridden: false,
        rate_unavailable: !matchedRate,
      };
      return next;
    });
  }, [rateRows]);

  const handleScan = useCallback(async () => {
    if (!scanCode.trim()) return;
    setScanError(null);
    try {
      const item = await scanItem({
        code: scanCode.trim(),
        status: invoiceType === "CREDIT_NOTE" ? "SOLD" : "IN_STOCK",
      }).unwrap();
      setLines((prev) => {
        const next = [...prev];
        if (next.length === 0) {
          next.push(createEmptyLine(defaultRate));
        }
        const first = next[0];
        next[0] = {
          ...first,
          item: item.id,
          huid: item.huid || "",
          description: first.description || item.design_name || item.sku,
          hsn_code: first.hsn_code || item.hsn_code || BILLING_DEFAULT_HSN_CODE,
          metal_code: item.metal_code,
          purity_code: item.purity_code,
          gross_wt: item.gross_wt,
          net_wt: item.net_wt,
          rate_per_gram: first.rate_per_gram || defaultRate,
          auto_rate_per_gram: first.rate_per_gram || defaultRate,
          rate_overridden: false,
          rate_unavailable: false,
        };
        return next;
      });
      setLineOpen(true);
      setScanCode("");
    } catch {
      setScanError("Item not found for this code.");
    }
  }, [scanCode, scanItem, defaultRate, invoiceType]);

  const addLine = useCallback(() => {
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
  }, [lines, defaultRate]);

  const toggleLineExpanded = useCallback((index: number) => {
    setLineExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const removeLine = useCallback((targetIndex: number) => {
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
  }, []);

  const addPaymentRow = useCallback(() => {
    const hasIncomplete = payments.some((payment) => !isPaymentComplete(payment));
    if (hasIncomplete) {
      setFormError("Complete the current payment row before adding another.");
      setPaymentOpen(true);
      return;
    }
    setFormError(null);
    setPayments((prev) => [...prev, createEmptyPayment()]);
    setPaymentOpen(true);
  }, [payments]);

  const submitInvoice = useCallback(async (mode: "draft" | "issue") => {
    setFormError(null);
    const effectiveInvoiceType: InvoiceType = initialInvoiceType === "CREDIT_NOTE" ? "CREDIT_NOTE" : invoiceType;
    const effectiveReferenceInvoiceId = (referenceInvoiceId || initialReferenceInvoiceId).trim();

    const filteredLines = lines.filter((line) => line.description.trim() && Number(line.net_wt) > 0);
    if (filteredLines.length === 0) {
      setFormError("Add at least one line with description and net weight.");
      setLineOpen(true);
      return;
    }
    if (effectiveInvoiceType === "CREDIT_NOTE" && !effectiveReferenceInvoiceId) {
      setFormError("Reference invoice is required for credit note.");
      setSaleOpen(true);
      return;
    }

    const payload: JwlCreateInvoiceParams = {
      customer: customerId || undefined,
      reference_invoice: effectiveInvoiceType === "CREDIT_NOTE" ? effectiveReferenceInvoiceId : undefined,
      invoice_type: effectiveInvoiceType,
      seller_state_code: sellerStateCode,
      place_of_supply_state_code: placeStateCode,
      discount_amount: discountAmount || BILLING_DEFAULT_NUMERIC_VALUE,
      notes,
      lines: filteredLines.map((line) => ({
        item: line.item || undefined,
        description: line.description,
        huid: line.huid,
        hsn_code: line.hsn_code,
        metal_code: line.metal_code,
        purity_code: line.purity_code,
        gross_wt: line.gross_wt || BILLING_DEFAULT_NUMERIC_VALUE,
        net_wt: line.net_wt || BILLING_DEFAULT_NUMERIC_VALUE,
        stone_wt: line.stone_wt || BILLING_DEFAULT_NUMERIC_VALUE,
        rate_per_gram: line.rate_per_gram || BILLING_DEFAULT_NUMERIC_VALUE,
        making_mode: line.making_mode,
        making_rate: line.making_rate || BILLING_DEFAULT_NUMERIC_VALUE,
        wastage_pct: line.wastage_pct || BILLING_DEFAULT_NUMERIC_VALUE,
        hallmarking_fee: line.hallmarking_fee || BILLING_DEFAULT_NUMERIC_VALUE,
        stone_value: line.stone_value || BILLING_DEFAULT_NUMERIC_VALUE,
        gst_rate_pct: line.gst_rate_pct || BILLING_DEFAULT_GST_RATE_PCT,
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
  }, [lines, payments, oldGoldRows, invoiceType, referenceInvoiceId, initialInvoiceType, initialReferenceInvoiceId, customerId,
      sellerStateCode, placeStateCode, discountAmount, notes,
      createInvoice, issueInvoice, onSuccess, router]);

  const preview = calculateState.data;
  const duplicateLineWarningByIndex = useMemo<Record<number, string>>(() => {
    const firstSeenByItem = new Map<string, number>();
    const warningByIndex: Record<number, string> = {};
    lines.forEach((line, idx) => {
      if (!line.item) return;
      if (!firstSeenByItem.has(line.item)) {
        firstSeenByItem.set(line.item, idx);
        return;
      }
      const firstIndex = firstSeenByItem.get(line.item);
      if (typeof firstIndex === "number") {
        warningByIndex[idx] = `Already on line ${firstIndex + 1}. Duplicate may cause stock conflict.`;
      }
    });
    return warningByIndex;
  }, [lines]);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Select
              label="Document type"
              value={invoiceType}
              onChange={(event) => setInvoiceType(event.target.value as InvoiceType)}
              disabled={initialInvoiceType === "CREDIT_NOTE"}
            >
              {INVOICE_TYPE_FORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Seller state"
                value={sellerStateCode}
                onChange={(event) => setSellerStateCode(event.target.value)}
              >
                {INDIAN_STATE_CODES.map((s) => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </Select>
              <Select
                label="Place of supply"
                value={placeStateCode}
                onChange={(event) => setPlaceStateCode(event.target.value)}
              >
                {INDIAN_STATE_CODES.map((s) => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {invoiceType === "CREDIT_NOTE" ? (
            <div className="relative">
              <Input
                label="Reference invoice (original)"
                value={refSearch}
                onChange={(event) => {
                  setRefSearch(event.target.value);
                  setRefDropdownOpen(true);
                  if (!event.target.value.trim()) {
                    setReferenceInvoiceId("");
                    setReferenceInvoiceNo("");
                  }
                }}
                onFocus={() => setRefDropdownOpen(true)}
                onBlur={() => setTimeout(() => setRefDropdownOpen(false), 150)}
                placeholder="Search by voucher no. or customer name"
              />
              {referenceInvoiceNo && !refSearch ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium">
                    {referenceInvoiceNo}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setReferenceInvoiceId(""); setReferenceInvoiceNo(""); }}
                    className="text-xs text-muted hover:text-danger-600 transition-colors"
                  >
                    ✕ Clear
                  </button>
                </div>
              ) : null}
              {refDropdownOpen && refSearch.trim().length > 0 ? (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                  {(refInvoiceResults?.results ?? []).length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted">No issued invoices found</div>
                  ) : null}
                  {(refInvoiceResults?.results ?? []).map((inv) => (
                    <button
                      key={inv.id}
                      type="button"
                      onMouseDown={() => {
                        setReferenceInvoiceId(inv.id);
                        setReferenceInvoiceNo(inv.voucher_no || "Issued invoice");
                        setRefSearch("");
                        setRefDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface2 transition-colors"
                    >
                      <span className="font-medium text-text">{inv.voucher_no || "Draft"}</span>
                      <span className="text-muted ml-2">{inv.customer_name || "Walk-in"}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <CustomerSearchSelect
            value={customerId}
            onChange={(id) => setCustomerId(id)}
            label="Customer"
            placeholder="Search by name or mobile (leave empty for walk-in)"
            showSelectedName={true}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Input
              label="Discount amount"
              type="number"
              step="0.01"
              min="0"
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
            />

            <div className="space-y-2">
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
            </div>
          </div>

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
          <Button type="button" size="sm" onClick={addLine} disabled={hasIncompleteLine} leftIcon={<PlusIcon />}>
            Add line
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
                  invoiceType={invoiceType}
                  computedLine={preview?.computed_lines?.[index]}
                  onChange={handleLinePatch}
                  onItemSelect={handleItemSelect}
                  onRemove={removeLine}
                  disableRemove={lines.length <= 1}
                  collapsible
                  expanded={lineExpanded[index] ?? (index === 0 && lines.length === 1)}
                  onToggleExpand={toggleLineExpanded}
                  duplicateWarning={duplicateLineWarningByIndex[index]}
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
          <Button type="button" size="sm" variant="secondary" onClick={addPaymentRow} disabled={hasIncompletePayment} leftIcon={<PlusIcon />}>
            Add
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
            leftIcon={<PlusIcon />}
          >
            Add
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        <IconButton
                          variant="danger"
                          label="Remove old-gold row"
                          onClick={() => setOldGoldRows((prev) => prev.filter((_, i) => i !== index))}
                          disabled={oldGoldRows.length === 1}
                        >
                          <TrashIcon />
                        </IconButton>
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
