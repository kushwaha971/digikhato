"use client";

import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { ROUTES } from "@/lib/routes";
import { useGetJewelleryBootstrapQuery } from "@/store/jewellery-api";

export default function JewelleryDashboardPage() {
  const { data, isLoading, isError } = useGetJewelleryBootstrapQuery();

  return (
    <Screen title="Dashboard" subtitle="Welcome to DigiKhaato Jewellery ERP - overview of your business operations">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <KpiCard label="Today's Sales" value={isLoading ? "..." : `₹${data?.kpis.today_sales ?? "0.00"}`} meta="+12.5% vs yesterday" />
        <KpiCard label="Total Inventory" value={isLoading ? "..." : `${data?.kpis.active_items ?? 0} items`} meta="₹2.45 Cr valuation" />
        <KpiCard label="Open Transfers" value={isLoading ? "..." : String(data?.kpis.open_transfers ?? 0)} meta="Across all branches" />
        <KpiCard label="Pending Orders" value={isLoading ? "..." : String(data?.kpis.pending_orders ?? 0)} meta="12 jobs with karigars" />
      </div>

      {isError && (
        <div className="app-panel p-4 rounded-xl mb-4 border border-warning-300 text-sm text-warning-800">
          Backend bootstrap data is not available yet. You can continue using module screens.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <section className="app-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text">Sales Overview</h2>
          <div className="mt-4 grid grid-cols-5 gap-2 items-end h-48">
            {["Jan", "Feb", "Mar", "Apr", "May"].map((month, idx) => {
              const heights = ["52%", "64%", "85%", "72%", "96%"];
              return (
                <div key={month} className="flex flex-col items-center gap-2">
                  <div className="w-full rounded-lg bg-gradient-to-t from-warning-600 to-warning-500" style={{ height: heights[idx] }} />
                  <span className="text-xs text-muted">{month}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="app-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text">Inventory Distribution</h2>
          <ul className="mt-4 space-y-3">
            <DistributionRow label="Gold Jewellery" value="65%" tone="bg-warning-500" />
            <DistributionRow label="Diamond" value="20%" tone="bg-primary-500" />
            <DistributionRow label="Silver" value="10%" tone="bg-neutral-400" />
            <DistributionRow label="Kundan" value="5%" tone="bg-success-500" />
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <section className="app-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text">Recent Activity</h2>
          <ul className="mt-4 space-y-3">
            {[
              "Invoice #INV-2026-0542 generated for ₹45,600",
              "New order received from Priya Shah",
              "Stock received: 45 items from Karigar Ram Lal",
              "Payment received: ₹1,25,000 via UPI",
            ].map((item) => (
              <li key={item} className="rounded-xl border border-border bg-surface2/55 px-3 py-2.5 text-sm text-text">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="app-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text">Pending Tasks</h2>
          <ul className="mt-4 space-y-3">
            <TaskRow label="Approve metal issue voucher MIV-245" level="high" />
            <TaskRow label="Complete stock-take for Branch-2" level="medium" />
            <TaskRow label="Process 5 pending sale returns" level="high" />
            <TaskRow label="Generate GSTR-1 for April 2026" level="medium" />
          </ul>
        </section>
      </div>

      <section className="app-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Quick Module Access</p>
            <h2 className="text-lg font-semibold text-text mt-1">Continue your workflow</h2>
          </div>
          <Link
            href={ROUTES.app.modules}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
          >
            Open Modules
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

function DistributionRow({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: string; tone: string }>) {
  return (
    <li>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-text">{value}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: value }} />
      </div>
    </li>
  );
}

function TaskRow({ label, level }: Readonly<{ label: string; level: "high" | "medium" }>) {
  const tone = level === "high" ? "text-danger-700 bg-danger-50" : "text-warning-700 bg-warning-50";
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface2/55 px-3 py-2.5">
      <p className="text-sm text-text">{label}</p>
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>{level}</span>
    </li>
  );
}
