"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { invoiceStatusVariant } from "@/constants/jewellery";
import { ROUTES } from "@/lib/routes";
import { useGetCustomerQuery, useListInvoicesQuery } from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

function InfoRow({ label, value }: Readonly<{ label: string; value?: string | null }>) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-medium text-text mt-0.5">{value}</p>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const { data: customer, isFetching: isFetchingCustomer } = useGetCustomerQuery(id);
  const { data: invoicesData, isFetching: isFetchingInvoices } = useListInvoicesQuery({
    customer: id,
    page: 1,
  });

  if (isFetchingCustomer) {
    return (
      <Screen
        title="Customer"
        subtitle="Loading customer details..."
        backHref={ROUTES.app.jewellery.customers}
      >
        <SkeletonList count={4} />
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen
        title="Customer not found"
        backHref={ROUTES.app.jewellery.customers}
      >
        <EmptyState
          title="Customer not found"
          description="This customer record does not exist or has been removed."
          action={{
            label: "Back to customers",
            onClick: () => router.push(ROUTES.app.jewellery.customers),
          }}
        />
      </Screen>
    );
  }

  const invoices = invoicesData?.results ?? [];

  return (
    <Screen
      title={customer.name}
      subtitle={customer.mobile}
      backHref={ROUTES.app.jewellery.customers}
      actions={(
        <Button
          variant="secondary"
          onClick={() => router.push(`/jewellery/customers?edit=${customer.id}`)}
        >
          Edit
        </Button>
      )}
    >
      <div className="space-y-4 max-w-lg">
        {/* Profile card */}
        <div className="app-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Profile</p>
            {customer.loyalty_points > 0 ? (
              <Badge variant="primary">{customer.loyalty_points} loyalty pts</Badge>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Name" value={customer.name} />
            <InfoRow label="Mobile" value={customer.mobile} />
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="City" value={customer.city} />
          </div>

          {customer.address ? (
            <div>
              <p className="text-xs text-muted">Address</p>
              <p className="text-sm font-medium text-text mt-0.5">{customer.address}</p>
            </div>
          ) : null}
        </div>

        {/* Tax details */}
        {(customer.gstin || customer.pan || customer.state_code) ? (
          <div className="app-panel p-4 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Tax details</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="GSTIN" value={customer.gstin} />
              <InfoRow label="PAN" value={customer.pan} />
              <InfoRow label="State code" value={customer.state_code} />
            </div>
          </div>
        ) : null}

        {/* Personal dates */}
        {(customer.dob || customer.anniversary) ? (
          <div className="app-panel p-4 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Personal dates</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Date of birth" value={customer.dob} />
              <InfoRow label="Anniversary" value={customer.anniversary} />
            </div>
          </div>
        ) : null}

        {/* Purchase history */}
        <div className="app-panel p-4 space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Purchase history</p>

          {isFetchingInvoices ? <SkeletonList count={3} /> : null}

          {!isFetchingInvoices && invoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="This customer has no purchase history."
            />
          ) : null}

          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.slice(0, 10).map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/jewellery/billing/${invoice.id}`}
                  className="block"
                >
                  <div className="rounded-xl border border-border p-3 hover:bg-surface2 transition-colors card-clickable">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text truncate">
                          {invoice.voucher_no || "Draft"}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {invoice.voucher_date ?? "—"}
                          <span className="mx-1.5">·</span>
                          {formatINRCurrency(invoice.total_amount)}
                        </p>
                      </div>
                      <Badge variant={invoiceStatusVariant(invoice.status)} className="shrink-0">
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
