"use client";

import { useEffect, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { JwlNumberSeries } from "@/store/jewellery-api";
import { useListNumberSeriesQuery, useUpdateNumberSeriesMutation } from "@/store/jewellery-api";

interface SeriesRowState {
  prefix: string;
  padding: string;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
}

function NumberSeriesRow({ series }: Readonly<{ series: JwlNumberSeries }>) {
  const [state, setState] = useState<SeriesRowState>({
    prefix: series.prefix,
    padding: String(series.padding),
    dirty: false,
    saving: false,
    saved: false,
  });

  const [updateNumberSeries] = useUpdateNumberSeriesMutation();

  // Sync state if series prop changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      prefix: series.prefix,
      padding: String(series.padding),
    }));
  }, [series.prefix, series.padding]);

  function handleChange(field: "prefix" | "padding") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({ ...prev, [field]: e.target.value, dirty: true, saved: false }));
    };
  }

  async function handleSave() {
    setState((prev) => ({ ...prev, saving: true }));
    try {
      await updateNumberSeries({
        id: series.id,
        prefix: state.prefix,
        padding: parseInt(state.padding, 10) || series.padding,
      }).unwrap();
      setState((prev) => ({ ...prev, dirty: false, saving: false, saved: true }));
      setTimeout(() => setState((prev) => ({ ...prev, saved: false })), 2000);
    } catch {
      setState((prev) => ({ ...prev, saving: false }));
    }
  }

  return (
    <div className="app-panel p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-text">{series.voucher_type.replaceAll("_", " ")}</p>
          <p className="text-xs text-muted">Next #: {series.next_number}</p>
        </div>
        {state.saved ? (
          <span className="text-xs text-success-600 font-medium">Saved</span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prefix"
          name={`prefix-${series.id}`}
          placeholder="e.g. INV"
          value={state.prefix}
          onChange={handleChange("prefix")}
        />
        <Input
          label="Padding"
          name={`padding-${series.id}`}
          placeholder="e.g. 4"
          inputMode="numeric"
          value={state.padding}
          onChange={handleChange("padding")}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <p className="text-xs text-muted flex-1">
          Preview: {state.prefix}{String(series.next_number).padStart(parseInt(state.padding, 10) || series.padding, "0")}
        </p>
        {state.dirty ? (
          <Button size="sm" loading={state.saving} onClick={handleSave}>
            Save
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function NumberSeriesPage() {
  const { data, isFetching } = useListNumberSeriesQuery();
  const seriesList = data?.results ?? [];

  return (
    <Screen
      title="Number series"
      subtitle="Set up voucher number prefixes, padding, and next counters."
      backHref="/jewellery/master"
    >
      <div className="space-y-4 max-w-2xl">
        {isFetching ? <SkeletonList count={4} /> : null}

        {!isFetching && seriesList.length === 0 ? (
          <EmptyState
            title="No number series configured"
            description="Number series are pre-seeded. Contact your administrator if none appear."
          />
        ) : null}

        {seriesList.map((series) => (
          <NumberSeriesRow key={series.id} series={series} />
        ))}
      </div>
    </Screen>
  );
}
