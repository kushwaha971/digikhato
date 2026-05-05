import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  className = "",
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id ?? label?.toLowerCase().replaceAll(/\s+/g, "-");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-text mb-1.5">
          {label}
          {props.required && <span className="text-primary-500 ml-0.5">*</span>}
        </label>
      )}

      <div className={[
        "w-full border bg-surface rounded-xl overflow-hidden transition-all duration-150",
        error
          ? "border-danger-500 focus-within:ring-2 focus-within:ring-danger-500/30"
          : "border-border hover:border-neutral-300 dark:hover:border-neutral-600 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20",
      ].join(" ")}>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={[
            "w-full min-w-0 bg-transparent px-4 py-2.5 text-sm text-text placeholder:text-muted/60 resize-none",
            "focus:outline-none",
            className,
          ].filter(Boolean).join(" ")}
          {...props}
        />
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

Textarea.displayName = "Textarea";
