"use client";

import { memo } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { TrashIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { WeightInput } from "@/components/jewellery/shared/WeightInput";
import { ItemSearchSelect } from "@/components/jewellery/billing/ItemSearchSelect";
import { MAKING_MODE_OPTIONS } from "@/constants/jewellery";
import { formatINRCurrency } from "@/utils/jewellery/formulas";
import type { JwlItem, JwlInvoiceLine, MakingMode, InvoiceType } from "@/store/jewellery-api";

export interface InvoiceLineDraft {
  item: string;
  huid: string;
  description: string;
  hsn_code: string;
  metal_code: string;
  purity_code: string;
  gross_wt: string;
  net_wt: string;
  stone_wt: string;
  rate_per_gram: string;
  making_mode: MakingMode;
  making_rate: string;
  wastage_pct: string;
  hallmarking_fee: string;
  stone_value: string;
  gst_rate_pct: string;
  auto_rate_per_gram?: string;
  rate_overridden?: boolean;
  rate_unavailable?: boolean;
}

interface InvoiceLineRowProps {
  index: number;
  line: InvoiceLineDraft;
  invoiceType?: InvoiceType;
  computedLine?: JwlInvoiceLine;
  onChange: (index: number, patch: Partial<InvoiceLineDraft>) => void;
  onItemSelect: (index: number, itemId: string, item?: JwlItem) => void;
  onRemove: (index: number) => void;
  disableRemove?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  onToggleExpand?: (index: number) => void;
  duplicateWarning?: string;
}

function InvoiceLineRowBase({
  index,
  line,
  invoiceType,
  computedLine,
  onChange,
  onItemSelect,
  onRemove,
  disableRemove = false,
  collapsible = false,
  expanded = true,
  onToggleExpand,
  duplicateWarning,
}: Readonly<InvoiceLineRowProps>) {
  const lineTitle = line.description.trim() || `${line.metal_code || "Item"} ${line.purity_code || ""}`.trim() || `Line #${index + 1}`;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text">Line #{index + 1}</h3>
            {collapsible ? (
              <button
                type="button"
                onClick={() => onToggleExpand?.(index)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:text-text hover:bg-surface2 transition-colors"
                aria-label={expanded ? `Collapse line ${index + 1}` : `Expand line ${index + 1}`}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted truncate mt-0.5">
            {lineTitle}
            <span className="mx-1">·</span>
            {line.net_wt || "0"} g
            <span className="mx-1">·</span>
            {formatINRCurrency(computedLine?.line_total)}
          </p>
        </div>
        <IconButton
          variant="danger"
          label="Remove line"
          onClick={() => onRemove(index)}
          disabled={disableRemove}
        >
          <TrashIcon />
        </IconButton>
      </div>

      {collapsible && !expanded ? null : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ItemSearchSelect
          value={line.item}
          onChange={(itemId, item) => onItemSelect(index, itemId, item)}
          invoiceType={invoiceType}
        />

        <Textarea
          label="Description"
          value={line.description}
          onChange={(event) => onChange(index, { description: event.target.value })}
          placeholder="e.g. 22K ring"
          maxLength={240}
          rows={2}
        />

        <div className="space-y-2">
          <Input
            label="HSN Code"
            value={line.hsn_code}
            onChange={(event) => onChange(index, { hsn_code: event.target.value })}
            placeholder="7113"
          />
          {line.huid ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted">HUID:</span>
              <span className="text-[11px] font-mono font-semibold text-text px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                {line.huid}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Input
          label="Metal"
          value={line.metal_code}
          onChange={(event) => onChange(index, { metal_code: event.target.value.toUpperCase() })}
          placeholder="GOLD"
        />
        <Input
          label="Purity"
          value={line.purity_code}
          onChange={(event) => onChange(index, { purity_code: event.target.value.toUpperCase() })}
          placeholder="22K"
        />
        <WeightInput
          label="Gross Wt"
          value={line.gross_wt}
          onChange={(event) => onChange(index, { gross_wt: event.target.value })}
        />
        <WeightInput
          label="Net Wt"
          value={line.net_wt}
          onChange={(event) => onChange(index, { net_wt: event.target.value })}
        />
        <WeightInput
          label="Stone Wt"
          value={line.stone_wt}
          onChange={(event) => onChange(index, { stone_wt: event.target.value })}
        />
        <Input
          label="Rate / gram"
          type="number"
          step="0.0001"
          min="0"
          value={line.rate_per_gram}
          onChange={(event) => onChange(index, { rate_per_gram: event.target.value })}
        />
      </div>

      {line.rate_overridden ? (
        <p className="text-xs text-amber-700">Rate overridden</p>
      ) : null}
      {line.rate_unavailable ? (
        <p className="text-xs text-amber-700">Rate unavailable — enter manually</p>
      ) : null}
      {duplicateWarning ? (
        <p className="text-xs text-amber-700">{duplicateWarning}</p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Select
          label="Making mode"
          value={line.making_mode}
          onChange={(event) => onChange(index, { making_mode: event.target.value as MakingMode })}
        >
          {MAKING_MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        <Input
          label="Making rate"
          type="number"
          step="0.0001"
          min="0"
          value={line.making_rate}
          onChange={(event) => onChange(index, { making_rate: event.target.value })}
        />
        <Input
          label="Wastage %"
          type="number"
          step="0.001"
          min="0"
          value={line.wastage_pct}
          onChange={(event) => onChange(index, { wastage_pct: event.target.value })}
        />
        <Input
          label="Hallmark fee"
          type="number"
          step="0.01"
          min="0"
          value={line.hallmarking_fee}
          onChange={(event) => onChange(index, { hallmarking_fee: event.target.value })}
        />
        <Input
          label="Stone value"
          type="number"
          step="0.01"
          min="0"
          value={line.stone_value}
          onChange={(event) => onChange(index, { stone_value: event.target.value })}
        />
        <Input
          label="GST %"
          type="number"
          step="0.01"
          min="0"
          value={line.gst_rate_pct}
          onChange={(event) => onChange(index, { gst_rate_pct: event.target.value })}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface2 px-3 py-2 text-xs text-muted grid grid-cols-2 md:grid-cols-6 gap-2">
        <div>
          <p>Metal value</p>
          <p className="text-sm text-text font-semibold">{formatINRCurrency(computedLine?.metal_value)}</p>
        </div>
        <div>
          <p>Making</p>
          <p className="text-sm text-text font-semibold">{formatINRCurrency(computedLine?.making_charge)}</p>
        </div>
        <div>
          <p>Wastage</p>
          <p className="text-sm text-text font-semibold">{formatINRCurrency(computedLine?.wastage_amount)}</p>
        </div>
        <div>
          <p>GST</p>
          <p className="text-sm text-text font-semibold">{formatINRCurrency(computedLine?.gst_amount)}</p>
        </div>
        <div>
          <p>Subtotal</p>
          <p className="text-sm text-text font-semibold">{formatINRCurrency(computedLine?.line_subtotal)}</p>
        </div>
        <div>
          <p>Line total</p>
          <p className="text-sm text-text font-semibold">{formatINRCurrency(computedLine?.line_total)}</p>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

export const InvoiceLineRow = memo(InvoiceLineRowBase);
