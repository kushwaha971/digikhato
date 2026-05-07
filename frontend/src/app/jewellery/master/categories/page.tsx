"use client";

import { useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { JwlCategoryNode } from "@/store/jewellery-api";
import { useCreateCategoryMutation, useListCategoriesQuery } from "@/store/jewellery-api";

interface CategoryFormState {
  name: string;
  hsn_code: string;
  default_wastage_pct: string;
  parent: string | null;
}

const EMPTY_FORM: CategoryFormState = {
  name: "",
  hsn_code: "",
  default_wastage_pct: "",
  parent: null,
};

function CategoryForm({
  parent,
  onCancel,
  onSuccess,
}: Readonly<{
  parent: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}>) {
  const [form, setForm] = useState<CategoryFormState>({ ...EMPTY_FORM, parent });
  const [createCategory, { isLoading }] = useCreateCategoryMutation();
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
    setError("");
    try {
      await createCategory({
        name: form.name.trim(),
        hsn_code: form.hsn_code.trim() || undefined,
        default_wastage_pct: form.default_wastage_pct.trim() || undefined,
        parent: form.parent ?? undefined,
      }).unwrap();
      onSuccess();
    } catch {
      setError("Failed to create category. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="app-panel p-4 space-y-3 max-w-md">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide">
        {parent ? "Add subcategory" : "Add root category"}
      </p>

      <Input
        label="Name"
        name="name"
        required
        placeholder="Category name"
        value={form.name}
        onChange={handleChange}
      />

      <Input
        label="HSN code"
        name="hsn_code"
        placeholder="e.g. 7113"
        value={form.hsn_code}
        onChange={handleChange}
      />

      <Input
        label="Default wastage %"
        name="default_wastage_pct"
        placeholder="e.g. 2.5"
        inputMode="decimal"
        value={form.default_wastage_pct}
        onChange={handleChange}
      />

      {error ? <p className="text-sm text-danger-600">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={isLoading}>
          Save
        </Button>
      </div>
    </form>
  );
}

function CategoryRow({
  node,
  depth,
}: Readonly<{
  node: JwlCategoryNode;
  depth: number;
}>) {
  const [expanded, setExpanded] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-surface2 transition-colors"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center text-muted text-xs shrink-0"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="w-5 h-5 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate">{node.name}</p>
          <p className="text-xs text-muted">
            {node.hsn_code ? `HSN: ${node.hsn_code}` : "No HSN"}
            {node.default_wastage_pct ? ` · Wastage: ${node.default_wastage_pct}%` : ""}
          </p>
        </div>

        <button
          type="button"
          className="text-xs text-primary-600 hover:underline shrink-0"
          onClick={() => setShowAddChild((prev) => !prev)}
        >
          + Sub
        </button>
      </div>

      {showAddChild ? (
        <div className="ml-8 my-2">
          <CategoryForm
            parent={node.id}
            onCancel={() => setShowAddChild(false)}
            onSuccess={() => setShowAddChild(false)}
          />
        </div>
      ) : null}

      {expanded && node.children.length > 0 ? (
        <div>
          {node.children.map((child) => (
            <CategoryRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CategoriesPage() {
  const { data: categories, isFetching } = useListCategoriesQuery();
  const [showAddRoot, setShowAddRoot] = useState(false);

  return (
    <Screen
      title="Categories"
      subtitle="Manage jewellery categories, HSN codes, and wastage defaults."
      backHref="/jewellery/master"
      actions={(
        <Button size="sm" onClick={() => setShowAddRoot((prev) => !prev)} leftIcon={showAddRoot ? undefined : <PlusIcon />}>
          {showAddRoot ? "Cancel" : "Add root category"}
        </Button>
      )}
    >
      <div className="space-y-4 max-w-2xl">
        {showAddRoot ? (
          <CategoryForm
            parent={null}
            onCancel={() => setShowAddRoot(false)}
            onSuccess={() => setShowAddRoot(false)}
          />
        ) : null}

        {isFetching ? <SkeletonList count={4} /> : null}

        {!isFetching && (!categories || categories.length === 0) ? (
          <EmptyState
            title="No categories yet"
            description="Add your first root category to start organising your jewellery."
            action={{ label: "Add root category", onClick: () => setShowAddRoot(true) }}
          />
        ) : null}

        {!isFetching && categories && categories.length > 0 ? (
          <div className="app-panel divide-y divide-border">
            {categories.map((node) => (
              <CategoryRow key={node.id} node={node} depth={0} />
            ))}
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
