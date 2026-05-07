// Import types from jewellery-api — DO NOT redefine types here
import type { InvoiceStatus, InvoiceType, PaymentMode, OrderStatus, MakingMode } from "@/store/jewellery-api";

// LoanStatus is not exported from jewellery-api; derive it from the interface
type LoanStatus = "ACTIVE" | "RENEWED" | "CLOSED" | "AUCTIONED" | "LOSS";

// TransferStatus derived from JwlTransfer.status
type TransferStatus = "REQUESTED" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "REJECTED";

// ── Invoice ────────────────────────────────────────────────────────────────────

export const INVOICE_STATUS_OPTIONS: ReadonlyArray<{ label: string; value: InvoiceStatus | "" }> = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const INVOICE_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: InvoiceType | "" }> = [
  { label: "All types", value: "" },
  { label: "Tax Invoice", value: "TAX_INVOICE" },
  { label: "Estimate", value: "ESTIMATE" },
  { label: "Credit Note", value: "CREDIT_NOTE" },
];

export function invoiceStatusVariant(status: string): "success" | "danger" | "warning" {
  if (status === "ISSUED") return "success";
  if (status === "CANCELLED") return "danger";
  return "warning";
}

// ── Payment modes ──────────────────────────────────────────────────────────────

export const PAYMENT_MODE_OPTIONS: ReadonlyArray<{ label: string; value: PaymentMode }> = [
  { label: "Cash", value: "CASH" },
  { label: "UPI", value: "UPI" },
  { label: "Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK" },
  { label: "Advance", value: "ADVANCE" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "Other", value: "OTHER" },
];

// ── Loan (Gold Pledge) ─────────────────────────────────────────────────────────

export const LOAN_STATUS_OPTIONS: ReadonlyArray<{ label: string; value: LoanStatus | "" }> = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Renewed", value: "RENEWED" },
  { label: "Closed", value: "CLOSED" },
  { label: "Auctioned", value: "AUCTIONED" },
  { label: "Loss", value: "LOSS" },
];

export function loanStatusVariant(status: string): "success" | "danger" | "warning" | "neutral" | "primary" {
  if (status === "ACTIVE") return "success";
  if (status === "CLOSED") return "neutral";
  if (status === "RENEWED") return "primary";
  if (status === "AUCTIONED" || status === "LOSS") return "danger";
  return "warning";
}

export const INTEREST_METHOD_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Simple", value: "SIMPLE" },
  { label: "Compound", value: "COMPOUND" },
  { label: "Daily", value: "DAILY" },
  { label: "Flat", value: "FLAT" },
];

// ── Karigar / Order ────────────────────────────────────────────────────────────

export const ORDER_STATUS_OPTIONS: ReadonlyArray<{ label: string; value: OrderStatus | "" }> = [
  { label: "All", value: "" },
  { label: "Booked", value: "BOOKED" },
  { label: "Metal Issued", value: "METAL_ISSUED" },
  { label: "WIP", value: "WIP" },
  { label: "Karigar Received", value: "KARIGAR_RECEIVED" },
  { label: "QC", value: "QC" },
  { label: "Hallmarked", value: "HALLMARKED" },
  { label: "Ready", value: "READY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Closed", value: "CLOSED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function orderStatusVariant(status: string): "primary" | "warning" | "success" | "neutral" | "danger" {
  if (status === "BOOKED") return "primary";
  if (status === "METAL_ISSUED" || status === "WIP" || status === "KARIGAR_RECEIVED") return "warning";
  if (status === "QC" || status === "HALLMARKED") return "primary";
  if (status === "READY") return "success";
  if (status === "DELIVERED" || status === "CLOSED") return "neutral";
  if (status === "CANCELLED") return "danger";
  return "neutral";
}

// ── Transfer ───────────────────────────────────────────────────────────────────

export const TRANSFER_STATUS_OPTIONS: ReadonlyArray<{ label: string; value: TransferStatus | "" }> = [
  { label: "All", value: "" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Received", value: "RECEIVED" },
  { label: "Rejected", value: "REJECTED" },
];

export function transferStatusVariant(
  status: string,
): "success" | "warning" | "primary" | "neutral" | "danger" {
  if (status === "RECEIVED") return "success";
  if (status === "IN_TRANSIT") return "warning";
  if (status === "APPROVED") return "primary";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

// ── Making mode ────────────────────────────────────────────────────────────────

export const MAKING_MODE_OPTIONS: ReadonlyArray<{ label: string; value: MakingMode }> = [
  { label: "Per gram", value: "PER_GRAM" },
  { label: "% of metal", value: "PCT_METAL" },
  { label: "Per piece", value: "PER_PIECE" },
];

// ── Invoice type (form — includes all document types) ─────────────────────────

export const INVOICE_TYPE_FORM_OPTIONS: ReadonlyArray<{ label: string; value: InvoiceType }> = [
  { label: "Tax invoice", value: "TAX_INVOICE" },
  { label: "Estimate", value: "ESTIMATE" },
  { label: "Cash memo", value: "CASH_MEMO" },
  { label: "Non-GST bill", value: "NON_GST" },
  { label: "Credit note", value: "CREDIT_NOTE" },
];

// ── Split payment mode display ─────────────────────────────────────────────────

export const PAYMENT_MODE_LABELS: Readonly<Record<PaymentMode, string>> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK: "Bank Transfer",
  ADVANCE: "Advance",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export const PAYMENT_MODE_ICONS: Readonly<Record<PaymentMode, string>> = {
  CASH: "💵",
  UPI: "📱",
  CARD: "💳",
  BANK: "🏦",
  ADVANCE: "⏩",
  CHEQUE: "📝",
  OTHER: "🔄",
};

export const SPLIT_PAYMENT_MODE_FILTERS: ReadonlyArray<{ mode: PaymentMode | "ALL"; label: string }> = [
  { mode: "ALL", label: "All" },
  { mode: "CASH", label: "Cash" },
  { mode: "UPI", label: "UPI" },
  { mode: "CARD", label: "Card" },
  { mode: "BANK", label: "Bank" },
  { mode: "CHEQUE", label: "Cheque" },
  { mode: "OTHER", label: "Other" },
];

// ── Indian state codes ─────────────────────────────────────────────────────────

export const INDIAN_STATE_CODES: ReadonlyArray<{ label: string; code: string }> = [
  { label: "Jammu & Kashmir (01)", code: "01" },
  { label: "Himachal Pradesh (02)", code: "02" },
  { label: "Punjab (03)", code: "03" },
  { label: "Chandigarh (04)", code: "04" },
  { label: "Uttarakhand (05)", code: "05" },
  { label: "Haryana (06)", code: "06" },
  { label: "Delhi (07)", code: "07" },
  { label: "Rajasthan (08)", code: "08" },
  { label: "Uttar Pradesh (09)", code: "09" },
  { label: "Bihar (10)", code: "10" },
  { label: "Sikkim (11)", code: "11" },
  { label: "Arunachal Pradesh (12)", code: "12" },
  { label: "Nagaland (13)", code: "13" },
  { label: "Manipur (14)", code: "14" },
  { label: "Mizoram (15)", code: "15" },
  { label: "Tripura (16)", code: "16" },
  { label: "Meghalaya (17)", code: "17" },
  { label: "Assam (18)", code: "18" },
  { label: "West Bengal (19)", code: "19" },
  { label: "Jharkhand (20)", code: "20" },
  { label: "Odisha (21)", code: "21" },
  { label: "Chhattisgarh (22)", code: "22" },
  { label: "Madhya Pradesh (23)", code: "23" },
  { label: "Gujarat (24)", code: "24" },
  { label: "Dadra & Nagar Haveli and Daman & Diu (26)", code: "26" },
  { label: "Maharashtra (27)", code: "27" },
  { label: "Karnataka (29)", code: "29" },
  { label: "Goa (30)", code: "30" },
  { label: "Lakshadweep (31)", code: "31" },
  { label: "Kerala (32)", code: "32" },
  { label: "Tamil Nadu (33)", code: "33" },
  { label: "Puducherry (34)", code: "34" },
  { label: "Andaman & Nicobar (35)", code: "35" },
  { label: "Telangana (36)", code: "36" },
  { label: "Andhra Pradesh (37)", code: "37" },
  { label: "Ladakh (38)", code: "38" },
];
