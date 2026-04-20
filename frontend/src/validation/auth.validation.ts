import * as Yup from "yup";

import {
  mobileSchema,
  normalizeMobile,
  requiredTrimmedString,
  requiredMessage,
} from "@/validation/common";

export type LoginFormValues = {
  mobile_number: string;
  password: string;
};

export const loginValidationSchema: Yup.ObjectSchema<LoginFormValues> = Yup.object({
  mobile_number: mobileSchema(),
  password: Yup.string().required(requiredMessage("Password")),
});

export const loginInitialValues: LoginFormValues = {
  mobile_number: "",
  password: "",
};

export type SignupFormValues = {
  full_name: string;
  mobile_number: string;
  password: string;
  confirm_password: string;
};

export const signupValidationSchema: Yup.ObjectSchema<SignupFormValues> = Yup.object({
  full_name: requiredTrimmedString("Full name", 2, 120),
  mobile_number: mobileSchema(),
  password: Yup.string()
    .required(requiredMessage("Password"))
    .min(8, "Password must be at least 8 characters"),
  confirm_password: Yup.string()
    .required(requiredMessage("Confirm password"))
    .oneOf([Yup.ref("password")], "Passwords do not match"),
});

export const signupInitialValues: SignupFormValues = {
  full_name: "",
  mobile_number: "",
  password: "",
  confirm_password: "",
};

export const normalizeLoginValues = (values: LoginFormValues): LoginFormValues => ({
  ...values,
  mobile_number: normalizeMobile(values.mobile_number),
  password: values.password,
});
