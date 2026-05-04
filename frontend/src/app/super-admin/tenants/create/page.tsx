"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";

import {
  Checkbox,
  FormErrorBanner,
  MobileNumberInput,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { useCreateTeamMemberMutation } from "@/features/team/team-api";
import { APP_MODULES, type AppModuleCode } from "@/lib/routes";
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
  "branch_name",
  "module_access",
  "seed_jewellery_defaults",
];

const MODULE_LABELS: Record<AppModuleCode, string> = {
  udhaar: "Udhaar App",
  loans: "Loan Management",
  jewellery: "Jewellery ERP (JWL)",
};

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
          role: "admin",
          branch_name: payload.branch_name,
          module_access: payload.module_access,
          allow_all_modules: payload.allow_all_modules,
          seed_jewellery_defaults: payload.seed_jewellery_defaults,
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
  const branchState = formikFieldState(formik, "branch_name");
  const moduleAccessState = formikFieldState(formik, "module_access");
  const seedJewelleryState = formikFieldState(formik, "seed_jewellery_defaults");
  const hasJewellery = formik.values.module_access.includes("jewellery");

  const setModuleAccess = (modules: AppModuleCode[]) => {
    formik.setFieldValue("module_access", modules);
    if (!modules.includes("jewellery")) {
      formik.setFieldValue("seed_jewellery_defaults", false);
    }
  };

  const toggleModule = (module: AppModuleCode, checked: boolean) => {
    const current = formik.values.module_access;
    const next = checked
      ? (Array.from(new Set([...current, module])) as AppModuleCode[])
      : (current.filter((item) => item !== module) as AppModuleCode[]);
    setModuleAccess(next);
  };

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
            collectors, loans, and collections. A temporary password will be auto-generated and they
            will be asked to reset it on first login.
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

          <div className="space-y-3 rounded-lg border border-border p-3">
            <Checkbox
              label="Allow all modules at onboarding"
              name="allow_all_modules"
              checked={formik.values.allow_all_modules}
              onChange={(event) => {
                const checked = event.target.checked;
                formik.setFieldValue("allow_all_modules", checked);
                if (checked) setModuleAccess([...APP_MODULES]);
              }}
              onBlur={formik.handleBlur}
              helperText="If enabled, tenant gets Udhaar, Loans, and Jewellery access immediately."
              data-testid="tenant-allow-all-modules"
            />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Module Access</p>
              {APP_MODULES.map((module) => (
                <Checkbox
                  key={module}
                  label={MODULE_LABELS[module]}
                  name={`module_access_${module}`}
                  checked={formik.values.module_access.includes(module)}
                  disabled={formik.values.allow_all_modules}
                  onChange={(event) => toggleModule(module, event.target.checked)}
                  helperText={
                    module === "jewellery"
                      ? "Assigns tenant-level JWL admin role for module management."
                      : undefined
                  }
                  data-testid={`tenant-module-${module}`}
                />
              ))}
              {moduleAccessState.touched && moduleAccessState.error ? (
                <p className="text-xs text-danger-500">{moduleAccessState.error}</p>
              ) : null}
            </div>

            <Checkbox
              label="Seed jewellery defaults (tax slabs, purities, series)"
              name="seed_jewellery_defaults"
              checked={formik.values.seed_jewellery_defaults}
              disabled={!hasJewellery}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={seedJewelleryState.touched}
              error={seedJewelleryState.error}
              helperText="Runs one-time jewellery master seeding for this tenant during onboarding."
              data-testid="tenant-seed-jewellery"
            />
          </div>

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
