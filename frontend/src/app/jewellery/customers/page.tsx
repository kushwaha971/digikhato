"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";

import { TextInput } from "@/components/forms/system";
import { StickyGlobalSearchBar } from "@/components/business/StickyGlobalSearchBar";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import { ROUTES } from "@/lib/routes";
import type { JwlCustomer } from "@/store/jewellery-api";
import {
  useCreateCustomerMutation,
  useGetCustomerQuery,
  useListCustomersQuery,
  useUpdateCustomerMutation,
} from "@/store/jewellery-api";
import {
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
  toCustomerFormValues,
} from "./customer-form-defaults";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  mobile: Yup.string()
    .required("Mobile number is required")
    .matches(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  email: Yup.string().email("Enter a valid email address"),
  state_code: Yup.string().matches(/^\d{0,2}$/, "State code must be up to 2 digits"),
});

function CustomerCard({ customer, onEdit }: Readonly<{ customer: JwlCustomer; onEdit: (id: string) => void }>) {
  return (
    <div className="app-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/jewellery/customers/${customer.id}`} className="block min-w-0 flex-1">
          <p className="font-semibold text-text truncate">{customer.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {customer.mobile}
            {customer.city ? <><span className="mx-1.5">·</span>{customer.city}</> : null}
          </p>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {customer.loyalty_points > 0 ? (
            <Badge variant="primary" className="shrink-0">
              {customer.loyalty_points} pts
            </Badge>
          ) : null}
          <Button size="xs" variant="secondary" onClick={() => onEdit(customer.id)}>Edit</Button>
        </div>
      </div>
    </div>
  );
}

export default function JewelleryCustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEditId = searchParams.get("edit") ?? "";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useListCustomersQuery({
    search: debouncedSearch.trim() || undefined,
  });

  const { data: existingCustomer, isFetching: isFetchingCustomer } = useGetCustomerQuery(editingId, {
    skip: !drawerOpen || !editingId,
  });

  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

  useEffect(() => {
    if (!queryEditId) return;
    setEditingId(queryEditId);
    setDrawerOpen(true);
  }, [queryEditId]);

  const loadMore = useCallback(() => setPage((prev) => prev + 1), []);
  const { items, hasMore, sentinelRef } = useInfiniteItems<JwlCustomer>(data, isFetching, page, loadMore);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId("");
    if (queryEditId) {
      router.replace(ROUTES.app.jewellery.customers, { scroll: false });
    }
  };

  const openCreate = () => {
    setEditingId("");
    setDrawerOpen(true);
    if (queryEditId) {
      router.replace(ROUTES.app.jewellery.customers, { scroll: false });
    }
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
    router.replace(`${ROUTES.app.jewellery.customers}?edit=${id}`, { scroll: false });
  };

  const isEdit = Boolean(editingId);

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
        if (isEdit && editingId) {
          await updateCustomer({ id: editingId, ...payload }).unwrap();
        } else {
          await createCustomer(payload).unwrap();
        }
        closeDrawer();
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  function fieldState(name: keyof CustomerFormValues) {
    return {
      touched: Boolean(formik.touched[name]),
      error: typeof formik.errors[name] === "string" ? formik.errors[name] : undefined,
    };
  }

  const drawerFooter = (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={closeDrawer}>Cancel</Button>
      <Button type="button" size="sm" onClick={() => void formik.submitForm()} loading={formik.isSubmitting}>
        {isEdit ? "Save changes" : "Add customer"}
      </Button>
    </>
  );

  return (
    <>
      <Screen
        title="Customers"
        subtitle="Manage customer profiles, KYC, and purchase history"
        backHref={ROUTES.app.jewellery.dashboard}
        actions={(
          <Button onClick={openCreate}>
            Add customer
          </Button>
        )}
      >
        <div className="space-y-3 mb-4">
          <StickyGlobalSearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name or mobile"
            sticky={false}
          />
        </div>

        {isFetching && page === 1 && <SkeletonList count={4} />}

        {!isFetching && items.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={search.trim() ? "No customers match your search." : "Add your first customer to get started."}
            action={{
              label: "Add customer",
              onClick: openCreate,
            }}
          />
        ) : null}

        {items.length > 0 ? (
          <>
            <div className="space-y-3">
              {items.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} onEdit={openEdit} />
              ))}
            </div>

            {hasMore ? <div ref={sentinelRef} className="h-1 mt-2" /> : null}
            {isFetching && page > 1 ? (
              <div className="py-4 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              </div>
            ) : null}
          </>
        ) : null}
      </Screen>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={isEdit ? "Edit customer" : "Add customer"}
        size="xl"
        footer={drawerFooter}
      >
        {isEdit && isFetchingCustomer ? (
          <SkeletonList count={4} />
        ) : (
          <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Basic info</p>
              <TextInput label="Name" name="name" required value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("name").touched} error={fieldState("name").error} />
              <TextInput label="Mobile" name="mobile" required maxLength={10} inputMode="numeric" value={formik.values.mobile} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("mobile").touched} error={fieldState("mobile").error} />
              <TextInput label="Email" name="email" type="email" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("email").touched} error={fieldState("email").error} />
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Address</p>
              <TextInput label="Address" name="address" value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("address").touched} error={fieldState("address").error} />
              <TextInput label="City" name="city" value={formik.values.city} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("city").touched} error={fieldState("city").error} />
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Tax details</p>
              <TextInput label="GSTIN" name="gstin" maxLength={15} value={formik.values.gstin} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("gstin").touched} error={fieldState("gstin").error} />
              <TextInput label="PAN" name="pan" maxLength={10} value={formik.values.pan} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("pan").touched} error={fieldState("pan").error} />
              <TextInput label="State code" name="state_code" maxLength={2} inputMode="numeric" value={formik.values.state_code} onChange={formik.handleChange} onBlur={formik.handleBlur} touched={fieldState("state_code").touched} error={fieldState("state_code").error} />
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Personal dates</p>
              <DatePicker name="dob" label="Date of birth" value={formik.values.dob} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              <DatePicker name="anniversary" label="Anniversary" value={formik.values.anniversary} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            </div>
          </form>
        )}
      </Drawer>
    </>
  );
}
