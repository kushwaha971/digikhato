"use client";

import { useEffect, useRef, useState } from "react";

import { useListLocationsQuery, type Location } from "@/features/locations/location-api";

type Props = {
  value: number | null | undefined;
  onChange: (locationId: number | null) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
};

export function LocationSearchDropdown({ value, onChange, onBlur, label = "Location", error, touched, disabled }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Location[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useListLocationsQuery(
    { search: search || undefined, page, ordering: "name" },
    { skip: !open },
  );

  useEffect(() => {
    if (!data?.results) return;
    setAccumulated((prev) => (page === 1 ? data.results : [...prev, ...data.results]));
  }, [data, page]);

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onBlur]);

  const selectedLocation = accumulated.find((l) => l.id === value) ?? null;
  const hasMore = (data?.count ?? 0) > accumulated.length;
  const showError = touched && !!error;

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setSearch("");
    setPage(1);
    setAccumulated([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(loc: Location) {
    onChange(loc.id);
    setOpen(false);
    onBlur?.();
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    onBlur?.();
  }

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text mb-1.5">
          {label}
          <span className="ml-1 text-xs text-muted font-normal">(optional)</span>
        </label>
      )}

      <button
        type="button"
        onClick={openDropdown}
        disabled={disabled}
        className={`flex items-center w-full rounded-xl border bg-surface text-sm text-left px-4 py-2.5 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
          showError
            ? "border-danger-500 focus:ring-2 focus:ring-danger-500/25"
            : "border-border hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        }`}
      >
        <span className={`flex-1 truncate ${selectedLocation ? "text-text" : "text-muted/70"}`}>
          {selectedLocation ? selectedLocation.name : "Search and select a location…"}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value != null && (
            <button
              type="button"
              onClick={clear}
              className="text-muted hover:text-danger-500 transition-colors p-0.5 rounded"
              aria-label="Clear location"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {showError && <p className="mt-1 text-xs text-danger-600">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1 w-full max-w-sm rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search locations…"
              className="w-full bg-transparent text-sm text-text placeholder:text-muted/70 px-2 py-1.5 focus:outline-none"
            />
          </div>

          <ul className="max-h-52 overflow-y-auto">
            {isFetching && page === 1 && (
              <li className="px-4 py-3 text-sm text-muted">Searching…</li>
            )}
            {!isFetching && accumulated.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted">
                {search ? "No locations found." : "No locations yet."}
              </li>
            )}
            {accumulated.map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => select(loc)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface2 ${
                    loc.id === value ? "bg-primary-50 dark:bg-primary-900/20 font-semibold text-primary-700 dark:text-primary-400" : "text-text"
                  }`}
                >
                  {loc.name}
                  {loc.description && (
                    <span className="block text-xs text-muted font-normal truncate">{loc.description}</span>
                  )}
                </button>
              </li>
            ))}
            {hasMore && !isFetching && (
              <li>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full text-center px-4 py-2 text-xs text-primary-600 hover:bg-surface2 transition-colors"
                >
                  Load more
                </button>
              </li>
            )}
            {isFetching && page > 1 && (
              <li className="flex justify-center py-2">
                <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
