"use client";

import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

export type FieldFeedback = {
  touched?: boolean;
  error?: string;
  helperText?: string;
};

export const shouldShowError = ({ touched, error }: FieldFeedback) => Boolean(touched && error);

export function FormLabel({
  htmlFor,
  required,
  children,
  className,
}: PropsWithChildren<{ htmlFor?: string; required?: boolean; className?: string }>) {
  return (
    <label htmlFor={htmlFor} className={clsx("mb-1.5 block text-sm font-medium text-text", className)}>
      {children}
      {required ? <span className="ml-0.5 text-danger-600">*</span> : null}
    </label>
  );
}

export function FormErrorText({ id, children, className }: PropsWithChildren<{ id?: string; className?: string }>) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={clsx("mt-1.5 text-xs font-medium text-danger-600", className)}>
      {children}
    </p>
  );
}

export function FormHelperText({ id, children, className }: PropsWithChildren<{ id?: string; className?: string }>) {
  if (!children) return null;
  return (
    <p id={id} className={clsx("mt-1.5 text-xs text-muted", className)}>
      {children}
    </p>
  );
}

export function FormFieldWrapper({
  label,
  required,
  htmlFor,
  touched,
  error,
  helperText,
  errorId,
  helperId,
  className,
  children,
}: PropsWithChildren<{
  label?: string;
  required?: boolean;
  htmlFor?: string;
  touched?: boolean;
  error?: string;
  helperText?: string;
  errorId?: string;
  helperId?: string;
  className?: string;
}>) {
  const showError = shouldShowError({ touched, error });

  return (
    <div className={clsx("w-full", className)}>
      {label ? (
        <FormLabel htmlFor={htmlFor} required={required}>
          {label}
        </FormLabel>
      ) : null}
      {children}
      {showError ? <FormErrorText id={errorId}>{error}</FormErrorText> : null}
      {!showError && helperText ? <FormHelperText id={helperId}>{helperText}</FormHelperText> : null}
    </div>
  );
}

export function FormSection({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={clsx("space-y-4", className)} {...props} />;
}

export function FormErrorBanner({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={clsx(
        "rounded-xl border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm font-medium text-danger-700 dark:text-danger-400",
        className,
      )}
    >
      {message}
    </div>
  );
}
