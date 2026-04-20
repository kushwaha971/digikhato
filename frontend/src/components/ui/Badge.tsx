import { ReactNode } from "react";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  success: "bg-success-100 text-success-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-warning-100 text-warning-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  danger: "bg-danger-100 text-danger-700 dark:bg-red-900/30 dark:text-red-400",
  neutral: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
