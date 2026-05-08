"use client";

import { useCallback, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useFormik } from "formik";
import * as Yup from "yup";

import { TextInput } from "@/components/forms/system";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { PlusIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import type { JwlDesign } from "@/store/jewellery-api";
import { useCreateDesignMutation, useListDesignsQuery } from "@/store/jewellery-api";

interface DesignFormValues {
  name: string;
  code: string;
  default_weight: string;
  default_labour: string;
  default_stones: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  default_weight: Yup.string().matches(/^\d*\.?\d{0,4}$/, "Enter a valid weight (up to 4 decimal places)"),
});

const initialValues: DesignFormValues = {
  name: "",
  code: "",
  default_weight: "",
  default_labour: "",
  default_stones: "",
};

function DesignCard({ design }: Readonly<{ design: JwlDesign }>) {
  return (
    <div className="app-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text truncate">
            {design.name}
            {design.code ? <span className="ml-2 text-xs text-muted font-normal">{design.code}</span> : null}
          </p>
          {design.category ? (
            <p className="text-xs text-muted mt-0.5">Category linked</p>
          ) : (
            <p className="text-xs text-muted mt-0.5">No category</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <p className="text-xs text-muted">Default wt</p>
          <p className="text-sm font-semibold text-text">{design.default_weight ? `${design.default_weight} g` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Labour</p>
          <p className="text-sm font-semibold text-text">{design.default_labour || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Stones</p>
          <p className="text-sm font-semibold text-text">{design.default_stones || "—"}</p>
        </div>
      </div>
    </div>
  );
}

export default function DesignsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useListDesignsQuery({
    search: debouncedSearch.trim() || undefined,
    page,
  });
  const [createDesign] = useCreateDesignMutation();

  const formik = useFormik<DesignFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      try {
        await createDesign({
          name: values.name.trim(),
          code: values.code.trim() || undefined,
          default_weight: values.default_weight.trim() || undefined,
          default_labour: values.default_labour.trim() || undefined,
          default_stones: values.default_stones.trim() || undefined,
        }).unwrap();
        setDrawerOpen(false);
        formik.resetForm();
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const loadMore = useCallback(() => setPage((prev) => prev + 1), []);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlDesign>(data, isFetching, page, loadMore);

  function fieldState(name: keyof DesignFormValues) {
    return {
      touched: Boolean(formik.touched[name]),
      error: typeof formik.errors[name] === "string" ? formik.errors[name] : undefined,
    };
  }

  return (
    <>
      <Screen
        title="Designs"
        subtitle="Design library with default weights, stones, and labour."
        backHref="/jewellery/master"
        actions={(
          <Button size="sm" leftIcon={<PlusIcon />} onClick={() => setDrawerOpen(true)}>Add design</Button>
        )}
      >
        <div className="space-y-4 max-w-2xl">
          <StickyGlobalSearchBar
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Search designs by name or code"
            sticky={false}
          />

          {data ? <p className="text-xs text-muted">{data.count} total designs</p> : null}

          {isFetching && page === 1 ? <SkeletonList count={4} /> : null}

          {!isFetching && items.length === 0 ? (
            <EmptyState
              title="No designs found"
              description="Add your first design to the library."
              action={{ label: "Add design", onClick: () => setDrawerOpen(true) }}
            />
          ) : null}

          {items.length > 0 ? (
            <>
              <div className="space-y-3">
                {items.map((design) => (
                  <DesignCard key={design.id} design={design} />
                ))}
              </div>

              {hasMore ? <div ref={sentinelRef} className="h-1 mt-2" /> : null}
              {isFetching && page > 1 ? (
                <div className="py-4 flex justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </Screen>

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          formik.resetForm();
        }}
        title="Add design"
        size="lg"
        footer={(
          <>
            <Button type="button" size="sm" variant="secondary" onClick={() => { setDrawerOpen(false); formik.resetForm(); }}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void formik.submitForm()} loading={formik.isSubmitting}>
              Add design
            </Button>
          </>
        )}
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
          <div className="rounded-xl border border-border p-4 space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Design info</p>
            <TextInput label="Name" name="name" required value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("name").touched} error={fieldState("name").error} />
            <TextInput label="Code" name="code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("code").touched} error={fieldState("code").error} />
          </div>
          <div className="rounded-xl border border-border p-4 space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Defaults</p>
            <TextInput label="Default weight (g)" name="default_weight" inputMode="decimal" value={formik.values.default_weight} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("default_weight").touched} error={fieldState("default_weight").error} />
            <TextInput label="Default labour" name="default_labour" inputMode="decimal" value={formik.values.default_labour} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("default_labour").touched} error={fieldState("default_labour").error} />
            <TextInput label="Default stones" name="default_stones" value={formik.values.default_stones} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("default_stones").touched} error={fieldState("default_stones").error} />
          </div>
        </form>
      </Drawer>
    </>
  );
}
