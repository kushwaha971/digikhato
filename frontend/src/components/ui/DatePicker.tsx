"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEventHandler,
  type FocusEventHandler,
} from "react";

import { FormFieldWrapper } from "@/components/forms/system/FormPrimitives";
import { formatDateToDMY } from "@/lib/date";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseIso(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  const d = parseIso(value);
  if (!d) return "";
  return formatDateToDMY(value, "");
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export interface DatePickerProps {
  label?: string;
  name: string;
  value?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  touched?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  "data-testid"?: string;
  className?: string;
  min?: string;
  max?: string;
}

export function DatePicker({
  label,
  name,
  value = "",
  onChange,
  onBlur,
  touched,
  error,
  required,
  disabled,
  placeholder = "Select date",
  helperText,
  className,
  "data-testid": dataTestId,
  min,
  max,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const hasError = Boolean(touched && error);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const parsed = parseIso(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  useEffect(() => {
    const p = parseIso(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
    }
  }, [value]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  function fireChange(isoDate: string) {
    if (!hiddenInputRef.current) return;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeInputValueSetter?.call(hiddenInputRef.current, isoDate);
    hiddenInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    const syntheticEvent = {
      target: hiddenInputRef.current,
      currentTarget: hiddenInputRef.current,
      nativeEvent: new Event("change"),
      bubbles: true,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      preventDefault: () => {},
      isDefaultPrevented: () => false,
      stopPropagation: () => {},
      isPropagationStopped: () => false,
      persist: () => {},
      timeStamp: Date.now(),
      type: "change",
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  }

  function handleDayClick(day: number) {
    const selected = new Date(viewYear, viewMonth, day);
    if (min && toIso(selected) < min) return;
    if (max && toIso(selected) > max) return;
    fireChange(toIso(selected));
    close();
    if (onBlur && hiddenInputRef.current) {
      const blurEvent = {
        target: hiddenInputRef.current,
        currentTarget: hiddenInputRef.current,
      } as unknown as React.FocusEvent<HTMLInputElement>;
      onBlur(blurEvent);
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const todayIso = toIso(today);

  const shellClass = [
    "flex items-center w-full rounded-xl border bg-surface text-text transition-all duration-150",
    "focus-within:ring-2 focus-within:ring-offset-0",
    hasError
      ? "border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/25"
      : "border-border hover:border-border-strong focus-within:border-primary-500 focus-within:ring-primary-500/20",
    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
  ].join(" ");

  return (
    <FormFieldWrapper
      label={label}
      required={required}
      htmlFor={inputId}
      touched={touched}
      error={error}
      helperText={helperText}
      errorId={errorId}
      helperId={helperId}
      className={className}
    >
      <div ref={containerRef} className="relative">
        {/* Hidden input for Formik integration */}
        <input
          ref={hiddenInputRef}
          id={inputId}
          name={name}
          type="hidden"
          value={value}
          readOnly
          data-testid={dataTestId}
        />

        {/* Trigger button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={`${shellClass} pr-8`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={label ?? "Pick a date"}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
        >
          {/* Calendar icon */}
          <span className="shrink-0 pl-3 pr-2 text-muted">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <span className={`flex-1 py-2.5 pr-4 text-sm text-left ${value ? "text-text" : "text-muted/70"}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </button>
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fireChange("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-1 rounded"
            aria-label="Clear date"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Calendar popover */}
        {open && (
          <div
            role="dialog"
            aria-label="Date picker calendar"
            className="absolute right-0 z-50 mt-1.5 w-72 bg-surface border border-border rounded-2xl shadow-modal p-3 animate-slide-up"
          >
            {/* Month/year navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-surface2 hover:text-text transition-colors"
                aria-label="Previous month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label="Select month"
                >
                  {MONTHS.map((month, idx) => (
                    <option key={month} value={idx}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label="Select year"
                >
                  {Array.from({ length: 25 }, (_, offset) => today.getFullYear() - 12 + offset).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-surface2 hover:text-text transition-colors"
                aria-label="Next month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const iso = toIso(new Date(viewYear, viewMonth, day));
                const isSelected = value === iso;
                const isToday = iso === todayIso;
                const isDisabled = (min && iso < min) || (max && iso > max);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!!isDisabled}
                    onClick={() => handleDayClick(day)}
                    className={[
                      "w-9 h-9 rounded-lg text-sm font-medium transition-all duration-100 mx-auto flex items-center justify-center",
                      isSelected
                        ? "bg-primary-500 text-white font-semibold"
                        : isToday
                          ? "border-2 border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                          : "text-text hover:bg-surface2",
                      isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                    aria-label={`${day} ${MONTHS[viewMonth]} ${viewYear}${isSelected ? " (selected)" : ""}${isToday ? " (today)" : ""}`}
                    aria-pressed={isSelected}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Today shortcut */}
            <div className="mt-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => { fireChange(todayIso); close(); }}
                className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
}
