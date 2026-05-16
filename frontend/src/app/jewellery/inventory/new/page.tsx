"use client";

import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Yup from "yup";

import { SelectInput, TextInput } from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  type JwlMetal,
  type JwlPurity,
  useCreateItemMutation,
  useListDesignsQuery,
  useListMetalsQuery,
  useListPuritiesQuery,
} from "@/store/jewellery-api";

interface ItemFormValues {
  design: string;
  metal: string;
  purity: string;
  sku: string;
  barcode: string;
  huid: string;
  gross_wt: string;
  net_wt: string;
  stone_wt: string;
  less_wt: string;
  charge_wt: string;
  location_bin: string;
  cost_price: string;
  mrp: string;
}

const initialValues: ItemFormValues = {
  design: "",
  metal: "",
  purity: "",
  sku: "",
  barcode: "",
  huid: "",
  gross_wt: "",
  net_wt: "",
  stone_wt: "",
  less_wt: "",
  charge_wt: "",
  location_bin: "",
  cost_price: "",
  mrp: "",
};

const validationSchema = Yup.object({
  metal: Yup.string().required("Metal is required"),
  purity: Yup.string().required("Purity is required"),
  gross_wt: Yup.string().required("Gross weight is required").matches(/^\d*\.?\d{0,4}$/, "Enter a valid weight"),
  net_wt: Yup.string().required("Net weight is required").matches(/^\d*\.?\d{0,4}$/, "Enter a valid weight"),
  stone_wt: Yup.string().matches(/^\d*\.?\d{0,4}$/, "Enter a valid weight"),
  less_wt: Yup.string().matches(/^\d*\.?\d{0,4}$/, "Enter a valid weight"),
  charge_wt: Yup.string().matches(/^\d*\.?\d{0,4}$/, "Enter a valid weight"),
});

export default function NewItemPage() {
  const router = useRouter();
  const [selectedMetalCode, setSelectedMetalCode] = useState("");

  const { data: metals, isFetching: isFetchingMetals } = useListMetalsQuery();
  const { data: purities, isFetching: isFetchingPurities } = useListPuritiesQuery(
    { metal: selectedMetalCode },
    { skip: !selectedMetalCode },
  );
  const metalsList = Array.isArray(metals)
    ? metals
    : ((metals as unknown as { results?: JwlMetal[] } | undefined)?.results ?? []);
  const puritiesList = Array.isArray(purities)
    ? purities
    : ((purities as unknown as { results?: JwlPurity[] } | undefined)?.results ?? []);
  const { data: designsData } = useListDesignsQuery({});
  const [createItem] = useCreateItemMutation();

  const formik = useFormik<ItemFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      try {
        await createItem({
          design: values.design || undefined,
          metal: values.metal,
          purity: values.purity,
          sku: values.sku.trim() || undefined,
          barcode: values.barcode.trim() || undefined,
          huid: values.huid.trim() || undefined,
          gross_wt: values.gross_wt,
          net_wt: values.net_wt,
          stone_wt: values.stone_wt || undefined,
          less_wt: values.less_wt || undefined,
          charge_wt: values.charge_wt || undefined,
          location_bin: values.location_bin.trim() || undefined,
          cost_price: values.cost_price || null,
          mrp: values.mrp || null,
        }).unwrap();
        router.push("/jewellery/inventory");
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  // When metal changes, reset purity
  useEffect(() => {
    const selectedMetal = metalsList.find((m) => m.id === formik.values.metal);
    setSelectedMetalCode(selectedMetal?.code ?? "");
    if (formik.values.purity) {
      formik.setFieldValue("purity", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.metal, metalsList]);

  function fieldState(name: keyof ItemFormValues) {
    return {
      touched: Boolean(formik.touched[name]),
      error: typeof formik.errors[name] === "string" ? formik.errors[name] : undefined,
    };
  }

  const designs = designsData?.results ?? [];

  if (isFetchingMetals) {
    return (
      <Screen title="Add item" subtitle="Loading..." backHref="/jewellery/inventory">
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Add item"
      subtitle="Create a new jewellery inventory item"
      backHref="/jewellery/inventory"
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4 max-w-lg" noValidate>
        {/* Design + Metal + Purity */}
        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Item identity</p>

          <SelectInput
            label="Design"
            name="design"
            value={formik.values.design}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("design").touched}
            error={fieldState("design").error}
          >
            <option value="">— No design —</option>
            {designs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.code ? ` (${d.code})` : ""}
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Metal"
            name="metal"
            required
            value={formik.values.metal}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("metal").touched}
            error={fieldState("metal").error}
          >
            <option value="">Select metal</option>
            {metalsList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </SelectInput>

          <SelectInput
            label="Purity"
            name="purity"
            required
            value={formik.values.purity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("purity").touched}
            error={fieldState("purity").error}
            disabled={!selectedMetalCode || isFetchingPurities}
          >
            <option value="">
              {!selectedMetalCode ? "Select a metal first" : isFetchingPurities ? "Loading…" : "Select purity"}
            </option>
            {puritiesList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} ({p.pct}%)
              </option>
            ))}
          </SelectInput>
        </div>

        {/* Identifiers */}
        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Identifiers</p>

          <TextInput
            label="SKU"
            name="sku"
            placeholder="Stock keeping unit (optional)"
            value={formik.values.sku}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("sku").touched}
            error={fieldState("sku").error}
          />

          <TextInput
            label="Barcode"
            name="barcode"
            placeholder="Barcode (optional)"
            value={formik.values.barcode}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("barcode").touched}
            error={fieldState("barcode").error}
          />

          <TextInput
            label="HUID"
            name="huid"
            placeholder="BIS hallmark HUID (optional)"
            value={formik.values.huid}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("huid").touched}
            error={fieldState("huid").error}
          />
        </div>

        {/* Weights */}
        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Weights (grams)</p>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Gross weight"
              name="gross_wt"
              required
              placeholder="0.0000"
              inputMode="decimal"
              value={formik.values.gross_wt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fieldState("gross_wt").touched}
              error={fieldState("gross_wt").error}
            />

            <TextInput
              label="Net weight"
              name="net_wt"
              required
              placeholder="0.0000"
              inputMode="decimal"
              value={formik.values.net_wt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fieldState("net_wt").touched}
              error={fieldState("net_wt").error}
            />

            <TextInput
              label="Stone weight"
              name="stone_wt"
              placeholder="0.0000"
              inputMode="decimal"
              value={formik.values.stone_wt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fieldState("stone_wt").touched}
              error={fieldState("stone_wt").error}
            />

            <TextInput
              label="Less weight"
              name="less_wt"
              placeholder="0.0000"
              inputMode="decimal"
              value={formik.values.less_wt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fieldState("less_wt").touched}
              error={fieldState("less_wt").error}
            />

            <TextInput
              label="Charge weight"
              name="charge_wt"
              placeholder="0.0000"
              inputMode="decimal"
              value={formik.values.charge_wt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fieldState("charge_wt").touched}
              error={fieldState("charge_wt").error}
            />
          </div>
        </div>

        {/* Location + Pricing */}
        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Location &amp; pricing</p>

          <TextInput
            label="Location bin"
            name="location_bin"
            placeholder="e.g. SHELF-A1 (optional)"
            value={formik.values.location_bin}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("location_bin").touched}
            error={fieldState("location_bin").error}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Cost price"
              name="cost_price"
              placeholder="0.00"
              inputMode="decimal"
              value={formik.values.cost_price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fieldState("cost_price").touched}
              error={fieldState("cost_price").error}
            />

            <TextInput
              label="MRP"
              name="mrp"
              placeholder="0.00"
              inputMode="decimal"
              value={formik.values.mrp}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fieldState("mrp").touched}
              error={fieldState("mrp").error}
            />
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => router.push("/jewellery/inventory")}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={formik.isSubmitting}>
            Add item
          </Button>
        </div>
      </form>
    </Screen>
  );
}
