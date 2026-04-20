"use client";

import { useFormik } from "formik";
import Link from "next/link";

import { BrandLogo } from "@/components/branding/BrandLogo";
import {
  FormErrorBanner,
  MobileNumberInput,
  PasswordInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import { useLoginMutation } from "@/features/auth/auth-api";
import { setAuth } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import {
  focusFirstInvalidField,
  loginInitialValues,
  loginValidationSchema,
  mapBackendErrorsToFormik,
  normalizeLoginValues,
  type LoginFormValues,
} from "@/validation";

function getPostLoginRedirect(role: string | undefined): string {
  switch (role) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "borrower":
      return "/portal";
    case "admin":
    case "collector":
    default:
      return "/dashboard";
  }
}

const LOGIN_FIELDS: Array<keyof LoginFormValues> = ["mobile_number", "password"];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const formik = useFormik<LoginFormValues>({
    initialValues: loginInitialValues,
    validationSchema: loginValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const normalized = normalizeLoginValues(values);
        const result = await login(normalized).unwrap();
        dispatch(setAuth({ access: result.access, user: result.user }));
        localStorage.setItem("accessToken", result.access);
        globalThis.location.href = getPostLoginRedirect(result.user?.role);
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, LOGIN_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const mobileState = formikFieldState(formik, "mobile_number");
  const passwordState = formikFieldState(formik, "password");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <BrandLogo size="lg" href="/" />
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your DailyBook account</p>
        </div>

        <div className="app-panel p-6 space-y-4">
          <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
            <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

            <MobileNumberInput
              label="Mobile Number"
              name="mobile_number"
              autoComplete="tel"
              value={formik.values.mobile_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={mobileState.touched}
              error={mobileState.error}
              placeholder="Enter registered mobile number"
              required
              data-testid="login-mobile-number"
            />

            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={passwordState.touched}
              error={passwordState.error}
              placeholder="Enter your password"
              required
              data-testid="login-password"
            />

            <div className="pt-1">
              <Button
                loading={formik.isSubmitting || isLoading}
                size="lg"
                type="submit"
                disabled={formik.isSubmitting || isLoading}
                fullWidth
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary-500 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
