"use client";

import { useFormik } from "formik";
import { useParams, useRouter } from "next/navigation";

import {
  CurrencyInput,
  DateInput,
  FormErrorBanner,
  formikFieldState,
} from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { useCreateDailyCollectionMutation, useGetAccountQuery } from "@/features/accounts/account-api";
import {
  collectionValidationSchema,
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  type CollectionFormValues,
} from "@/validation";

const COLLECTION_FIELDS: Array<keyof CollectionFormValues> = ["account", "payment", "date"];

export default function AddCollectionPage() {
  const params = useParams<{ id: string; aid: string }>();
  const router = useRouter();
  const borrowerId = params.id;
  const accountRef = params.aid;
  const [createCollection] = useCreateDailyCollectionMutation();
  const { data: account } = useGetAccountQuery(accountRef, { skip: !accountRef });
  const accountId = account?.id ?? (Number.isFinite(Number(accountRef)) ? Number(accountRef) : 0);

  const formik = useFormik<CollectionFormValues>({
    enableReinitialize: true,
    initialValues: {
      account: accountId,
      payment: 0,
      date: new Date().toISOString().split("T")[0],
    },
    validationSchema: collectionValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        if (!accountId) {
          helpers.setStatus({ formError: "Unable to resolve account. Please reload and try again." });
          return;
        }
        await createCollection({
          account: accountId,
          payment: Number(values.payment),
          date: values.date,
        }).unwrap();
        router.back();
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, COLLECTION_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const paymentState = formikFieldState(formik, "payment");
  const dateState = formikFieldState(formik, "date");

  return (
    <Screen
      title="Add Collection"
      backHref={`/borrowers/${borrowerId}/accounts/${accountRef}`}
      breadcrumb={[
        { label: "Borrowers", href: "/borrowers" },
        { label: "Borrower", href: `/borrowers/${borrowerId}` },
        { label: "Account", href: `/borrowers/${borrowerId}/accounts/${accountRef}` },
        { label: "Add Collection" },
      ]}
    >
      <div className="max-w-sm mx-auto">
        <div className="app-panel p-6 space-y-4">
          <p className="text-sm text-muted">Record today&apos;s payment for this account.</p>

          <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
            <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

            <CurrencyInput
              label="Payment Amount"
              name="payment"
              value={formik.values.payment}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={paymentState.touched}
              error={paymentState.error}
              placeholder="0.00"
              required
            />

            <DateInput
              label="Date"
              name="date"
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              touched={dateState.touched}
              error={dateState.error}
              required
            />

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => router.back()} fullWidth>
                Cancel
              </Button>
              <Button type="submit" disabled={formik.isSubmitting || !accountId} loading={formik.isSubmitting} fullWidth>
                Save Collection
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Screen>
  );
}
