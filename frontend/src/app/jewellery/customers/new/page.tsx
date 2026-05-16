"use client";

import { useFormik } from "formik";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Yup from "yup";

import { TextInput } from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ROUTES } from "@/lib/routes";
import {
  useCreateCustomerMutation,
  useGetCustomerQuery,
  useUpdateCustomerMutation,
} from "@/store/jewellery-api";
import {
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
  toCustomerFormValues,
} from "../customer-form-defaults";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  mobile: Yup.string()
    .required("Mobile number is required")
    .matches(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  email: Yup.string().email("Enter a valid email address"),
  state_code: Yup.string().matches(/^\d{0,2}$/, "State code must be up to 2 digits"),
});

function CustomerFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") ?? "";
  const isEdit = Boolean(editId);

  const { data: existingCustomer, isFetching: isFetchingCustomer } = useGetCustomerQuery(editId, {
    skip: !editId,
  });

  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

  const formik = useFormik<CustomerFormValues>({
    enableReinitialize: true,
    initialValues: existingCustomer ? toCustomerFormValues(existingCustomer) : EMPTY_CUSTOMER_FORM_VALUES,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      const payload = {
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        email: values.email.trim() || undefined,
        address: values.address.trim() || undefined,
        city: values.city.trim() || undefined,
        gstin: values.gstin.trim() || undefined,
        pan: values.pan.trim() || undefined,
        state_code: values.state_code.trim() || undefined,
        dob: values.dob || null,
        anniversary: values.anniversary || null,
      };
      try {
        if (isEdit && editId) {
          await updateCustomer({ id: editId, ...payload }).unwrap();
        } else {
          await createCustomer(payload).unwrap();
        }
        router.push(ROUTES.app.jewellery.customers);
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  if (isEdit && isFetchingCustomer) {
    return (
      <Screen
        title="Edit customer"
        subtitle="Update customer details"
        backHref={ROUTES.app.jewellery.customers}
      >
        <SkeletonList count={5} />
      </Screen>
    );
  }

  function fieldState(name: keyof CustomerFormValues) {
    return {
      touched: Boolean(formik.touched[name]),
      error: typeof formik.errors[name] === "string" ? formik.errors[name] : undefined,
    };
  }

  const nameState = fieldState("name");
  const mobileState = fieldState("mobile");
  const emailState = fieldState("email");
  const addressState = fieldState("address");
  const cityState = fieldState("city");
  const gstinState = fieldState("gstin");
  const panState = fieldState("pan");
  const stateCodeState = fieldState("state_code");

  return (
    <Screen
      title={isEdit ? "Edit customer" : "Add customer"}
      subtitle={isEdit ? "Update customer details" : "Create a new customer profile"}
      backHref={ROUTES.app.jewellery.customers}
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4 max-w-lg" noValidate>
        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Basic info</p>

          <TextInput
            label="Name"
            name="name"
            required
            placeholder="Customer full name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={nameState.touched}
            error={nameState.error}
          />

          <TextInput
            label="Mobile"
            name="mobile"
            required
            placeholder="10-digit mobile number"
            inputMode="numeric"
            maxLength={10}
            value={formik.values.mobile}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={mobileState.touched}
            error={mobileState.error}
          />

          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="customer@email.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={emailState.touched}
            error={emailState.error}
          />
        </div>

        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Address</p>

          <TextInput
            label="Address"
            name="address"
            placeholder="Street / locality"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={addressState.touched}
            error={addressState.error}
          />

          <TextInput
            label="City"
            name="city"
            placeholder="City"
            value={formik.values.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={cityState.touched}
            error={cityState.error}
          />
        </div>

        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Tax details</p>

          <TextInput
            label="GSTIN"
            name="gstin"
            placeholder="15-character GSTIN"
            maxLength={15}
            value={formik.values.gstin}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={gstinState.touched}
            error={gstinState.error}
          />

          <TextInput
            label="PAN"
            name="pan"
            placeholder="10-character PAN"
            maxLength={10}
            value={formik.values.pan}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={panState.touched}
            error={panState.error}
          />

          <TextInput
            label="State code"
            name="state_code"
            placeholder="2-digit state code (e.g. 27)"
            maxLength={2}
            inputMode="numeric"
            value={formik.values.state_code}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={stateCodeState.touched}
            error={stateCodeState.error}
          />
        </div>

        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Personal dates</p>

          <DatePicker
            name="dob"
            label="Date of birth"
            value={formik.values.dob}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Select date of birth"
          />

          <DatePicker
            name="anniversary"
            label="Anniversary"
            value={formik.values.anniversary}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Select anniversary date"
          />
        </div>

        <div className="flex gap-3 pb-6">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => router.push(ROUTES.app.jewellery.customers)}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={formik.isSubmitting}>
            {isEdit ? "Save changes" : "Add customer"}
          </Button>
        </div>
      </form>
    </Screen>
  );
}

export default function NewCustomerPage() {
  return (
    <Suspense
      fallback={(
        <Screen title="Add customer" subtitle="Loading..." backHref={ROUTES.app.jewellery.customers}>
          {null}
        </Screen>
      )}
    >
      <CustomerFormInner />
    </Suspense>
  );
}
