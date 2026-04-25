import * as Yup from "yup";

import {
  mobileSchema,
  normalizeMobile,
  requiredTrimmedString,
} from "@/validation/common";

export type LoginFormValues = {
  mobile_number: string;
};

export const loginValidationSchema: Yup.ObjectSchema<LoginFormValues> = Yup.object({
  mobile_number: mobileSchema(),
});

export const loginInitialValues: LoginFormValues = {
  mobile_number: "",
};

export type SignupFormValues = {
  full_name: string;
  mobile_number: string;
};

export const signupValidationSchema: Yup.ObjectSchema<SignupFormValues> = Yup.object({
  full_name: requiredTrimmedString("Full name", 2, 120),
  mobile_number: mobileSchema(),
});

export const signupInitialValues: SignupFormValues = {
  full_name: "",
  mobile_number: "",
};

export const normalizeLoginValues = (values: LoginFormValues): LoginFormValues => ({
  ...values,
  mobile_number: normalizeMobile(values.mobile_number),
});
