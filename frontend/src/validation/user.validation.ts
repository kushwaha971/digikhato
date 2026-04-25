import * as Yup from "yup";

import { TEAM_MEMBER_ROLE_VALUES, type TeamMemberRole } from "@/constants/form-options";
import {
  mobileSchema,
  normalizeMobile,
  requiredTrimmedString,
} from "@/validation/common";

export type TeamMemberFormValues = {
  full_name: string;
  mobile_number: string;
  role: TeamMemberRole;
  branch_name?: string;
};

export const teamMemberValidationSchema: Yup.ObjectSchema<TeamMemberFormValues> = Yup.object({
  full_name: requiredTrimmedString("Full name", 2, 120),
  mobile_number: mobileSchema(),
  role: Yup.mixed<TeamMemberRole>().oneOf([...TEAM_MEMBER_ROLE_VALUES]).required("Role is required"),
  branch_name: Yup.string().transform((value) => (typeof value === "string" ? value.trim() : value)).optional(),
});

export const teamMemberInitialValues: TeamMemberFormValues = {
  full_name: "",
  mobile_number: "",
  role: "collector",
  branch_name: "",
};

export type CreateTenantFormValues = {
  full_name: string;
  mobile_number: string;
  branch_name: string;
};

export const createTenantValidationSchema = Yup.object({
  full_name: requiredTrimmedString("Owner name", 2, 120),
  mobile_number: mobileSchema(),
  branch_name: Yup.string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .max(120, "Branch name must be at most 120 characters")
    .notRequired(),
});

export const createTenantInitialValues: CreateTenantFormValues = {
  full_name: "",
  mobile_number: "",
  branch_name: "",
};

export const normalizeUserValues = <T extends { mobile_number: string }>(values: T): T => ({
  ...values,
  mobile_number: normalizeMobile(values.mobile_number),
});
