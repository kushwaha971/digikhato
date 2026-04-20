const CHIP_CONFIG: Record<string, { label: string; className: string }> = {
  cash: {
    label: "Cash",
    className: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  gpay: {
    label: "GPay",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  phonepe: {
    label: "PhonePe",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  paytm: {
    label: "Paytm",
    className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  other_upi: {
    label: "UPI",
    className: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
};

interface PaymentModeChipProps {
  readonly mode: string;
  readonly size?: "sm" | "xs";
}

export function PaymentModeChip({ mode, size = "sm" }: PaymentModeChipProps) {
  const config = CHIP_CONFIG[mode] ?? {
    label: mode.replace("_", " "),
    className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  };

  const sizeClass = size === "xs"
    ? "px-1.5 py-0.5 text-[10px]"
    : "px-2 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
