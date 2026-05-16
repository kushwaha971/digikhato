"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateTransferMutation } from "@/store/jewellery-api";

interface TransferLine {
  item: string;
  qty: number;
  weight: string;
}

export default function NewTransferPage() {
  const router = useRouter();
  const [createTransfer, createState] = useCreateTransferMutation();

  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([{ item: "", qty: 1, weight: "" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const addLine = () => setLines((prev) => [...prev, { item: "", qty: 1, weight: "" }]);

  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  const updateLine = (index: number, field: keyof TransferLine, value: string | number) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fromBranch.trim()) newErrors.fromBranch = "From branch is required.";
    if (!toBranch.trim()) newErrors.toBranch = "To branch is required.";
    if (
      fromBranch.trim() &&
      toBranch.trim() &&
      fromBranch.trim().toLowerCase() === toBranch.trim().toLowerCase()
    ) {
      newErrors.toBranch = "Destination branch must be different from source branch.";
    }
    const validLines = lines.filter((l) => l.item.trim());
    if (validLines.length === 0) newErrors.lines = "At least one item line is required.";
    validLines.forEach((line, index) => {
      const weightNumber = Number(line.weight);
      if (!line.weight.trim() || !Number.isFinite(weightNumber) || weightNumber <= 0) {
        newErrors[`line.${index}.weight`] = "Weight must be greater than 0.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      from_branch: fromBranch.trim(),
      to_branch: toBranch.trim(),
      notes: notes.trim(),
      lines: lines
        .filter((l) => l.item.trim())
        .map((l) => ({
          item: l.item.trim(),
          qty: l.qty,
          weight: l.weight || undefined,
        })),
    };

    try {
      setSubmitError("");
      await createTransfer(payload).unwrap();
      router.push("/jewellery/inventory/transfers");
    } catch (err: unknown) {
      const fallback = "Could not create transfer. Please review item state and branch details.";
      if (typeof err === "object" && err && "data" in err) {
        const detail = (err as { data?: { detail?: string } }).data?.detail;
        setSubmitError(detail || fallback);
      } else {
        setSubmitError(fallback);
      }
    }
  };

  return (
    <Screen
      title="New transfer"
      subtitle="Create a stock transfer between branches."
      backHref="/jewellery/inventory/transfers"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Branch fields */}
        <section className="app-panel rounded-2xl p-4 space-y-3">
          <h2 className="text-base font-semibold text-text">Transfer details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="From branch"
              value={fromBranch}
              onChange={(e) => {
                setFromBranch(e.target.value);
                if (errors.fromBranch) setErrors((prev) => ({ ...prev, fromBranch: "" }));
              }}
              placeholder="Origin branch name"
              error={errors.fromBranch}
              helperText={errors.fromBranch}
            />
            <Input
              label="To branch *"
              value={toBranch}
              onChange={(e) => {
                setToBranch(e.target.value);
                if (errors.toBranch) setErrors((prev) => ({ ...prev, toBranch: "" }));
              }}
              placeholder="Destination branch name"
              error={errors.toBranch}
              helperText={errors.toBranch}
            />
          </div>
          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any notes about this transfer..."
          />
        </section>

        {/* Item lines */}
        <section className="app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">Item lines</h2>
            <Button type="button" size="sm" variant="secondary" onClick={addLine}>
              Add line
            </Button>
          </header>
          <div className="p-4 space-y-3">
            {errors.lines ? (
              <p className="text-sm text-danger-600">{errors.lines}</p>
            ) : null}
            {lines.map((line, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-surface2/40 p-3 space-y-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    label="Item SKU / ID"
                    value={line.item}
                    onChange={(e) => updateLine(index, "item", e.target.value)}
                    placeholder="SKU or item ID"
                  />
                  <Input
                    label="Qty"
                    type="number"
                    value={String(line.qty)}
                    onChange={(e) => updateLine(index, "qty", Math.max(1, parseInt(e.target.value, 10) || 1))}
                    placeholder="1"
                  />
                  <Input
                    label="Weight (g)"
                    value={line.weight}
                    onChange={(e) => updateLine(index, "weight", e.target.value)}
                    placeholder="0.00"
                    error={errors[`line.${index}.weight`]}
                    helperText={errors[`line.${index}.weight`]}
                  />
                </div>
                {lines.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => removeLine(index)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {submitError ? (
          <p className="text-sm text-danger-600">{submitError}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="sm"
            variant="success"
            loading={createState.isLoading}
          >
            Create transfer
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => router.push("/jewellery/inventory/transfers")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Screen>
  );
}
