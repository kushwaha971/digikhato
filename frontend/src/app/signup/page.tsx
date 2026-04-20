"use client";

import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/branding/BrandLogo";
import {
  FormErrorBanner,
  MobileNumberInput,
  PasswordInput,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import { useSignupMutation } from "@/features/auth/auth-api";
import {
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  normalizeMobile,
  signupInitialValues,
  signupValidationSchema,
  trimObjectValues,
  type SignupFormValues,
} from "@/validation";

const SIGNUP_FIELDS: Array<keyof SignupFormValues> = [
  "full_name",
  "mobile_number",
  "password",
  "confirm_password",
];

export default function SignupPage() {
  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();

  const formik = useFormik<SignupFormValues>({
    initialValues: signupInitialValues,
    validationSchema: signupValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const normalized = trimObjectValues(values);
        await signup({
          full_name: normalized.full_name,
          mobile_number: normalizeMobile(normalized.mobile_number),
          password: normalized.password,
          role: "admin",
        }).unwrap();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
          return;
        }
        router.replace("/login");
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, SIGNUP_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const fullNameState = formikFieldState(formik, "full_name");
  const mobileState = formikFieldState(formik, "mobile_number");
  const passwordState = formikFieldState(formik, "password");
  const confirmState = formikFieldState(formik, "confirm_password");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <BrandLogo size="lg" href="/" />
          </div>
          <h1 className="text-2xl font-bold text-text">Create your account</h1>
          <p className="text-muted text-sm mt-1">Set up your DailyBook workspace</p>
        </div>

        <div className="app-panel p-6 space-y-4">
          <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
            <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

            <TextInput
              label="Full Name"
              name="full_name"
              value={formik.values.full_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={fullNameState.touched}
              error={fullNameState.error}
              placeholder="Enter your full name"
              required
              data-testid="signup-full-name"
            />

            <MobileNumberInput
              label="Mobile Number"
              name="mobile_number"
              value={formik.values.mobile_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={mobileState.touched}
              error={mobileState.error}
              placeholder="Enter mobile number"
              required
              data-testid="signup-mobile-number"
            />

            <PasswordInput
              label="Password"
              name="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={passwordState.touched}
              error={passwordState.error}
              placeholder="Set a strong password"
              helperText="At least 8 chars, one uppercase, one number, one special char"
              required
              data-testid="signup-password"
            />

            <PasswordInput
              label="Confirm Password"
              name="confirm_password"
              autoComplete="new-password"
              value={formik.values.confirm_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={confirmState.touched}
              error={confirmState.error}
              placeholder="Re-enter your password"
              required
              data-testid="signup-confirm-password"
            />

            <div className="pt-1">
              <Button
                loading={formik.isSubmitting || isLoading}
                size="lg"
                type="submit"
                disabled={formik.isSubmitting || isLoading}
                fullWidth
              >
                Create Account
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
