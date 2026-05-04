"use client";

import Link from "next/link";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  useChangePasswordMutation,
  useLogoutMutation,
  useUpdateMeMutation,
} from "@/features/auth/auth-api";
import { useFeatureFlag, useRoleAccess } from "@/hooks/useRoleAccess";
import { ROUTES } from "@/lib/routes";
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
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

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

  const { isAdmin, can } = useRoleAccess();
  const jewelleryEnabled = useFeatureFlag("jewellery");

  const coreApps = [
    { key: "udhaar", label: "UdhaarBook", status: "Included" },
    { key: "notes", label: "Notes", status: "Included" },
  ];
  const addonApps = [
    {
      key: "loans",
      label: "Loan Management",
      status: can("view:dashboard") ? "Active" : "Role Locked",
    },
    {
      key: "jewellery",
      label: "Jewellery ERP",
      status: jewelleryEnabled
        ? can("view:jewellery")
          ? "Active"
          : "Role Locked"
        : "Activation Pending",
    },
  ];

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
              placeholder="New password"
              helperText="Minimum 8 characters"
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
            <h2 className="font-semibold text-text">Workspace & Access</h2>
            <p className="text-xs text-muted mt-0.5">
              SaaS-style app access model for your workspace.
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Included Apps</p>
              <div className="space-y-2">
                {coreApps.map((app) => (
                  <AccessRow key={app.key} label={app.label} status={app.status} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Other Apps</p>
              <div className="space-y-2">
                {addonApps.map((app) => (
                  <AccessRow key={app.key} label={app.label} status={app.status} />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted">
              Payment gateway and external billing are not configured yet. Module activation is managed internally.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="app-panel">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-text">Admin</h2>
              <p className="text-xs text-muted mt-0.5">Manage your team and loan organisation</p>
            </div>
            <div className="divide-y divide-border">
              <Link href={ROUTES.app.team} className="flex items-center justify-between px-4 py-3 hover:bg-surface2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Team</p>
                    <p className="text-xs text-muted">Add and manage collectors</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href={ROUTES.app.loans.locations} className="flex items-center justify-between px-4 py-3 hover:bg-surface2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Locations</p>
                    <p className="text-xs text-muted">Create and manage borrower locations</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

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
            <Button
              variant="danger"
              disabled={isLoggingOut}
              onClick={() => setConfirmLogoutOpen(true)}
              type="button"
              fullWidth={false}
            >
              {isLoggingOut ? "Logging out…" : "Logout"}
            </Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={async () => {
          await handleLogout();
          setConfirmLogoutOpen(false);
        }}
        isLoading={isLoggingOut}
        title="Confirm Logout"
        description="Are you sure you want to log out?"
        confirmLabel="Log out"
        confirmVariant="danger"
      />
    </Screen>
  );
}

function AccessRow({ label, status }: Readonly<{ label: string; status: string }>) {
  const toneClass =
    status === "Active" || status === "Included"
      ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
      : status === "Activation Pending"
        ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300"
        : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-surface2/40">
      <p className="text-sm text-text">{label}</p>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}>
        {status}
      </span>
    </div>
  );
}
