"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";

import { BrandLogo } from "@/components/branding/BrandLogo";
import {
  FormErrorBanner,
  PasswordInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import { useChangePasswordMutation, useGetMeQuery } from "@/features/auth/auth-api";
import { ROUTES } from "@/lib/routes";
import { setCurrentUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  changePasswordInitialValues,
  changePasswordValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  type ChangePasswordFormValues,
} from "@/validation";

const PASSWORD_FIELDS: Array<keyof ChangePasswordFormValues> = ["old_password", "new_password", "confirm_password"];

function getPostResetRedirect(role: string | undefined): string {
  if (role === "super_admin") return ROUTES.app.superAdmin.dashboard;
  return ROUTES.app.udhaarbook.root;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, currentUser } = useAppSelector((state) => state.auth);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const { data: me } = useGetMeQuery(undefined, {
    skip: !accessToken || Boolean(currentUser),
  });

  useEffect(() => {
    if (me) {
      dispatch(setCurrentUser(me));
    }
  }, [dispatch, me]);

  const effectiveUser = useMemo(() => currentUser ?? me ?? null, [currentUser, me]);

  useEffect(() => {
    if (!accessToken) {
      router.replace(ROUTES.public.login);
      return;
    }

    if (effectiveUser && !effectiveUser.must_reset_password) {
      router.replace(getPostResetRedirect(effectiveUser.role));
    }
  }, [accessToken, effectiveUser, router]);

  const formik = useFormik<ChangePasswordFormValues>({
    initialValues: changePasswordInitialValues,
    validationSchema: changePasswordValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await changePassword({
          old_password: values.old_password,
          new_password: values.new_password,
        }).unwrap();

        if (effectiveUser) {
          dispatch(setCurrentUser({ ...effectiveUser, must_reset_password: false }));
          router.replace(getPostResetRedirect(effectiveUser.role));
        } else {
          router.replace(ROUTES.app.udhaarbook.root);
        }
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, PASSWORD_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const oldPasswordState = formikFieldState(formik, "old_password");
  const newPasswordState = formikFieldState(formik, "new_password");
  const confirmPasswordState = formikFieldState(formik, "confirm_password");

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <BrandLogo size="lg" href="/" />
          </div>
          <h1 className="text-2xl font-bold text-text">Reset your password</h1>
          <p className="text-muted text-sm mt-1">Please reset your password before continuing.</p>
        </div>

        <div className="app-panel p-6 space-y-4">
          <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
            <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

            <PasswordInput
              label="Current Password"
              name="old_password"
              autoComplete="current-password"
              value={formik.values.old_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={oldPasswordState.touched}
              error={oldPasswordState.error}
              placeholder="Enter current password"
              required
            />

            <PasswordInput
              label="New Password"
              name="new_password"
              autoComplete="new-password"
              value={formik.values.new_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={newPasswordState.touched}
              error={newPasswordState.error}
              placeholder="Enter new password"
              helperText="Minimum 8 characters"
              required
            />

            <PasswordInput
              label="Confirm New Password"
              name="confirm_password"
              autoComplete="new-password"
              value={formik.values.confirm_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={confirmPasswordState.touched}
              error={confirmPasswordState.error}
              placeholder="Confirm new password"
              required
            />

            <div className="pt-1">
              <Button
                loading={formik.isSubmitting || isLoading}
                size="lg"
                type="submit"
                disabled={formik.isSubmitting || isLoading}
                fullWidth
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
