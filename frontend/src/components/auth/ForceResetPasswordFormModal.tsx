"use client";

import { useFormik } from "formik";

import {
  FormErrorBanner,
  PasswordInput,
  formikFieldState,
} from "@/components/forms/system";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  changePasswordInitialValues,
  changePasswordValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  type ChangePasswordFormValues,
} from "@/validation";

interface ForceResetPasswordFormModalProps {
  open: boolean;
  onBack: () => void;
  onSubmit: (values: { old_password: string; new_password: string }) => Promise<void>;
  isSubmitting?: boolean;
}

const PASSWORD_FIELDS: Array<keyof ChangePasswordFormValues> = ["old_password", "new_password", "confirm_password"];

export function ForceResetPasswordFormModal({
  open,
  onBack,
  onSubmit,
  isSubmitting = false,
}: ForceResetPasswordFormModalProps) {
  const formik = useFormik<ChangePasswordFormValues>({
    initialValues: changePasswordInitialValues,
    validationSchema: changePasswordValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await onSubmit({
          old_password: values.old_password,
          new_password: values.new_password,
        });
        helpers.resetForm();
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

  return (
    <Modal
      open={open}
      onClose={onBack}
      title="Reset your password"
      description="For security, set a new password to continue."
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onBack}
            disabled={formik.isSubmitting || isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form="force-reset-password-form"
            loading={formik.isSubmitting || isSubmitting}
            disabled={formik.isSubmitting || isSubmitting}
          >
            Update Password
          </Button>
        </>
      }
    >
      <form id="force-reset-password-form" className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
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
      </form>
    </Modal>
  );
}
