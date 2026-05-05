"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Input } from "@/components/ui/Input";

import { useListBorrowersQuery } from "@/features/borrowers/borrower-api";
import { ROUTES } from "@/lib/routes";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useListBorrowersQuery(
    { search: query },
    { skip: query.trim().length < 2 }
  );

  const results = data?.results ?? [];

  function handleSelect(id: number) {
    setQuery("");
    setOpen(false);
    router.push(ROUTES.app.loans.borrower(id));
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative w-full max-w-xs">
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search borrowers..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        leftAddon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        }
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {isFetching && (
            <p className="px-4 py-3 text-sm text-muted">Searching...</p>
          )}
          {!isFetching && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted">No borrowers found.</p>
          )}
          {!isFetching && results.length > 0 && (
            <ul>
              {results.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(b.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-canvas transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{b.name}</p>
                      <p className="text-xs text-muted">{b.mobile_number}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
