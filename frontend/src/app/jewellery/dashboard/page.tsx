"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";

import { Screen } from "@/components/layout/Screen";
import { ROUTES } from "@/lib/routes";
import { useGetJewelleryBootstrapQuery } from "@/store/jewellery-api";

export default function JewelleryDashboardPage() {
  const { data, isLoading, isError } = useGetJewelleryBootstrapQuery();

  return (
    <Screen title="Dashboard" subtitle="Overview of your jewellery business operations">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <KpiCard
          label="Today's Sales"
          value={isLoading ? "..." : `₹${data?.kpis.today_sales ?? "0.00"}`}
          meta="Sales invoices issued today"
        />
        <KpiCard
          label="Total Inventory"
          value={isLoading ? "..." : `${data?.kpis.active_items ?? 0} items`}
          meta="Items currently in stock"
        />
        <KpiCard
          label="Open Transfers"
          value={isLoading ? "..." : String(data?.kpis.open_transfers ?? 0)}
          meta="Inter-branch transfers in progress"
        />
        <KpiCard
          label="Pending Orders"
          value={isLoading ? "..." : String(data?.kpis.pending_orders ?? 0)}
          meta="Customer orders awaiting delivery"
        />
      </div>

      {isError && (
        <div className="app-panel p-4 rounded-xl mb-4 border border-warning-300 text-sm text-warning-800">
          Backend module data is not available. Please check your connection or try again.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <section className="app-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text">Recent Activity</h2>
          <p className="mt-4 text-sm text-muted py-8 text-center">
            Activity feed will populate as you create invoices, issue stock, and record transactions.
          </p>
        </section>

        <section className="app-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text">Stock Summary</h2>
          <p className="mt-4 text-sm text-muted py-8 text-center">
            Inventory distribution will appear here once items are added to stock.
          </p>
        </section>
      </div>

      <section className="app-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Quick Module Access</p>
            <h2 className="text-lg font-semibold text-text mt-1">Continue your workflow</h2>
          </div>
          <Link href={ROUTES.app.modules}>
            <Button size="sm">Open Modules</Button>
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/jewellery/billing" title="Billing & Sales" subtitle="Sales invoices and estimates" />
          <QuickLink href="/jewellery/inventory" title="Stock & Inventory" subtitle="Items, stock takes, transfers" />
          <QuickLink href="/jewellery/master" title="Jewellery Master" subtitle="Categories, designs, taxes" />
          <QuickLink href="/jewellery/karigar" title="Order & Karigar" subtitle="Issue/receive and wastage reconciliation" />
          <QuickLink href="/jewellery/gst-reports" title="GST & Reports" subtitle="Compliance and business reports" />
          <QuickLink href="/jewellery/gold-pledge" title="Gold Pledge Loans" subtitle="Secured lending lifecycle" />
        </div>
      </section>
    </Screen>
  );
}

function KpiCard({ label, value, meta }: Readonly<{ label: string; value: string; meta: string }>) {
  return (
    <div className="app-panel rounded-2xl p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-bold text-text mt-2">{value}</p>
      <p className="text-sm text-muted mt-1">{meta}</p>
    </div>
  );
}

function QuickLink({ href, title, subtitle }: Readonly<{ href: string; title: string; subtitle: string }>) {
  return (
    <Link href={href} className="app-panel p-4 rounded-2xl card-clickable">
      <p className="text-sm font-semibold text-text">{title}</p>
      <p className="text-sm text-muted mt-1">{subtitle}</p>
    </Link>
  );
}
