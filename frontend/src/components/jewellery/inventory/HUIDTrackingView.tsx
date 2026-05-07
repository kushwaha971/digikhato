"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useListItemsQuery } from "@/store/jewellery-api";

type HuidFilter = "ALL" | "HAS_HUID" | "MISSING_HUID" | "HALLMARKED";

export function HUIDTrackingView() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HuidFilter>("ALL");
  const debounced = useDebounce(search, 300);

  const { data, isFetching } = useListItemsQuery({
    search: debounced.trim() || undefined,
    page_size: 200,
  });

  const rows = data?.results ?? [];

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "HAS_HUID") return Boolean(row.huid);
      if (filter === "MISSING_HUID") return !row.huid;
      if (filter === "HALLMARKED") return row.hallmark_status === "HALLMARKED" || row.hallmark_status === "HUID_ASSIGNED";
      return true;
    });
  }, [rows, filter]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label="Search HUID / SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="AB1234"
        />
        <Select label="Filter" value={filter} onChange={(e) => setFilter(e.target.value as HuidFilter)}>
          <option value="ALL">All</option>
          <option value="HAS_HUID">Has HUID</option>
          <option value="MISSING_HUID">Missing HUID</option>
          <option value="HALLMARKED">Hallmarked</option>
        </Select>
      </div>

      {isFetching ? <SkeletonList count={6} /> : null}

      {!isFetching && filtered.length === 0 ? (
        <EmptyState title="No items found" description="No inventory rows match the selected HUID filters." />
      ) : null}

      {!isFetching && filtered.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-xs text-muted font-semibold">
            <p className="col-span-2">SKU</p>
            <p className="col-span-3">Design</p>
            <p className="col-span-2">HUID</p>
            <p className="col-span-2">Metal/Purity</p>
            <p className="col-span-2">Hallmark</p>
            <p className="col-span-1">Action</p>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 text-sm">
                <p className="md:col-span-2 font-semibold text-text">{item.sku || item.barcode || item.id.slice(0, 8)}</p>
                <p className="md:col-span-3 text-muted">{item.design_name || "-"}</p>
                <div className="md:col-span-2">
                  {item.huid ? (
                    <span className="font-mono text-text">{item.huid}</span>
                  ) : (
                    <Badge variant="danger">No HUID</Badge>
                  )}
                </div>
                <p className="md:col-span-2 text-muted">{item.metal_code} / {item.purity_code}</p>
                <div className="md:col-span-2">
                  <Badge variant={item.hallmark_status === "NOT_HALLMARKED" ? "warning" : "success"}>
                    {item.hallmark_status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <div className="md:col-span-1">
                  <Link href={`/jewellery/inventory/${item.id}`} className="text-primary-600 hover:underline text-xs">
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
