import { getIn, type FormikProps } from "formik";

export const formikFieldState = <TValues extends Record<string, unknown>>(
  formik: FormikProps<TValues>,
  fieldName: keyof TValues | string,
) => {
  const name = String(fieldName);
  const touched = Boolean(getIn(formik.touched, name));
  const rawError = getIn(formik.errors, name);
  const error = typeof rawError === "string" ? rawError : undefined;

  return {
    touched,
    error,
  };
};
