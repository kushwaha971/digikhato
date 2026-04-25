"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "success" | "danger" | "ghost";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Turno-inspired: pill shape, crimson primary, clean outline variant
const variantClasses: Record<Variant, string> = {
  primary:   "bg-primary-500 text-white shadow-soft hover:bg-primary-600 active:bg-primary-700",
  secondary: "bg-surface2 text-text border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800",
  outline:   "bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20",
  success:   "bg-success-600 text-white hover:bg-success-700",
  danger:    "bg-danger-600 text-white hover:bg-danger-700",
  ghost:     "bg-transparent text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20",
};

const sizeClasses: Record<Size, string> = {
  xs: "h-7  px-3   text-xs",
  sm: "h-8  px-4   text-sm",
  md: "h-11 px-6   text-sm",
  lg: "h-12 px-7   text-base",
  xl: "h-14 px-8   text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        // Base — pill shape matches Turno CTA buttons
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
        "transition-all duration-150 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});

Button.displayName = "Button";

// Convenience export for the classic full-width "Book / CTA" pill style
export function CTAButton({
  children,
  className = "",
  loading,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; disabled?: boolean }) {
  return (
    <Button variant="primary" size="lg" fullWidth loading={loading} disabled={disabled} className={className} {...props}>
      {children}
    </Button>
  );
}
