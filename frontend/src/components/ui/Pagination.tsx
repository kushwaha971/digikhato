"use client";

interface PaginationProps {
  readonly page: number;
  readonly count: number;
  readonly pageSize: number;
  readonly onChange: (page: number) => void;
}

export function Pagination({ page, count, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Build visible page numbers: always show first, last, current ± 1, with ellipsis
  const pages: (number | "…")[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };

  add(1);
  if (page > 3) pages.push("…");
  if (page > 2) add(page - 1);
  add(page);
  if (page < totalPages - 1) add(page + 1);
  if (page < totalPages - 2) pages.push("…");
  add(totalPages);

  const btnBase = "min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors";
  const activeBtn = `${btnBase} bg-primary-600 text-white`;
  const inactiveBtn = `${btnBase} bg-surface border border-border text-muted hover:text-text hover:border-primary-400`;
  const navBtn = `${btnBase} bg-surface border border-border text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
      <p className="text-xs text-muted">
        {Math.min((page - 1) * pageSize + 1, count)}–{Math.min(page * pageSize, count)} of {count}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={!hasPrev}
          className={navBtn}
          aria-label="Previous page"
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted select-none">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={p === page ? activeBtn : inactiveBtn}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={!hasNext}
          className={navBtn}
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}
