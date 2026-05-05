"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatINRCurrency } from "@/utils/jewellery/formulas";
import type { PaymentMode } from "@/store/jewellery-api";

export interface InvoicePaymentDraft {
  mode: PaymentMode;
  amount: string;
  reference: string;
}

interface PaymentSplitTableProps {
  rows: InvoicePaymentDraft[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<InvoicePaymentDraft>) => void;
  totalPayable?: string;
  disableAdd?: boolean;
}

export function PaymentSplitTable({
  rows,
  onAdd,
  onRemove,
  onChange,
  totalPayable,
  disableAdd = false,
}: PaymentSplitTableProps) {
  const totalPaid = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const balance = (Number(totalPayable) || 0) - totalPaid;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Payment split</h3>
        <Button type="button" size="sm" className="min-h-11" onClick={onAdd} disabled={disableAdd}>
          Add payment row
        </Button>
      </div>

      <div className="md:hidden p-3 space-y-3">
        {rows.map((row, index) => (
          <div key={`payment-mobile-${index}`} className="rounded-xl border border-border bg-surface2/40 p-3 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select
                label="Mode"
                value={row.mode}
                onChange={(event) => onChange(index, { mode: event.target.value as PaymentMode })}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank transfer</option>
                <option value="ADVANCE">Advance</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </Select>
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                value={row.amount}
                onChange={(event) => onChange(index, { amount: event.target.value })}
              />
            </div>
            <Input
              label="Reference"
              value={row.reference}
              onChange={(event) => onChange(index, { reference: event.target.value })}
              placeholder="Txn / cheque ref"
            />
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              variant="secondary"
              onClick={() => onRemove(index)}
              disabled={rows.length === 1}
              fullWidth
            >
              Remove payment row
            </Button>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-muted">
            <tr>
              <th className="text-left font-semibold px-4 py-2">Mode</th>
              <th className="text-left font-semibold px-4 py-2">Amount</th>
              <th className="text-left font-semibold px-4 py-2">Reference</th>
              <th className="text-left font-semibold px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`payment-${index}`} className="border-t border-border">
                <td className="px-4 py-2 min-w-[180px]">
                  <Select
                    value={row.mode}
                    onChange={(event) => onChange(index, { mode: event.target.value as PaymentMode })}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK">Bank transfer</option>
                    <option value="ADVANCE">Advance</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </td>
                <td className="px-4 py-2 min-w-[160px]">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.amount}
                    onChange={(event) => onChange(index, { amount: event.target.value })}
                  />
                </td>
                <td className="px-4 py-2 min-w-[220px]">
                  <Input
                    value={row.reference}
                    onChange={(event) => onChange(index, { reference: event.target.value })}
                    placeholder="Txn / cheque ref"
                  />
                </td>
                <td className="px-4 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onRemove(index)}
                    disabled={rows.length === 1}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border bg-surface2 text-sm grid grid-cols-1 md:grid-cols-3 gap-2">
        <p className="text-muted">Total paid: <span className="text-text font-semibold">{formatINRCurrency(totalPaid)}</span></p>
        <p className="text-muted">Payable: <span className="text-text font-semibold">{formatINRCurrency(totalPayable)}</span></p>
        <p className="text-muted">Balance: <span className="text-text font-semibold">{formatINRCurrency(balance)}</span></p>
      </div>
    </div>
  );
}
