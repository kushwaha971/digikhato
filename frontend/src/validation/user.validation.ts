import * as Yup from "yup";

import { REGEX } from "@/constants/regex";
import {
  mobileSchema,
  normalizeMobile,
  requiredMessage,
  requiredTrimmedString,
} from "@/validation/common";

export type TeamMemberRole = "admin" | "collector" | "borrower";

export type TeamMemberFormValues = {
  full_name: string;
  mobile_number: string;
  password: string;
  role: TeamMemberRole;
  branch_name?: string;
};

const passwordSchema = Yup.string()
  .required(requiredMessage("Password"))
  .matches(REGEX.passwordStrong, "Password must be at least 8 characters");

export const teamMemberValidationSchema: Yup.ObjectSchema<TeamMemberFormValues> = Yup.object({
  full_name: requiredTrimmedString("Full name", 2, 120),
  mobile_number: mobileSchema(),
  password: passwordSchema,
  role: Yup.mixed<TeamMemberRole>().oneOf(["admin", "collector", "borrower"]).required(requiredMessage("Role")),
  branch_name: Yup.string().transform((value) => (typeof value === "string" ? value.trim() : value)).optional(),
});

export const teamMemberInitialValues: TeamMemberFormValues = {
  full_name: "",
  mobile_number: "",
  password: "",
  role: "collector",
  branch_name: "",
};

export type CreateTenantFormValues = {
  full_name: string;
  mobile_number: string;
  password: string;
  branch_name: string;
};

export const createTenantValidationSchema = Yup.object({
  full_name: requiredTrimmedString("Owner name", 2, 120),
  mobile_number: mobileSchema(),
  password: passwordSchema,
  branch_name: Yup.string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .max(120, "Branch name must be at most 120 characters")
    .notRequired(),
});

export const createTenantInitialValues: CreateTenantFormValues = {
  full_name: "",
  mobile_number: "",
  password: "",
  branch_name: "",
};

export const normalizeUserValues = <T extends { mobile_number: string }>(values: T): T => ({
  ...values,
  mobile_number: normalizeMobile(values.mobile_number),
});
