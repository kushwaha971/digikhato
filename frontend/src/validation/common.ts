import type { FormikHelpers } from "formik";
import * as Yup from "yup";

import { REGEX } from "@/constants/regex";

export type Primitive = string | number | boolean | null | undefined;

export const requiredMessage = (label: string) => `${label} is required`;
export const minLengthMessage = (label: string, min: number) => `${label} must be at least ${min} characters`;
export const maxLengthMessage = (label: string, max: number) => `${label} must be at most ${max} characters`;

export const trimValue = (value: Primitive): Primitive => {
  if (typeof value === "string") return value.trim();
  return value;
};

export const trimObjectValues = <T extends Record<string, unknown>>(values: T): T => {
  const result = { ...values } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    const raw = result[key];
    if (typeof raw === "string") {
      result[key] = raw.trim();
    }
  }
  return result as T;
};

export const normalizeMobile = (value: string) => value.replace(/\D/g, "").slice(0, 15);
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const requiredTrimmedString = (label: string, min = 1, max = 255) =>
  Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .required(requiredMessage(label))
    .min(min, minLengthMessage(label, min))
    .max(max, maxLengthMessage(label, max));

export const optionalTrimmedString = (max = 255) =>
  Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .max(max, maxLengthMessage("Value", max))
    .nullable()
    .notRequired();

export const mobileSchema = (label = "Mobile number") =>
  Yup.string()
    .transform((value) => normalizeMobile(String(value ?? "")))
    .required(requiredMessage(label))
    .matches(REGEX.mobile, `${label} must be 10 to 15 digits`);

export const emailSchema = (label = "Email") =>
  Yup.string()
    .transform((value) => normalizeEmail(String(value ?? "")))
    .required(requiredMessage(label))
    .matches(REGEX.email, `${label} is invalid`);

export const currencyAmountSchema = (label = "Amount") =>
  Yup.number()
    .typeError(`${label} must be a valid number`)
    .required(requiredMessage(label))
    .moreThan(0, `${label} must be greater than 0`)
    .max(10_000_000, `${label} is too large`);

export const percentageSchema = (label = "Rate") =>
  Yup.number()
    .typeError(`${label} must be a valid number`)
    .required(requiredMessage(label))
    .min(0, `${label} cannot be negative`)
    .max(100, `${label} cannot exceed 100`);

export const positiveIntegerSchema = (label: string, min = 1) =>
  Yup.number()
    .typeError(`${label} must be a valid number`)
    .required(requiredMessage(label))
    .integer(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`);

export const isoDateSchema = (label = "Date") =>
  Yup.string()
    .required(requiredMessage(label))
    .matches(REGEX.isoDate, `${label} must be in YYYY-MM-DD format`);

export type BackendErrorResult = {
  fieldErrors: Record<string, string>;
  formError: string | null;
  allMessages: string[];
};

const prettifyKey = (key: string) => key.replace(/_/g, " ").trim();

export const extractApiErrorPayload = (error: unknown): unknown => {
  if (!error || typeof error !== "object") return error;
  if ("data" in error) return (error as { data?: unknown }).data;
  return error;
};

const flattenMessages = (value: unknown, keyLabel?: string): string[] => {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    return [keyLabel ? `${keyLabel}: ${text}` : text];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [keyLabel ? `${keyLabel}: ${String(value)}` : String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenMessages(entry, keyLabel));
  }

  if (typeof value === "object") {
    const data = value as Record<string, unknown>;
    const knownGeneralKeys = ["detail", "message", "non_field_errors", "error", "errors"];
    const messages: string[] = [];

    for (const key of knownGeneralKeys) {
      if (key in data) messages.push(...flattenMessages(data[key], keyLabel));
    }

    for (const [key, entry] of Object.entries(data)) {
      if (knownGeneralKeys.includes(key)) continue;
      messages.push(...flattenMessages(entry, prettifyKey(key)));
    }

    return messages;
  }

  return [];
};

export const parseBackendErrors = (error: unknown): BackendErrorResult => {
  const payload = extractApiErrorPayload(error);
  const fieldErrors: Record<string, string> = {};
  const formMessages: string[] = [];

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      if (["detail", "message", "non_field_errors", "error", "errors"].includes(key)) {
        formMessages.push(...flattenMessages(value));
        continue;
      }

      const fieldMessage = flattenMessages(value).join(" | ").trim();
      if (fieldMessage) {
        fieldErrors[key] = fieldMessage;
      }
    }
  }

  const allMessages = Array.from(
    new Set(
      [...Object.values(fieldErrors), ...formMessages, ...flattenMessages(payload)]
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );

  return {
    fieldErrors,
    formError: formMessages[0] ?? (allMessages[0] ?? null),
    allMessages,
  };
};

export const mapBackendErrorsToFormik = <TValues extends Record<string, unknown>>(
  error: unknown,
  helpers: FormikHelpers<TValues>,
  knownFields: Array<keyof TValues> = [],
) => {
  const parsed = parseBackendErrors(error);
  const known = new Set(knownFields.map(String));

  for (const [field, message] of Object.entries(parsed.fieldErrors)) {
    if (known.size === 0 || known.has(field)) {
      helpers.setFieldError(field, message);
    }
  }

  const formOnlyMessages = Object.entries(parsed.fieldErrors)
    .filter(([field]) => known.size > 0 && !known.has(field))
    .map(([, message]) => message);

  const combined = [...formOnlyMessages, ...(parsed.formError ? [parsed.formError] : [])].filter(Boolean);
  if (combined.length) {
    helpers.setStatus({ formError: combined.join(" | ") });
  }

  return parsed;
};

export const focusFirstInvalidField = (fieldNames: string[]) => {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    for (const fieldName of fieldNames) {
      const selector = `[name=\"${fieldName}\"]`;
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }
  });
};
