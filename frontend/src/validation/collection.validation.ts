import * as Yup from "yup";

import {
  currencyAmountSchema,
  isoDateSchema,
  positiveIntegerSchema,
} from "@/validation/common";

export type DailyCollectionFormValues = {
  account: number;
  payment: number;
  date: string;
};

export const dailyCollectionValidationSchema = Yup.object({
  account: positiveIntegerSchema("Account"),
  payment: currencyAmountSchema("Payment amount"),
  date: isoDateSchema("Collection date"),
});

export const dailyCollectionInitialValues: DailyCollectionFormValues = {
  account: 0,
  payment: 0,
  date: new Date().toISOString().slice(0, 10),
};

export type PaymentMode = "cash" | "gpay" | "phonepe" | "paytm" | "other_upi";

export const PAYMENT_MODE_OPTIONS: { label: string; value: PaymentMode }[] = [
  { label: "Cash", value: "cash" },
  { label: "GPay", value: "gpay" },
  { label: "PhonePe", value: "phonepe" },
  { label: "Paytm", value: "paytm" },
  { label: "Other UPI", value: "other_upi" },
];

export type LoanCollectionFormValues = {
  loan: number;
  borrower: number;
  amount_paid: number;
  status?: "paid" | "partial" | "missed";
  payment_mode: PaymentMode;
  reference_id?: string;
  date: string;
  notes?: string;
};

export const loanCollectionValidationSchema = Yup.object({
  loan: positiveIntegerSchema("Loan"),
  borrower: positiveIntegerSchema("Borrower"),
  amount_paid: currencyAmountSchema("Collection amount"),
  payment_mode: Yup.mixed<PaymentMode>()
    .oneOf(["cash", "gpay", "phonepe", "paytm", "other_upi"])
    .required("Payment mode is required"),
  reference_id: Yup.string()
    .max(120, "Reference ID must be at most 120 characters")
    .notRequired(),
  date: isoDateSchema("Collection date"),
  notes: Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .max(250, "Notes must be at most 250 characters")
    .notRequired(),
});

export const loanCollectionInitialValues: LoanCollectionFormValues = {
  loan: 0,
  borrower: 0,
  amount_paid: 0,
  payment_mode: "cash",
  reference_id: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

// Backward compatibility aliases for existing imports
export type CollectionFormValues = DailyCollectionFormValues;
export const collectionValidationSchema = dailyCollectionValidationSchema;
export const collectionInitialValues = dailyCollectionInitialValues;
