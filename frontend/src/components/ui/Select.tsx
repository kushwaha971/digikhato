import { forwardRef, SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className, label, error, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replaceAll(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-text mb-1.5">
            {label}
            {props.required && <span className="text-danger-600 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            {...props}
            className={`w-full appearance-none rounded-xl border bg-surface px-4 py-2.5 text-sm text-text transition duration-200 focus:outline-none focus:ring-2 ${
              error
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                : "border-border hover:border-border-strong focus:border-primary-500 focus:ring-primary-500/20"
            } ${className ?? ""}`}
          >
            {props.children}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
