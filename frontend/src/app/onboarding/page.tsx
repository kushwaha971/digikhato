"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/branding/BrandLogo";
import {
  FormErrorBanner,
  SelectInput,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import { useUpdateMeMutation } from "@/features/auth/auth-api";
import {
  useGetBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
} from "@/features/onboarding/onboarding-api";
import {
  mapBackendErrorsToFormik,
  onboardingInitialValues,
  onboardingValidationSchema,
  trimObjectValues,
  type OnboardingFormValues,
} from "@/validation";
import { ROUTES } from "@/lib/routes";

const ONBOARDING_FIELDS: Array<keyof OnboardingFormValues> = ["business_name", "area_name", "currency"];

export default function OnboardingPage() {
  const router = useRouter();
  const { data } = useGetBusinessProfileQuery();
  const [updateProfile, { isLoading, isSuccess }] = useUpdateBusinessProfileMutation();
  const [updateMe] = useUpdateMeMutation();

  const formik = useFormik<OnboardingFormValues>({
    enableReinitialize: true,
    initialValues: {
      business_name: data?.business_name ?? onboardingInitialValues.business_name,
      area_name: data?.area_name ?? onboardingInitialValues.area_name,
      currency: data?.currency ?? onboardingInitialValues.currency,
    },
    validationSchema: onboardingValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const payload = trimObjectValues(values);
        await updateProfile(payload).unwrap();
        await updateMe({ onboarding_completed: true }).unwrap();
      } catch (error) {
        mapBackendErrorsToFormik(error, helpers, ONBOARDING_FIELDS);
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const businessState = formikFieldState(formik, "business_name");
  const areaState = formikFieldState(formik, "area_name");
  const currencyState = formikFieldState(formik, "currency");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <BrandLogo size="lg" href="/" />
          </div>
          <h1 className="text-2xl font-bold text-text">Set up your workspace</h1>
          <p className="text-muted text-sm mt-1">Set your core workspace details and start with your included apps</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">1</span>
            <span className="text-xs font-medium text-primary-500">Account</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">2</span>
            <span className="text-xs font-medium text-primary-500">Workspace</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="app-panel p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-text mb-1">You&apos;re all set!</h2>
            <p className="text-sm text-muted mb-6">Your workspace is ready. UdhaarBook and Notes are included by default. Other apps can be activated later.</p>
            <Button size="lg" fullWidth onClick={() => { router.replace(ROUTES.app.udhaarbook.root); }}>
              Go to Apps
            </Button>
          </div>
        ) : (
          <div className="app-panel p-6">
            <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
              <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

              <TextInput
                label="Business Name"
                name="business_name"
                value={formik.values.business_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                touched={businessState.touched}
                error={businessState.error}
                placeholder="e.g. Sharma Finance"
                required
                data-testid="onboarding-business-name"
              />

              <TextInput
                label="Branch / Area (optional)"
                name="area_name"
                value={formik.values.area_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                touched={areaState.touched}
                error={areaState.error}
                placeholder="e.g. Sector 14, Gurgaon"
                data-testid="onboarding-area-name"
              />

              <SelectInput
                label="Currency"
                name="currency"
                value={formik.values.currency}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                touched={currencyState.touched}
                error={currencyState.error}
                required
                data-testid="onboarding-currency"
              >
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="GBP">£ GBP — British Pound</option>
              </SelectInput>

              <div className="pt-1">
                <Button
                  loading={formik.isSubmitting || isLoading}
                  size="lg"
                  type="submit"
                  disabled={formik.isSubmitting || isLoading}
                  fullWidth
                >
                  Save &amp; Continue
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
