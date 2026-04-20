import * as Yup from "yup";

import {
  currencyAmountSchema,
  percentageSchema,
  positiveIntegerSchema,
} from "@/validation/common";

export type AccountFormValues = {
  borrower: number;
  amount_given: number;
  daily_interest_rate: number;
  duration_days?: number;
};

export const accountValidationSchema: Yup.ObjectSchema<AccountFormValues> = Yup.object({
  borrower: positiveIntegerSchema("Borrower"),
  amount_given: currencyAmountSchema("Amount given"),
  daily_interest_rate: percentageSchema("Daily interest rate"),
  duration_days: Yup.number()
    .transform((value, originalValue) => {
      if (originalValue === "" || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      return Number(value);
    })
    .integer("Duration must be whole days")
    .positive("Duration must be greater than 0")
    .optional(),
});

export const accountInitialValues: AccountFormValues = {
  borrower: 0,
  amount_given: 0,
  daily_interest_rate: 0,
  duration_days: undefined,
};
