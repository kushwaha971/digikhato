"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";

import {
  FormErrorBanner,
  MobileNumberInput,
  PasswordInput,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { useCreateTeamMemberMutation } from "@/features/team/team-api";
import {
  createTenantInitialValues,
  createTenantValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  normalizeUserValues,
  trimObjectValues,
  type CreateTenantFormValues,
} from "@/validation";

const TENANT_FIELDS: Array<keyof CreateTenantFormValues> = [
  "full_name",
  "mobile_number",
  "password",
  "branch_name",
];

export default function CreateTenantPage() {
  const router = useRouter();
  const [createMember, { isLoading }] = useCreateTeamMemberMutation();

  const formik = useFormik<CreateTenantFormValues>({
    initialValues: createTenantInitialValues,
    validationSchema: createTenantValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const payload = normalizeUserValues(trimObjectValues(values));
        await createMember({
          full_name: payload.full_name,
          mobile_number: payload.mobile_number,
          password: payload.password,
          role: "admin",
          branch_name: payload.branch_name,
        }).unwrap();
        router.push("/super-admin/tenants");
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, TENANT_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const nameState = formikFieldState(formik, "full_name");
  const mobileState = formikFieldState(formik, "mobile_number");
  const passwordState = formikFieldState(formik, "password");
  const branchState = formikFieldState(formik, "branch_name");

  return (
    <Screen
      title="New Tenant Admin"
      backHref="/super-admin/tenants"
      breadcrumb={[
        { label: "Tenants", href: "/super-admin/tenants" },
        { label: "Create" },
      ]}
    >
      <div className="max-w-md mx-auto">
        <form className="app-panel p-5 space-y-4" onSubmit={formik.handleSubmit} noValidate>
          <p className="text-sm text-muted">
            Creating a Tenant Admin account gives them full access to manage their own borrowers,
            collectors, loans, and collections.
          </p>

          <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

          <TextInput
            label="Owner Name"
            name="full_name"
            value={formik.values.full_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={nameState.touched}
            error={nameState.error}
            placeholder="Full name"
            required
            data-testid="tenant-owner-name"
          />

          <MobileNumberInput
            label="Mobile Number"
            name="mobile_number"
            value={formik.values.mobile_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={mobileState.touched}
            error={mobileState.error}
            placeholder="10-digit mobile"
            required
            data-testid="tenant-mobile"
          />

          <PasswordInput
            label="Password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={passwordState.touched}
            error={passwordState.error}
            placeholder="Strong password"
            helperText="At least 8 chars, one uppercase, one number, one special char"
            required
            data-testid="tenant-password"
          />

          <TextInput
            label="Business / Branch Name (optional)"
            name="branch_name"
            value={formik.values.branch_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={branchState.touched}
            error={branchState.error}
            placeholder="e.g. Sharma Finance"
            data-testid="tenant-branch-name"
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth={false} type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              loading={formik.isSubmitting || isLoading}
              disabled={formik.isSubmitting || isLoading}
              type="submit"
            >
              Create Tenant
            </Button>
          </div>
        </form>
      </div>
    </Screen>
  );
}
