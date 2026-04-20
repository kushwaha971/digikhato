import * as Yup from "yup";

import {
  requiredMessage,
  mobileSchema,
  optionalTrimmedString,
  requiredTrimmedString,
} from "@/validation/common";

export type BorrowerFormValues = {
  name: string;
  mobile_number: string;
  address: string;
  assigned_agent?: number | null;
  password?: string;
};

const borrowerPasswordSchema = Yup.string()
  .transform((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  })
  .min(8, "Password must be at least 8 characters");

export const borrowerValidationSchema: Yup.ObjectSchema<BorrowerFormValues> = Yup.object({
  name: requiredTrimmedString("Borrower name", 2, 120),
  mobile_number: mobileSchema(),
  address: optionalTrimmedString(250).transform((value) => value ?? "") as Yup.StringSchema<string>,
  assigned_agent: Yup.number().nullable().optional(),
  password: borrowerPasswordSchema.optional(),
});

export const borrowerCreateValidationSchema: Yup.ObjectSchema<BorrowerFormValues> = borrowerValidationSchema.shape({
  password: borrowerPasswordSchema.required(requiredMessage("Login password")),
});

export const borrowerInitialValues: BorrowerFormValues = {
  name: "",
  mobile_number: "",
  address: "",
  assigned_agent: undefined,
  password: "",
};
