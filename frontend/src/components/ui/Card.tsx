import { HTMLAttributes } from "react";

type CardVariant = "default" | "gradient" | "stat" | "stat-success" | "stat-warning" | "stat-danger";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  clickable?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:       "app-panel",
  gradient:      "gradient-panel",
  stat:          "stat-card-gradient",
  "stat-success": "stat-card-success",
  "stat-warning": "stat-card-warning",
  "stat-danger":  "stat-card-danger",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm:   "p-3",
  md:   "p-4 md:p-5",
  lg:   "p-5 md:p-6",
};

export function Card({
  variant = "default",
  padding = "md",
  clickable = false,
  className = "",
  children,
  ...props
}: Readonly<CardProps>) {
  return (
    <div
      className={[
        variantClasses[variant],
        paddingClasses[padding],
        clickable ? "card-clickable" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
