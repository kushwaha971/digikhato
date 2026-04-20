"use client";

import { useFormik } from "formik";

import {
  FormErrorBanner,
  MobileNumberInput,
  PasswordInput,
  SelectInput,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import {
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  normalizeUserValues,
  teamMemberInitialValues,
  teamMemberValidationSchema,
  trimObjectValues,
  type TeamMemberFormValues,
} from "@/validation";

type TeamMemberFormProps = Readonly<{
  onSubmit: (data: TeamMemberFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  defaultValues?: Partial<TeamMemberFormValues>;
  allowedRoles?: Array<TeamMemberFormValues["role"]>;
}>;

const TEAM_FIELDS: Array<keyof TeamMemberFormValues> = [
  "full_name",
  "mobile_number",
  "password",
  "role",
  "branch_name",
];

export function TeamMemberForm({
  onSubmit,
  onCancel,
  submitLabel = "Create Member",
  defaultValues,
  allowedRoles = ["admin", "collector", "borrower"],
}: TeamMemberFormProps) {
  const formik = useFormik<TeamMemberFormValues>({
    enableReinitialize: true,
    initialValues: {
      ...teamMemberInitialValues,
      ...defaultValues,
    },
    validationSchema: teamMemberValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const payload = normalizeUserValues(trimObjectValues(values));
        await onSubmit(payload);
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, TEAM_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const nameState = formikFieldState(formik, "full_name");
  const mobileState = formikFieldState(formik, "mobile_number");
  const passwordState = formikFieldState(formik, "password");
  const roleState = formikFieldState(formik, "role");

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
      <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

      <TextInput
        label="Full Name"
        name="full_name"
        value={formik.values.full_name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={nameState.touched}
        error={nameState.error}
        placeholder="Member's full name"
        required
        data-testid="team-member-name"
      />

      <MobileNumberInput
        label="Mobile Number"
        name="mobile_number"
        value={formik.values.mobile_number}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={mobileState.touched}
        error={mobileState.error}
        placeholder="10-digit mobile number"
        required
        data-testid="team-member-mobile"
      />

      <PasswordInput
        label="Password"
        name="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={passwordState.touched}
        error={passwordState.error}
        placeholder="Set a strong password"
        helperText="At least 8 chars, one uppercase, one number, one special char"
        required
        data-testid="team-member-password"
      />

      <SelectInput
        label="Role"
        name="role"
        value={formik.values.role}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        touched={roleState.touched}
        error={roleState.error}
        required
        data-testid="team-member-role"
      >
        {allowedRoles.includes("admin") ? <option value="admin">Admin — Full access</option> : null}
        {allowedRoles.includes("collector") ? <option value="collector">Collector — Collection only</option> : null}
        {allowedRoles.includes("borrower") ? <option value="borrower">Borrower — Self view only</option> : null}
      </SelectInput>

      <div className="flex gap-3 pt-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={formik.isSubmitting} disabled={formik.isSubmitting} fullWidth>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
