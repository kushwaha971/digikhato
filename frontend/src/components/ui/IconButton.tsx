"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonVariant = "default" | "danger" | "ghost";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: "sm" | "md";
  label: string; // required for aria-label
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: "text-muted hover:text-text hover:bg-surface2",
  danger: "text-muted hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20",
  ghost: "text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20",
};

const sizeClasses = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  variant = "default",
  size = "md",
  label,
  className = "",
  children,
  ...props
}, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    className={[
      "flex items-center justify-center rounded-full transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";
