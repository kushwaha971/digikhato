"use client";

import { useState, useId } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { useListCustomersQuery } from "@/store/jewellery-api";
import type { JwlCustomer } from "@/store/jewellery-api";

interface CustomerSearchSelectProps {
  /** Currently selected customer ID */
  value: string;
  /** Called with customer ID when user selects; called with "" when cleared */
  onChange: (customerId: string, customer?: JwlCustomer) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  /** If true, show selected customer name below the search input */
  showSelectedName?: boolean;
}

export function CustomerSearchSelect({
  value,
  onChange,
  label = "Customer",
  placeholder = "Search by name or mobile",
  error,
  showSelectedName = true,
}: Readonly<CustomerSearchSelectProps>) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useListCustomersQuery(
    { search: debouncedSearch.trim() || undefined },
    { skip: debouncedSearch.trim().length < 1 },
  );

  const results = data?.results ?? [];

  // Find selected customer name for display — re-query by ID if not in results
  const { data: selectedData } = useListCustomersQuery(
    { search: value },
    { skip: !value || !!results.find((c) => c.id === value) },
  );
  const selectedCustomer =
    results.find((c) => c.id === value) ??
    selectedData?.results.find((c) => c.id === value);

  function handleSelect(customer: JwlCustomer) {
    onChange(customer.id, customer);
    setSearch("");
    setOpen(false);
  }

  function handleClear() {
    onChange("", undefined);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        label={label}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        error={error}
      />

      {/* Selected customer chip */}
      {showSelectedName && value && !search && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium">
            {selectedCustomer?.name ?? "Selected customer"}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted hover:text-danger-600 transition-colors"
            aria-label="Clear customer selection"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Dropdown */}
      {open && search.trim().length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {isFetching && (
            <div className="px-4 py-3 text-sm text-muted">Searching…</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted">No customers found</div>
          )}
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onMouseDown={() => handleSelect(customer)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface2 transition-colors"
            >
              <span className="font-medium text-text">{customer.name}</span>
              <span className="text-muted ml-2">{customer.mobile}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
