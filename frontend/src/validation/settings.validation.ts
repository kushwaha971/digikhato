import * as Yup from "yup";

import { mobileSchema, requiredMessage, requiredTrimmedString } from "@/validation/common";

export type ProfileFormValues = {
  full_name: string;
  mobile_number: string;
  branch_name: string;
};

export const profileValidationSchema: Yup.ObjectSchema<ProfileFormValues> = Yup.object({
  full_name: requiredTrimmedString("Full name", 2, 120),
  mobile_number: mobileSchema(),
  branch_name: Yup.string().transform((value) => (typeof value === "string" ? value.trim() : value)).max(120, "Branch or business name must be at most 120 characters").optional().default(""),
});

export const profileInitialValues: ProfileFormValues = {
  full_name: "",
  mobile_number: "",
  branch_name: "",
};

export type ChangePasswordFormValues = {
  old_password: string;
  new_password: string;
  confirm_password: string;
};

export const changePasswordValidationSchema: Yup.ObjectSchema<ChangePasswordFormValues> = Yup.object({
  old_password: Yup.string().required(requiredMessage("Current password")),
  new_password: Yup.string()
    .required(requiredMessage("New password"))
    .min(8, "Password must be at least 8 characters"),
  confirm_password: Yup.string()
    .required(requiredMessage("Confirm password"))
    .oneOf([Yup.ref("new_password")], "Passwords do not match"),
});

export const changePasswordInitialValues: ChangePasswordFormValues = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};
