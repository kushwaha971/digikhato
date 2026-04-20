import * as Yup from "yup";

import { requiredTrimmedString } from "@/validation/common";

export type OnboardingFormValues = {
  business_name: string;
  area_name: string;
  currency: string;
};

export const onboardingValidationSchema = Yup.object({
  business_name: requiredTrimmedString("Business name", 2, 120),
  area_name: Yup.string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .max(120, "Branch / area name must be at most 120 characters")
    .notRequired(),
  currency: Yup.string().required("Currency is required"),
});

export const onboardingInitialValues: OnboardingFormValues = {
  business_name: "",
  area_name: "",
  currency: "INR",
};
