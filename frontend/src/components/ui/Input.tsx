import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  prefix?: string;       // inline text prefix, e.g. "+91"
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftAddon,
  rightAddon,
  prefix,
  fullWidth = true,
  className = "",
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replaceAll(/\s+/g, "-");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1.5">
          {label}
          {props.required && <span className="text-primary-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input row — supports prefix (+91 style), left addon, right addon */}
      <div className={[
        "flex items-center w-full border bg-surface rounded-xl overflow-hidden transition-all duration-150",
        error
          ? "border-danger-500 focus-within:ring-2 focus-within:ring-danger-500/30"
          : "border-border hover:border-neutral-300 dark:hover:border-neutral-600 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20",
      ].join(" ")}>

        {/* Inline phone-style prefix (e.g. "+91") */}
        {prefix && (
          <span className="shrink-0 px-3 py-2.5 text-sm font-medium text-text border-r border-border bg-surface2 select-none">
            {prefix}
          </span>
        )}

        {/* Left icon addon */}
        {leftAddon && !prefix && (
          <span className="shrink-0 pl-3 text-muted pointer-events-none">{leftAddon}</span>
        )}

        <input
          ref={ref}
          id={inputId}
          className={[
            "flex-1 min-w-0 bg-transparent px-4 py-2.5 text-sm text-text placeholder:text-muted/60",
            "focus:outline-none",
            prefix ? "pl-3" : "",
            leftAddon && !prefix ? "pl-2" : "",
            rightAddon ? "pr-2" : "",
            className,
          ].filter(Boolean).join(" ")}
          {...props}
        />

        {/* Right icon addon */}
        {rightAddon && (
          <span className="shrink-0 pr-3">{rightAddon}</span>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-danger-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
