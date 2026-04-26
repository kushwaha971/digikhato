import * as Yup from "yup";

import {
  mobileSchema,
  optionalTrimmedString,
  requiredTrimmedString,
} from "@/validation/common";

export type BorrowerFormValues = {
  name: string;
  mobile_number: string;
  address: string;
  assigned_agent?: number | null;
  location?: number | null;
};

export const borrowerValidationSchema: Yup.ObjectSchema<BorrowerFormValues> = Yup.object({
  name: requiredTrimmedString("Borrower name", 2, 120),
  mobile_number: mobileSchema(),
  address: optionalTrimmedString(250).transform((value) => value ?? "") as Yup.StringSchema<string>,
  assigned_agent: Yup.number().nullable().optional(),
  location: Yup.number().nullable().optional(),
});

export const borrowerInitialValues: BorrowerFormValues = {
  name: "",
  mobile_number: "",
  address: "",
  assigned_agent: undefined,
  location: undefined,
};
