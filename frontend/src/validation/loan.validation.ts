import * as Yup from "yup";

import {
  currencyAmountSchema,
  isoDateSchema,
  positiveIntegerSchema,
  requiredMessage,
} from "@/validation/common";

export type LoanFormValues = {
  borrower: number;
  principal: number;
  interest_rate: number | null;
  interest_type: "flat";
  tenure_days: number | null;
  start_date: string;
  notes: string;
};

export const loanValidationSchema = Yup.object({
  borrower: positiveIntegerSchema("Borrower"),
  principal: currencyAmountSchema("Principal amount"),
  interest_rate: Yup.number()
    .typeError("Interest rate must be a valid number")
    .min(0, "Interest rate cannot be negative")
    .max(100, "Interest rate cannot exceed 100")
    .nullable()
    .transform((value, originalValue) => (originalValue === "" || originalValue === undefined) ? null : value),
  interest_type: Yup.mixed<"flat">().oneOf(["flat"]).required(requiredMessage("Interest type")),
  tenure_days: Yup.number()
    .typeError("Duration must be a whole number")
    .integer("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day")
    .nullable()
    .transform((value, originalValue) => (originalValue === "" || originalValue === undefined) ? null : value),
  start_date: isoDateSchema("Start date"),
  notes: Yup.string()
    .max(500, "Notes must be at most 500 characters")
    .nullable()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .notRequired(),
});

export const loanInitialValues: LoanFormValues = {
  borrower: 0,
  principal: 0,
  interest_rate: null,
  interest_type: "flat",
  tenure_days: null,
  start_date: new Date().toISOString().slice(0, 10),
  notes: "",
};
