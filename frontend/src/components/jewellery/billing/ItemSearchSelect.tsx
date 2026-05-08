"use client";

import { memo, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/Input";
import { useDebounce } from "@/hooks/useDebounce";
import { useListItemsQuery, useLazyScanItemQuery, type JwlItem, type InvoiceType } from "@/store/jewellery-api";

interface ItemSearchSelectProps {
  value: string;
  onChange: (itemId: string, item?: JwlItem) => void;
  invoiceType?: InvoiceType;
  label?: string;
  error?: string;
}

function ItemSearchSelectBase({
  value,
  onChange,
  invoiceType,
  label = "Inventory item",
  error,
}: Readonly<ItemSearchSelectProps>) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JwlItem | undefined>();

  // Barcode scan detection — scanner sends chars in <50ms bursts ending with Enter
  const lastKeyTs = useRef<number>(0);
  const scanBuffer = useRef<string>("");

  const debouncedSearch = useDebounce(search, 300);
  const [triggerScan] = useLazyScanItemQuery();

  // Credit notes need SOLD items; everything else needs IN_STOCK
  const statusFilter = invoiceType === "CREDIT_NOTE" ? "SOLD" : "IN_STOCK";

  const { data, isFetching } = useListItemsQuery(
    { search: debouncedSearch.trim(), status: statusFilter, page_size: 30 },
    { skip: debouncedSearch.trim().length < 2 },
  );

  const results = data?.results ?? [];

  function handleSelect(item: JwlItem) {
    setSelectedItem(item);
    onChange(item.id, item);
    setSearch("");
    setOpen(false);
  }

  function handleClear() {
    setSelectedItem(undefined);
    onChange("", undefined);
    setSearch("");
  }

  async function handleBarcodeScan(code: string) {
    try {
      const item = await triggerScan({ code, status: statusFilter }).unwrap();
      handleSelect(item as JwlItem);
    } catch {
      // Not found — fall through and let user see search results
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const now = Date.now();
    const gap = now - lastKeyTs.current;
    lastKeyTs.current = now;

    if (e.key === "Enter") {
      // If we have a long buffer that arrived in rapid succession, it's a scan
      if (scanBuffer.current.length >= 4 && gap < 100) {
        void handleBarcodeScan(scanBuffer.current);
        scanBuffer.current = "";
        e.preventDefault();
        return;
      }
      scanBuffer.current = "";
      return;
    }

    if (e.key.length === 1) {
      // Gap < 50ms → rapid input (scanner); gap >= 50ms → human typing
      scanBuffer.current = gap < 50 ? scanBuffer.current + e.key : e.key;
    }
  }

  const displayLabel = selectedItem
    ? `${selectedItem.sku || selectedItem.barcode || selectedItem.huid || "Selected item"}${selectedItem.design_name ? ` — ${selectedItem.design_name}` : ""}`
    : "Selected item";

  return (
    <div className="relative">
      <Input
        id={id}
        label={label}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Type SKU, barcode, or HUID"
        error={error}
      />

      {/* Selected item chip */}
      {value && !search ? (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium">
            {displayLabel}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted hover:text-danger-600 transition-colors"
            aria-label="Clear item selection"
          >
            ✕ Clear
          </button>
        </div>
      ) : null}

      {/* Hint: need more characters */}
      {open && search.trim().length === 1 ? (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-xl">
          <div className="px-4 py-3 text-sm text-muted">Type at least 2 characters to search</div>
        </div>
      ) : null}

      {/* Results dropdown */}
      {open && debouncedSearch.trim().length >= 2 ? (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {results.length === 30 ? (
            <div className="px-3 py-1.5 text-xs text-muted bg-surface2 border-b border-border">
              Showing first 30 — type more to narrow results
            </div>
          ) : null}

          {isFetching ? (
            <div className="px-4 py-3 text-sm text-muted">Searching…</div>
          ) : null}

          {!isFetching && results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">
              No items found for &quot;{debouncedSearch}&quot;
            </div>
          ) : null}

          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface2 transition-colors border-b border-border last:border-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-text">{item.sku || item.barcode || item.huid || "Item"}</span>
                  {item.design_name ? (
                    <span className="text-muted ml-1.5 truncate">— {item.design_name}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium whitespace-nowrap">
                    {item.metal_code}/{item.purity_code}
                  </span>
                  <span className="text-xs text-muted whitespace-nowrap">{item.net_wt}g</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const ItemSearchSelect = memo(ItemSearchSelectBase);
