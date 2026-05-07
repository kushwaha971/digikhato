"use client";

import { useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { JwlTaxSlab } from "@/store/jewellery-api";
import { useCreateTaxSlabMutation, useListTaxSlabsQuery } from "@/store/jewellery-api";

interface TaxSlabFormState {
  name: string;
  rate_pct: string;
  applies_to: string;
  effective_from: string;
}

const EMPTY_FORM: TaxSlabFormState = {
  name: "",
  rate_pct: "",
  applies_to: "",
  effective_from: "",
};

function TaxSlabCard({ slab }: Readonly<{ slab: JwlTaxSlab }>) {
  return (
    <div className="app-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text truncate">{slab.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {slab.applies_to || "All items"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-primary-600">{slab.rate_pct}%</p>
          {slab.effective_to ? null : (
            <span className="text-xs bg-success-100 text-success-700 px-1.5 py-0.5 rounded-full font-medium">Active</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <p className="text-xs text-muted">Effective from</p>
          <p className="text-sm text-text">{slab.effective_from || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Effective to</p>
          <p className="text-sm text-text">{slab.effective_to ?? "Active"}</p>
        </div>
      </div>
    </div>
  );
}

function AddTaxSlabForm({ onSuccess }: Readonly<{ onSuccess: () => void }>) {
  const [form, setForm] = useState<TaxSlabFormState>(EMPTY_FORM);
  const [createTaxSlab, { isLoading }] = useCreateTaxSlabMutation();
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.rate_pct.trim()) {
      setError("Rate % is required");
      return;
    }
    setError("");
    try {
      await createTaxSlab({
        name: form.name.trim(),
        rate_pct: form.rate_pct.trim(),
        applies_to: form.applies_to.trim() || undefined,
        effective_from: form.effective_from || undefined,
      }).unwrap();
      setForm(EMPTY_FORM);
      onSuccess();
    } catch {
      setError("Failed to create tax slab. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="app-panel p-4 space-y-3">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Add slab</p>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Name"
          name="name"
          required
          placeholder="e.g. GST 3%"
          value={form.name}
          onChange={handleChange}
        />
        <Input
          label="Rate %"
          name="rate_pct"
          required
          placeholder="e.g. 3"
          inputMode="decimal"
          value={form.rate_pct}
          onChange={handleChange}
        />
      </div>

      <Input
        label="Applies to"
        name="applies_to"
        placeholder="e.g. jewellery, making_charge (optional)"
        value={form.applies_to}
        onChange={handleChange}
      />

      <Input
        label="Effective from"
        name="effective_from"
        type="date"
        value={form.effective_from}
        onChange={handleChange}
      />

      {error ? <p className="text-sm text-danger-600">{error}</p> : null}

      <Button type="submit" size="sm" loading={isLoading}>
        Save slab
      </Button>
    </form>
  );
}

export default function TaxSlabsPage() {
  const { data, isFetching } = useListTaxSlabsQuery();
  const slabs = data?.results ?? [];

  return (
    <Screen
      title="Tax slabs"
      subtitle="Configure GST rate slabs and their effective date ranges."
      backHref="/jewellery/master"
    >
      <div className="space-y-4 max-w-2xl">
        {isFetching ? <SkeletonList count={3} /> : null}

        {!isFetching && slabs.length === 0 ? (
          <EmptyState
            title="No tax slabs configured"
            description="Add your first GST slab below."
          />
        ) : null}

        {slabs.length > 0 ? (
          <div className="space-y-3">
            {slabs.map((slab) => (
              <TaxSlabCard key={slab.id} slab={slab} />
            ))}
          </div>
        ) : null}

        <AddTaxSlabForm onSuccess={() => {}} />
      </div>
    </Screen>
  );
}
