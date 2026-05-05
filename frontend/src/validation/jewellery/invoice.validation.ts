import * as Yup from "yup";

const decimal4 = /^\d{0,8}(\.\d{0,4})?$/;
const decimal2 = /^\d{0,12}(\.\d{0,2})?$/;

export const invoiceLineSchema = Yup.object({
  item: Yup.string().nullable().default(""),
  description: Yup.string().trim().max(240, "Description is too long").required("Description is required"),
  metal_code: Yup.string().trim().required("Metal is required"),
  purity_code: Yup.string().trim().required("Purity is required"),
  gross_wt: Yup.string().matches(decimal4, "Gross wt must allow up to 4 decimals").required("Gross wt is required"),
  net_wt: Yup.string().matches(decimal4, "Net wt must allow up to 4 decimals").required("Net wt is required"),
  rate_per_gram: Yup.string().matches(decimal4, "Rate must be valid").required("Rate is required"),
  making_mode: Yup.mixed<"PER_GRAM" | "PCT_METAL" | "PER_PIECE">().oneOf(["PER_GRAM", "PCT_METAL", "PER_PIECE"]).required(),
  making_rate: Yup.string().matches(decimal4, "Making rate must be valid").required("Making rate is required"),
  wastage_pct: Yup.string().matches(decimal4, "Wastage must be valid").required("Wastage is required"),
  hallmarking_fee: Yup.string().matches(decimal2, "Hallmarking fee must be valid").required("Hallmarking fee is required"),
  stone_value: Yup.string().matches(decimal2, "Stone value must be valid").required("Stone value is required"),
  gst_rate_pct: Yup.string().matches(decimal2, "GST must be valid").required("GST is required"),
});

export const invoicePaymentSchema = Yup.object({
  mode: Yup.mixed<"CASH" | "UPI" | "CARD" | "BANK" | "ADVANCE" | "CHEQUE" | "OTHER">()
    .oneOf(["CASH", "UPI", "CARD", "BANK", "ADVANCE", "CHEQUE", "OTHER"])
    .required(),
  amount: Yup.string().matches(decimal2, "Amount must be valid").required("Amount is required"),
  reference: Yup.string().trim().max(120, "Reference is too long").default(""),
});

export const oldGoldSchema = Yup.object({
  metal_code: Yup.string().trim().required("Metal is required"),
  description: Yup.string().trim().max(240, "Description is too long").required("Description is required"),
  gross_wt: Yup.string().matches(decimal4, "Gross wt must allow up to 4 decimals").required("Gross wt is required"),
  tested_purity: Yup.string().matches(decimal4, "Purity must allow up to 4 decimals").required("Purity is required"),
  buy_rate_per_gram: Yup.string().matches(decimal4, "Rate must be valid").required("Rate is required"),
});

export const invoiceValidationSchema = Yup.object({
  invoice_type: Yup.mixed<"TAX_INVOICE" | "ESTIMATE" | "CASH_MEMO" | "NON_GST" | "CREDIT_NOTE">()
    .oneOf(["TAX_INVOICE", "ESTIMATE", "CASH_MEMO", "NON_GST", "CREDIT_NOTE"])
    .required(),
  customer: Yup.string().nullable().default(""),
  seller_state_code: Yup.string().trim().required("Seller state code is required").max(2),
  place_of_supply_state_code: Yup.string().trim().required("Place of supply state code is required").max(2),
  discount_amount: Yup.string().matches(decimal2, "Discount must be valid").required("Discount is required"),
  notes: Yup.string().trim().max(500, "Notes are too long").default(""),
  lines: Yup.array().of(invoiceLineSchema).min(1, "At least one line is required").required(),
  payments: Yup.array().of(invoicePaymentSchema).required(),
  old_gold: Yup.array().of(oldGoldSchema).required(),
});
