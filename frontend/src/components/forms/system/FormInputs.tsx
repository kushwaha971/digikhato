"use client";

import clsx from "clsx";
import {
  type ChangeEventHandler,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
  useState,
} from "react";

import { FormFieldWrapper, shouldShowError } from "@/components/forms/system/FormPrimitives";
import { DatePicker } from "@/components/ui/DatePicker";

type BaseFormFieldProps = {
  label?: string;
  name: string;
  value?: string | number;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  touched?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  readOnly?: boolean;
  "data-testid"?: string;
  className?: string;
};

const fieldShellClass = (hasError: boolean) =>
  clsx(
    "flex items-center w-full rounded-xl border bg-surface text-text transition-all duration-150",
    "focus-within:ring-2 focus-within:ring-offset-0",
    hasError
      ? "border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/25"
      : "border-border hover:border-border-strong focus-within:border-primary-500 focus-within:ring-primary-500/20",
  );

const inputBaseClass =
  "w-full min-w-0 bg-transparent px-4 py-2.5 text-sm text-text placeholder:text-muted/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 read-only:opacity-70";
const selectBaseClass =
  "w-full appearance-none rounded-xl border bg-surface px-4 py-2.5 text-sm text-text transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

function describedById(hasError: boolean, errorId: string, helperText?: string, helperId?: string) {
  if (hasError) return errorId;
  if (helperText && helperId) return helperId;
  return undefined;
}

export type TextInputProps = BaseFormFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange" | "onBlur" | "placeholder"> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  };

export function TextInput({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  required,
  disabled,
  placeholder,
  helperText,
  readOnly,
  prefix,
  suffix,
  id,
  className,
  type = "text",
  "data-testid": dataTestId,
  ...rest
}: TextInputProps) {
  const generated = useId();
  const inputId = id ?? `${name}-${generated}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = shouldShowError({ touched, error });

  return (
    <FormFieldWrapper
      label={label}
      required={required}
      htmlFor={inputId}
      touched={touched}
      error={error}
      helperText={helperText}
      errorId={errorId}
      helperId={helperId}
      className={className}
    >
      <div className={fieldShellClass(hasError)}>
        {prefix ? <span className="shrink-0 border-r border-border px-3 py-2.5 text-sm text-muted">{prefix}</span> : null}
        <input
          id={inputId}
          name={name}
          value={value ?? ""}
          onChange={onChange as ChangeEventHandler<HTMLInputElement>}
          onBlur={onBlur as FocusEventHandler<HTMLInputElement>}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={hasError}
          aria-describedby={describedById(hasError, errorId, helperText, helperId)}
          className={clsx(inputBaseClass, suffix ? "pr-2" : "")}
          data-testid={dataTestId}
          {...rest}
        />
        {suffix ? <span className="shrink-0 pr-3 text-muted">{suffix}</span> : null}
      </div>
    </FormFieldWrapper>
  );
}

export type TextAreaProps = BaseFormFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "value" | "onChange" | "onBlur" | "placeholder">;

export function TextArea({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  required,
  disabled,
  placeholder,
  helperText,
  readOnly,
  id,
  className,
  rows = 3,
  "data-testid": dataTestId,
  ...rest
}: TextAreaProps) {
  const generated = useId();
  const inputId = id ?? `${name}-${generated}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = shouldShowError({ touched, error });

  return (
    <FormFieldWrapper
      label={label}
      required={required}
      htmlFor={inputId}
      touched={touched}
      error={error}
      helperText={helperText}
      errorId={errorId}
      helperId={helperId}
      className={className}
    >
      <textarea
        id={inputId}
        name={name}
        value={value ?? ""}
        onChange={onChange as ChangeEventHandler<HTMLTextAreaElement>}
        onBlur={onBlur as FocusEventHandler<HTMLTextAreaElement>}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={describedById(hasError, errorId, helperText, helperId)}
        className={clsx(fieldShellClass(hasError), "min-h-[96px] px-4 py-2.5 text-sm", "focus:outline-none")}
        data-testid={dataTestId}
        {...rest}
      />
    </FormFieldWrapper>
  );
}

export type SelectInputProps = BaseFormFieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "value" | "onChange" | "onBlur" | "placeholder"> & {
    options?: Array<{ label: string; value: string | number; disabled?: boolean }>;
  };

export function SelectInput({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  required,
  disabled,
  helperText,
  readOnly,
  id,
  className,
  options,
  children,
  "data-testid": dataTestId,
  ...rest
}: SelectInputProps) {
  const generated = useId();
  const inputId = id ?? `${name}-${generated}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = shouldShowError({ touched, error });

  return (
    <FormFieldWrapper
      label={label}
      required={required}
      htmlFor={inputId}
      touched={touched}
      error={error}
      helperText={helperText}
      errorId={errorId}
      helperId={helperId}
      className={className}
    >
      <div className="relative">
        <select
          id={inputId}
          name={name}
          value={value ?? ""}
          onChange={onChange as ChangeEventHandler<HTMLSelectElement>}
          onBlur={onBlur as FocusEventHandler<HTMLSelectElement>}
          required={required}
          disabled={disabled || readOnly}
          aria-invalid={hasError}
          aria-describedby={describedById(hasError, errorId, helperText, helperId)}
          className={clsx(
            selectBaseClass,
            hasError
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/25"
              : "border-border hover:border-border-strong focus:border-primary-500 focus:ring-primary-500/20",
          )}
          data-testid={dataTestId}
          {...rest}
        >
          {options?.map((option) => (
            <option key={String(option.value)} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </FormFieldWrapper>
  );
}

export type PasswordFieldProps = Omit<TextInputProps, "type" | "suffix">;

export function PasswordInput(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextInput
      {...props}
      type={visible ? "text" : "password"}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="rounded p-1 text-xs font-medium text-muted hover:text-text focus-visible:outline-none"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}

export function EmailInput(props: Omit<TextInputProps, "type">) {
  return <TextInput {...props} type="email" autoComplete="email" />;
}

export function MobileNumberInput(props: Omit<TextInputProps, "type" | "inputMode">) {
  return <TextInput {...props} type="tel" inputMode="numeric" autoComplete="tel" />;
}

export function NumberInput(props: Omit<TextInputProps, "type">) {
  return <TextInput {...props} type="number" inputMode="decimal" />;
}

export function CurrencyInput(props: Omit<TextInputProps, "type" | "inputMode" | "prefix"> & { currencySymbol?: string }) {
  const { currencySymbol = "₹", ...rest } = props;
  return <TextInput {...rest} type="number" inputMode="decimal" step="0.01" prefix={currencySymbol} />;
}

export function DateInput(props: Omit<TextInputProps, "type">) {
  const { value, onChange, onBlur, min, max, ...rest } = props;
  return (
    <DatePicker
      {...rest}
      value={typeof value === "string" ? value : String(value ?? "")}
      onChange={onChange as ChangeEventHandler<HTMLInputElement>}
      onBlur={onBlur as FocusEventHandler<HTMLInputElement>}
      min={typeof min === "string" ? min : undefined}
      max={typeof max === "string" ? max : undefined}
    />
  );
}

export type CheckboxProps = {
  label: string;
  name: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  touched?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  "data-testid"?: string;
};

export function Checkbox({
  label,
  name,
  checked,
  onChange,
  onBlur,
  touched,
  error,
  required,
  disabled,
  helperText,
  "data-testid": dataTestId,
}: CheckboxProps) {
  const generated = useId();
  const inputId = `${name}-${generated}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = shouldShowError({ touched, error });

  return (
    <FormFieldWrapper
      touched={touched}
      error={error}
      helperText={helperText}
      errorId={errorId}
      helperId={helperId}
    >
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2 text-sm text-text">
        <input
          id={inputId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={describedById(hasError, errorId, helperText, helperId)}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          data-testid={dataTestId}
        />
        <span>{label}</span>
      </label>
    </FormFieldWrapper>
  );
}

export type RadioGroupProps = {
  label?: string;
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  touched?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  options: Array<{ label: string; value: string; description?: string; disabled?: boolean }>;
  "data-testid"?: string;
};

export function RadioGroup({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  required,
  disabled,
  helperText,
  options,
  "data-testid": dataTestId,
}: RadioGroupProps) {
  const generated = useId();
  const groupId = `${name}-${generated}`;
  const errorId = `${groupId}-error`;
  const helperId = `${groupId}-helper`;
  const hasError = shouldShowError({ touched, error });

  return (
    <FormFieldWrapper
      label={label}
      required={required}
      touched={touched}
      error={error}
      helperText={helperText}
      errorId={errorId}
      helperId={helperId}
    >
      <div role="radiogroup" aria-invalid={hasError} aria-describedby={describedById(hasError, errorId, helperText, helperId)} className="space-y-2">
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const checked = value === option.value;

          return (
            <label key={option.value} htmlFor={optionId} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled || option.disabled}
                className="mt-0.5 h-4 w-4 border-border text-primary-500 focus:ring-primary-500"
                data-testid={dataTestId ? `${dataTestId}-${option.value}` : undefined}
              />
              <span>
                <span className="font-medium">{option.label}</span>
                {option.description ? <span className="mt-0.5 block text-xs text-muted">{option.description}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </FormFieldWrapper>
  );
}
