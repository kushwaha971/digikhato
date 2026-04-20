"use client";

import { ReactNode, SelectHTMLAttributes, useEffect, useRef, useState } from "react";

import { Drawer } from "@/components/ui/Drawer";

export const FILTER_LABEL_CLASS = "text-xs font-semibold text-muted uppercase tracking-wide";
export const FILTER_FIELD_CLASS =
  "h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-9 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20";

type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function FilterSelect({ label, className, children, ...rest }: FilterSelectProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {label ? <span className={FILTER_LABEL_CLASS}>{label}</span> : null}
      <div className="relative">
        <select className={[FILTER_FIELD_CLASS, className].filter(Boolean).join(" ")} {...rest}>
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  );
}

type ResponsiveFilterPanelProps = Readonly<{
  title: string;
  hasActiveFilters?: boolean;
  onApply: () => void;
  onReset: () => void;
  children: ReactNode;
}>;

export function ResponsiveFilterPanel({
  title,
  hasActiveFilters = false,
  onApply,
  onReset,
  children,
}: ResponsiveFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const compute = () => setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const onClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, isDesktop]);

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((prev) => !prev)}
      className={`inline-flex items-center gap-2 h-10 px-3 rounded-xl border text-sm font-semibold transition-colors ${
        hasActiveFilters
          ? "border-primary-500 text-primary-600 bg-primary-50/70 dark:bg-primary-900/20"
          : "border-border text-muted hover:text-text hover:bg-surface2"
      }`}
      aria-label="Open filters"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 01.8 1.6L14 13.5V19a1 1 0 01-1.447.894l-2-1A1 1 0 0110 18v-4.5L3.2 4.6A1 1 0 013 4z" />
      </svg>
      <span>Filter</span>
      {hasActiveFilters ? <span className="w-2 h-2 rounded-full bg-primary-500" /> : null}
    </button>
  );

  if (!isDesktop) {
    return (
      <>
        {trigger}
        <Drawer open={open} onClose={() => setOpen(false)} title={title}>
          <div className="space-y-4">
            {children}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
                className="h-10 rounded-lg border border-border text-sm font-semibold text-muted hover:text-text hover:bg-surface2 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply();
                  setOpen(false);
                }}
                className="h-10 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </Drawer>
      </>
    );
  }

  return (
    <div className="relative" ref={popoverRef}>
      {trigger}
      {open ? (
        <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-border bg-surface shadow-modal p-4 z-40">
          <p className="text-sm font-semibold text-text mb-3">{title}</p>
          <div className="space-y-3">{children}</div>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              className="h-10 rounded-lg border border-border text-sm font-semibold text-muted hover:text-text hover:bg-surface2 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                onApply();
                setOpen(false);
              }}
              className="h-10 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
