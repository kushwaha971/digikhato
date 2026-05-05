import type { JwlCalculateResult } from "@/store/jewellery-api";

function fmt(v: string | number | undefined) {
  if (v === undefined || v === null) return "₹0.00";
  return `₹${parseFloat(String(v)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface GstBreakdownProps {
  result: Partial<JwlCalculateResult>;
  discountAmount?: string;
  className?: string;
}

export function GstBreakdown({ result, discountAmount, className }: GstBreakdownProps) {
  const isIntraState = parseFloat(result.cgst ?? "0") > 0;
  const totalGst = (parseFloat(result.cgst ?? "0") + parseFloat(result.sgst ?? "0") +
    parseFloat(result.igst ?? "0") + parseFloat(result.hallmark_gst ?? "0")).toFixed(2);

  return (
    <div className={`rounded-2xl border border-border bg-surface divide-y divide-border text-sm ${className ?? ""}`}>
      <div className="px-4 py-3 flex justify-between">
        <span className="text-muted">Gross Amount</span>
        <span className="font-medium text-text">{fmt(result.gross_amount)}</span>
      </div>

      {parseFloat(discountAmount ?? "0") > 0 && (
        <div className="px-4 py-3 flex justify-between text-success-700">
          <span>Discount</span>
          <span className="font-medium">− {fmt(discountAmount)}</span>
        </div>
      )}

      <div className="px-4 py-3 flex justify-between">
        <span className="text-muted">Taxable Amount</span>
        <span className="font-medium text-text">{fmt(result.taxable_amount)}</span>
      </div>

      {parseFloat(result.stone_value ?? "0") > 0 && (
        <div className="px-4 py-3 flex justify-between">
          <span className="text-muted">Stone Value (0% GST)</span>
          <span className="font-medium text-text">{fmt(result.stone_value)}</span>
        </div>
      )}

      {isIntraState ? (
        <>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-muted">CGST (1.5%)</span>
            <span className="font-medium text-text">{fmt(result.cgst)}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-muted">SGST (1.5%)</span>
            <span className="font-medium text-text">{fmt(result.sgst)}</span>
          </div>
        </>
      ) : (
        parseFloat(result.igst ?? "0") > 0 && (
          <div className="px-4 py-3 flex justify-between">
            <span className="text-muted">IGST (3%)</span>
            <span className="font-medium text-text">{fmt(result.igst)}</span>
          </div>
        )
      )}

      {parseFloat(result.hallmark_gst ?? "0") > 0 && (
        <div className="px-4 py-3 flex justify-between">
          <span className="text-muted">Hallmarking GST (18%)</span>
          <span className="font-medium text-text">{fmt(result.hallmark_gst)}</span>
        </div>
      )}

      <div className="px-4 py-3 flex justify-between">
        <span className="text-muted">Total GST</span>
        <span className="font-medium text-text">{fmt(totalGst)}</span>
      </div>

      {parseFloat(result.round_off ?? "0") !== 0 && (
        <div className="px-4 py-3 flex justify-between text-muted">
          <span>Round-off</span>
          <span>{fmt(result.round_off)}</span>
        </div>
      )}

      <div className="px-4 py-4 flex justify-between bg-surface2 rounded-b-2xl">
        <span className="font-bold text-text text-base">Total Payable</span>
        <span className="font-bold text-text text-base">{fmt(result.total_amount)}</span>
      </div>
    </div>
  );
}
