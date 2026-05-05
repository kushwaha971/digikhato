"use client";

import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

type Option = { label: string; value: string; disabled?: boolean };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
};

function parseOptions(children: ReactNode): Option[] {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }> =>
        isValidElement(child) && child.type === "option",
    )
    .map((child) => {
      const raw = child.props.children;
      const fallback = String(child.props.value ?? "");
      let label = fallback;
      if (typeof raw === "string") label = raw;
      else if (typeof raw === "number") label = String(raw);
      return { value: fallback, label, disabled: child.props.disabled };
    });
}

export function Select({
  label,
  error,
  helperText,
  placeholder,
  value,
  onChange,
  children,
  disabled,
  required,
  id,
  className: _className,
  ...rest
}: Props) {
  const generated = useId();
  const triggerId = id ?? (label ? `${label.toLowerCase().replaceAll(/\s+/g, "-")}-${generated}` : generated);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => parseOptions(children), [children]);
  const selectedValue = String(value ?? "");
  const selectedLabel = options.find((o) => o.value === selectedValue)?.label;

  const hasError = Boolean(error);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function emitChange(nextValue: string) {
    if (!onChange) return;
    const synthetic = {
      target: { value: nextValue, name: rest.name ?? "" },
      currentTarget: { value: nextValue, name: rest.name ?? "" },
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
      nativeEvent: new Event("change"),
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    onChange(synthetic);
  }

  const shellClass = [
    "w-full appearance-none rounded-xl border bg-surface px-4 py-2.5 pr-10 text-sm text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0",
    hasError
      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/25"
      : "border-border hover:border-border-strong focus:border-primary-500 focus:ring-primary-500/20",
    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
  ].join(" ");

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={triggerId} className="block text-xs font-semibold text-text mb-1.5">
          {label}
          {required && <span className="text-danger-600 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative" ref={rootRef}>
        <button
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={shellClass}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span className={selectedLabel ? "text-text" : "text-muted/70"}>
            {selectedLabel ?? placeholder ?? "Select…"}
          </span>
        </button>

        {/* Chevron */}
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          <svg
            className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>

        {/* Dropdown list */}
        {open && !disabled && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-modal">
            <ul className="max-h-60 overflow-auto py-1">
              {options.map((option) => {
                const isSelected = option.value === selectedValue;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      data-selected={isSelected ? "true" : undefined}
                      disabled={option.disabled}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (option.disabled) return;
                        emitChange(option.value);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                        option.disabled
                          ? "cursor-not-allowed text-muted/50"
                          : "cursor-pointer text-text hover:bg-surface2",
                        isSelected
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 font-medium"
                          : "",
                      ].join(" ")}
                    >
                      <span>{option.label}</span>
                      {isSelected ? (
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-muted">{helperText}</p>}
    </div>
  );
}
