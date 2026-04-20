"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  useChangePasswordMutation,
  useLogoutMutation,
  useUpdateMeMutation,
} from "@/features/auth/auth-api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { clearAuth, setCurrentUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  changePasswordInitialValues,
  changePasswordValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  normalizeMobile,
  profileInitialValues,
  profileValidationSchema,
  trimObjectValues,
  type ChangePasswordFormValues,
  type ProfileFormValues,
} from "@/validation";

const PROFILE_FIELDS: Array<keyof ProfileFormValues> = ["full_name", "mobile_number", "branch_name"];
const PASSWORD_FIELDS: Array<keyof ChangePasswordFormValues> = ["old_password", "new_password", "confirm_password"];

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { theme } = useTheme();
  const isOnline = useOnlineStatus();

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
  const [changePassword, { isLoading: isChangingPw }] = useChangePasswordMutation();

  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const profileInitial = useMemo<ProfileFormValues>(
    () => ({
      full_name: currentUser?.full_name ?? profileInitialValues.full_name,
      mobile_number: currentUser?.mobile_number ?? profileInitialValues.mobile_number,
      branch_name: currentUser?.branch_name ?? profileInitialValues.branch_name,
    }),
    [currentUser],
  );

  const profileFormik = useFormik<ProfileFormValues>({
    enableReinitialize: true,
    initialValues: profileInitial,
    validationSchema: profileValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      setProfileSaved(false);
      try {
        const payload = trimObjectValues(values);
        payload.mobile_number = normalizeMobile(payload.mobile_number);
        const updated = await updateMe(payload).unwrap();
        dispatch(setCurrentUser(updated));
        setProfileSaved(true);
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, PROFILE_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik<ChangePasswordFormValues>({
    initialValues: changePasswordInitialValues,
    validationSchema: changePasswordValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      setPasswordSaved(false);
      try {
        await changePassword({
          old_password: values.old_password,
          new_password: values.new_password,
        }).unwrap();
        helpers.resetForm();
        setPasswordSaved(true);
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, PASSWORD_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!profileSaved) return;
    const timer = setTimeout(() => setProfileSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [profileSaved]);

  useEffect(() => {
    if (!passwordSaved) return;
    const timer = setTimeout(() => setPasswordSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [passwordSaved]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      localStorage.removeItem("accessToken");
      dispatch(clearAuth());
      router.push("/login");
    }
  };

  const handleThemeSave = async () => {
    await updateMe({ theme_preference: theme }).unwrap();
  };

  const fullNameState = formikFieldState(profileFormik, "full_name");
  const mobileState = formikFieldState(profileFormik, "mobile_number");
  const branchState = formikFieldState(profileFormik, "branch_name");

  const oldPasswordState = formikFieldState(passwordFormik, "old_password");
  const newPasswordState = formikFieldState(passwordFormik, "new_password");
  const confirmPasswordState = formikFieldState(passwordFormik, "confirm_password");

  return (
    <Screen title="Settings">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="app-panel">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-base font-bold flex-shrink-0">
              {currentUser?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="font-semibold text-text">Profile</h2>
              <p className="text-xs text-muted capitalize">{currentUser?.role?.replace("_", " ") ?? "—"}</p>
            </div>
          </div>

          <form className="p-4 space-y-3" onSubmit={profileFormik.handleSubmit} noValidate>
            <FormErrorBanner message={(profileFormik.status as { formError?: string } | undefined)?.formError} />

            <TextInput
              label="Full Name"
              name="full_name"
              value={profileFormik.values.full_name}
              onChange={profileFormik.handleChange}
              onBlur={profileFormik.handleBlur}
              touched={fullNameState.touched}
              error={fullNameState.error}
              required
            />

            <MobileNumberInput
              label="Mobile Number"
              name="mobile_number"
              value={profileFormik.values.mobile_number}
              onChange={profileFormik.handleChange}
              onBlur={profileFormik.handleBlur}
              touched={mobileState.touched}
              error={mobileState.error}
              required
            />

            <TextInput
              label="Branch / Business Name"
              name="branch_name"
              value={profileFormik.values.branch_name}
              onChange={profileFormik.handleChange}
              onBlur={profileFormik.handleBlur}
              touched={branchState.touched}
              error={branchState.error}
              placeholder="Optional"
            />

            {profileSaved ? <p className="text-xs text-success-600 font-medium">Profile updated successfully.</p> : null}

            <Button
              size="sm"
              fullWidth={false}
              loading={profileFormik.isSubmitting || isSaving}
              disabled={profileFormik.isSubmitting || isSaving}
              type="submit"
            >
              Save Profile
            </Button>
          </form>
        </div>

        <div className="app-panel">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text">Change Password</h2>
          </div>

          <form className="p-4 space-y-3" onSubmit={passwordFormik.handleSubmit} noValidate>
            <FormErrorBanner message={(passwordFormik.status as { formError?: string } | undefined)?.formError} />

            <PasswordInput
              label="Current Password"
              name="old_password"
              value={passwordFormik.values.old_password}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              touched={oldPasswordState.touched}
              error={oldPasswordState.error}
              placeholder="Enter current password"
              required
            />

            <PasswordInput
              label="New Password"
              name="new_password"
              value={passwordFormik.values.new_password}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              touched={newPasswordState.touched}
              error={newPasswordState.error}
              placeholder="Strong password"
              helperText="At least 8 chars, one uppercase, one number, one special char"
              required
            />

            <PasswordInput
              label="Confirm New Password"
              name="confirm_password"
              value={passwordFormik.values.confirm_password}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              touched={confirmPasswordState.touched}
              error={confirmPasswordState.error}
              placeholder="Repeat new password"
              required
            />

            {passwordSaved ? <p className="text-xs text-success-600 font-medium">Password changed successfully.</p> : null}

            <Button
              size="sm"
              fullWidth={false}
              loading={passwordFormik.isSubmitting || isChangingPw}
              disabled={passwordFormik.isSubmitting || isChangingPw}
              type="submit"
            >
              Change Password
            </Button>
          </form>
        </div>

        <div className="app-panel">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text">System</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text">Sync Status</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isOnline ? "text-success-600" : "text-danger-600"}`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-success-500" : "bg-danger-500"}`} />
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="app-panel">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text">Preferences</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text">Theme</p>
              <ThemeToggle />
            </div>
            <Button variant="secondary" size="sm" fullWidth={false} onClick={handleThemeSave} type="button">
              Save Theme
            </Button>
          </div>
        </div>

        <div className="app-panel">
          <div className="p-4">
            <Button variant="danger" disabled={isLoggingOut} onClick={handleLogout} type="button" fullWidth={false}>
              {isLoggingOut ? "Logging out…" : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
