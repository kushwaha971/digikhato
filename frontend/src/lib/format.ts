import { formatDateToDMY } from "@/lib/date";

export function formatDateDMY(value: string | Date | null | undefined): string {
  return formatDateToDMY(value);
}

export function formatCurrencyINR(value: string | number | null | undefined): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}
