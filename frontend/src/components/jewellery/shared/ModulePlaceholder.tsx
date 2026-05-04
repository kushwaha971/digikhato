import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { ROUTES } from "@/lib/routes";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  presetKey?: string;
}

type Kpi = {
  label: string;
  value: string;
  meta: string;
  valueClassName?: string;
};

type ModulePreset = {
  actionLabel: string;
  actionClassName: string;
  kpis: Kpi[];
  mainTitle: string;
  tableColumns: string[];
  tableRows: string[][];
  sideTitle: string;
  sideItems: Array<{ label: string; value: string; valueClassName?: string }>;
  showKpis?: boolean;
  showSidePanel?: boolean;
  blankState?: { title: string; description: string };
};

const DEFAULT_PRESET: ModulePreset = {
  actionLabel: "Open Workspace",
  actionClassName: "bg-primary-600 hover:bg-primary-700 text-white",
  kpis: [
    { label: "Today", value: "24", meta: "new records" },
    { label: "This Week", value: "148", meta: "processed" },
    { label: "Open Tasks", value: "12", meta: "need attention", valueClassName: "text-warning-600" },
    { label: "Resolved", value: "96%", meta: "completion", valueClassName: "text-success-600" },
  ],
  mainTitle: "Recent Activity",
  tableColumns: ["Reference", "Date", "Party", "Value", "Status"],
  tableRows: [
    ["REF-2026-0542", "2026-05-01", "Priya Shah", "₹1,47,784", "Completed"],
    ["REF-2026-0541", "2026-05-01", "Rajesh Kumar", "₹90,842", "Processing"],
    ["REF-2026-0540", "2026-04-30", "Meena Patel", "₹2,48,675", "Pending"],
  ],
  sideTitle: "Pending Checks",
  sideItems: [
    { label: "Approval Queue", value: "4 items" },
    { label: "Low Stock Alerts", value: "3 products", valueClassName: "text-warning-600" },
    { label: "Compliance Warnings", value: "1 issue", valueClassName: "text-danger-600" },
    { label: "Team Follow-ups", value: "7 tasks" },
  ],
};

const BILLING_PRESET: ModulePreset = {
  actionLabel: "New Invoice",
  actionClassName: "bg-warning-600 hover:bg-warning-700 text-white",
  kpis: [
    { label: "Today's Sales", value: "₹3,38,626", meta: "8 invoices" },
    { label: "This Month", value: "₹24.5 L", meta: "142 invoices" },
    { label: "E-Invoices", value: "89", meta: "with IRN+QR" },
    { label: "Pending", value: "₹1.2 L", meta: "5 invoices", valueClassName: "text-warning-600" },
  ],
  mainTitle: "Recent Invoices",
  tableColumns: ["Invoice No", "Date", "Customer", "Items", "Total", "Status"],
  tableRows: [
    ["INV-2026-0542", "2026-05-01", "Priya Shah", "3", "₹147,784", "Paid"],
    ["INV-2026-0541", "2026-05-01", "Rajesh Kumar", "2", "₹90,842", "Paid"],
    ["INV-2026-0540", "2026-04-30", "Meena Patel", "1", "₹248,675", "Partial"],
  ],
  sideTitle: "Sales Controls",
  sideItems: [
    { label: "Draft Estimates", value: "6" },
    { label: "Payment Follow-ups", value: "5", valueClassName: "text-warning-600" },
    { label: "IRN Failures", value: "0", valueClassName: "text-success-600" },
    { label: "Credit Notes", value: "2 issued" },
  ],
};

const INVENTORY_PRESET: ModulePreset = {
  actionLabel: "Add Item",
  actionClassName: "bg-success-600 hover:bg-success-700 text-white",
  kpis: [
    { label: "Total Items", value: "4,240", meta: "Valued at ₹2.45 Cr" },
    { label: "Gold Items", value: "2,450", meta: "Net Wt: 12.5 Kg" },
    { label: "HUID Tagged", value: "1,850", meta: "75.5% tagged", valueClassName: "text-success-600" },
    { label: "In Transit", value: "42", meta: "₹3.2 L value", valueClassName: "text-warning-600" },
  ],
  mainTitle: "Stock Movements",
  tableColumns: ["Date", "Type", "Reference", "Items", "Weight (g)", "Status"],
  tableRows: [
    ["2026-05-01", "Sale", "INV-2026-0542", "3", "45.2", "Completed"],
    ["2026-05-01", "Purchase", "PUR-2026-0089", "12", "125.5", "Completed"],
    ["2026-04-30", "Transfer", "TRN-2026-0034", "8", "62.3", "In-transit"],
  ],
  sideTitle: "Inventory Checks",
  sideItems: [
    { label: "Physical Stock-take", value: "Due in 2 days" },
    { label: "HUID Exceptions", value: "17 items", valueClassName: "text-warning-600" },
    { label: "Negative Stock", value: "0", valueClassName: "text-success-600" },
    { label: "Reorder Flags", value: "9 SKUs" },
  ],
};

const KARIGAR_PRESET: ModulePreset = {
  actionLabel: "New Order",
  actionClassName: "bg-warning-700 hover:bg-warning-800 text-white",
  kpis: [
    { label: "Booked", value: "12", meta: "customer orders" },
    { label: "WIP", value: "18", meta: "in process", valueClassName: "text-warning-700" },
    { label: "QC", value: "5", meta: "pending checks", valueClassName: "text-primary-600" },
    { label: "Delivered", value: "142", meta: "this month", valueClassName: "text-success-600" },
  ],
  mainTitle: "Metal Issue Vouchers",
  tableColumns: ["MIV No", "Date", "Karigar", "Order Ref", "Metal", "Status"],
  tableRows: [
    ["MIV-2026-0245", "2026-04-28", "Ram Lal", "ORD-2026-0145", "Gold 22K", "Issued"],
    ["MIV-2026-0244", "2026-04-27", "Shyam Das", "ORD-2026-0144", "Gold 18K", "Received"],
    ["MIV-2026-0243", "2026-04-26", "Mohan Kumar", "ORD-2026-0138", "Gold 22K", "Pending-approval"],
  ],
  sideTitle: "Wastage Summary (This Month)",
  sideItems: [
    { label: "Total Issued", value: "741.8 g" },
    { label: "Total Received", value: "698.5 g" },
    { label: "Allowed Wastage (5%)", value: "37.1 g", valueClassName: "text-success-600" },
    { label: "Actual Wastage", value: "43.3 g", valueClassName: "text-warning-700" },
  ],
};

const GST_REPORTS_PRESET: ModulePreset = {
  actionLabel: "Prepare Return",
  actionClassName: "bg-primary-600 hover:bg-primary-700 text-white",
  kpis: [
    { label: "CGST Collected (MTD)", value: "₹1,27,500", meta: "reconciled" },
    { label: "SGST Collected (MTD)", value: "₹1,27,500", meta: "reconciled" },
    { label: "E-Invoices Generated", value: "89", meta: "updated" },
  ],
  mainTitle: "GST Returns",
  tableColumns: ["Return", "Period", "Due Date", "Action", "Status"],
  tableRows: [
    ["GSTR-1", "Apr 2026", "11 May", "Prepare Return", "Due"],
    ["GSTR-3B", "Apr 2026", "20 May", "Prepare Return", "Due"],
    ["GSTR-1", "Mar 2026", "10 Apr", "Filed", "Filed"],
  ],
  sideTitle: "Business Reports",
  sideItems: [
    { label: "Sales Register", value: "Invoice-wise sales summary" },
    { label: "Purchase Register", value: "Supplier-wise purchase summary" },
    { label: "Profitability Report", value: "Item/party-wise analysis" },
    { label: "HSN Summary", value: "HSN-wise quantity & value" },
  ],
};

const GOLD_PLEDGE_PRESET: ModulePreset = {
  actionLabel: "New Pledge Loan",
  actionClassName: "bg-warning-600 hover:bg-warning-700 text-white",
  kpis: [
    { label: "Active Loans", value: "28", meta: "₹85.6 L disbursed" },
    { label: "Interest Accrued (MTD)", value: "₹1.24 L", meta: "on track", valueClassName: "text-success-600" },
    { label: "Pledge Value", value: "₹1.15 Cr", meta: "1,250 g gold" },
    { label: "Due This Week", value: "5 loans", meta: "₹12.5 L principal", valueClassName: "text-warning-600" },
  ],
  mainTitle: "Pledge Loan Portfolio",
  tableColumns: ["Loan No", "Customer", "Pledge Value", "Loan Amount", "LTV", "Status"],
  tableRows: [
    ["PL-2026-0125", "Ramesh Kumar", "₹450,000", "₹360,000", "80%", "Active"],
    ["PL-2026-0124", "Sita Devi", "₹285,000", "₹200,000", "70%", "Active"],
    ["PL-2026-0089", "Priya Sharma", "₹320,000", "₹256,000", "80%", "Closed"],
  ],
  sideTitle: "Risk Watch",
  sideItems: [
    { label: "Top-up Requests", value: "3 pending" },
    { label: "Renewal Due", value: "4 loans", valueClassName: "text-warning-600" },
    { label: "Over-LTV Cases", value: "0", valueClassName: "text-success-600" },
    { label: "Auction Pipeline", value: "1 case" },
  ],
};

const MULTI_BRANCH_PRESET: ModulePreset = {
  actionLabel: "Add Branch",
  actionClassName: "bg-success-600 hover:bg-success-700 text-white",
  kpis: [
    { label: "Total Branches", value: "3", meta: "All active", valueClassName: "text-success-600" },
    { label: "Combined Inventory", value: "5,240", meta: "items" },
    { label: "Total Value", value: "₹3.95 Cr", meta: "across branches" },
    { label: "In-Transit", value: "8 items", meta: "₹4.85 L", valueClassName: "text-warning-700" },
  ],
  mainTitle: "Branch Overview",
  tableColumns: ["Branch Name", "Location", "GSTIN", "Inventory", "Value", "Status"],
  tableRows: [
    ["Branch-1 (Head Office)", "MG Road, Mumbai", "27XXXXX1234X1Z5", "2450", "₹185.0 L", "Active"],
    ["Branch-2", "Station Road, Mumbai", "27XXXXX1234X2Z3", "1890", "₹142.0 L", "Active"],
    ["Branch-3", "Market Area, Pune", "27XXXXX1234X3Z1", "900", "₹68.0 L", "Active"],
  ],
  sideTitle: "Inter-Branch Transfers",
  sideItems: [
    { label: "TRN-2026-0034", value: "Branch-1 → Branch-2 (8 items)" },
    { label: "TRN-2026-0033", value: "Branch-2 → Branch-3 (5 items)" },
    { label: "TRN-2026-0032", value: "Branch-1 → Branch-3 (12 items)" },
    { label: "Pending Reconciliation", value: "2 branches", valueClassName: "text-warning-700" },
  ],
};

const MODULE_PRESETS: Record<string, ModulePreset> = {
  "Billing & Sales": BILLING_PRESET,
  "Tax invoice (GST)": BILLING_PRESET,
  "E-invoice (IRN+QR)": BILLING_PRESET,
  "Split payment modes": BILLING_PRESET,
  "Print templates": BILLING_PRESET,
  "WhatsApp / SMS send": BILLING_PRESET,
  "Estimate / Quotation": {
    ...BILLING_PRESET,
    actionLabel: "New Estimate",
    showKpis: false,
    showSidePanel: false,
    mainTitle: "Estimate Register",
    tableColumns: ["Estimate No", "Date", "Customer", "Items", "Amount", "Status"],
    tableRows: [
      ["EST-2026-0125", "2026-05-01", "Sneha Reddy", "2", "₹125,000", "Sent"],
      ["EST-2026-0124", "2026-04-30", "Vikram Joshi", "1", "₹85,000", "Converted"],
      ["EST-2026-0123", "2026-04-29", "Anjali Gupta", "3", "₹195,000", "Expired"],
    ],
  },
  "Sale return / credit note": {
    ...BILLING_PRESET,
    actionLabel: "New Credit Note",
    showKpis: false,
    showSidePanel: false,
    mainTitle: "Return & Credit Notes",
    tableColumns: ["Credit Note", "Date", "Invoice Ref", "Customer", "Amount", "Status"],
    tableRows: [
      ["CN-2026-0042", "2026-05-01", "INV-2026-0542", "Priya Shah", "₹12,450", "Issued"],
      ["CN-2026-0041", "2026-04-30", "INV-2026-0528", "Sita Devi", "₹7,800", "Adjusted"],
      ["CN-2026-0040", "2026-04-29", "INV-2026-0520", "Vijay Singh", "₹5,220", "Pending"],
    ],
  },
  "Old Gold Exchange": {
    ...BILLING_PRESET,
    actionLabel: "New Exchange Entry",
    showKpis: false,
    showSidePanel: false,
    blankState: {
      title: "Old gold exchange workspace",
      description: "Valuation and exchange settlement interface will appear here as this flow is configured.",
    },
  },
  Inventory: INVENTORY_PRESET,
  "Item master": INVENTORY_PRESET,
  "Purity tracking": INVENTORY_PRESET,
  "HUID / BIS hallmark": INVENTORY_PRESET,
  "Physical stock-take": INVENTORY_PRESET,
  "Item Chain of Custody": {
    ...INVENTORY_PRESET,
    mainTitle: "Chain of Custody Movements",
  },
  Karigar: KARIGAR_PRESET,
  "Customer order": {
    ...KARIGAR_PRESET,
    actionLabel: "New Order",
    mainTitle: "Customer Orders",
  },
  "Metal Issue Voucher": KARIGAR_PRESET,
  "Karigar receipt": {
    ...KARIGAR_PRESET,
    actionLabel: "New Receipt",
    mainTitle: "Karigar Receipts",
  },
  "Tunch reconciliation": {
    ...KARIGAR_PRESET,
    actionLabel: "Run Reconciliation",
    mainTitle: "Tunch Reconciliation Log",
  },
  "Wastage reconciliation": {
    ...KARIGAR_PRESET,
    actionLabel: "Reconcile Wastage",
    mainTitle: "Wastage Reconciliation",
  },
  "Labour bill": {
    ...KARIGAR_PRESET,
    actionLabel: "New Labour Bill",
    mainTitle: "Labour Bills",
  },
  "Repair / alteration": {
    ...KARIGAR_PRESET,
    actionLabel: "New Repair Job",
    mainTitle: "Repair & Alteration Jobs",
  },
  "GST & Reports": GST_REPORTS_PRESET,
  "Gold Pledge Loans": GOLD_PLEDGE_PRESET,
  "KYC capture": GOLD_PLEDGE_PRESET,
  "Pledge entry": GOLD_PLEDGE_PRESET,
  "Loan disbursal": GOLD_PLEDGE_PRESET,
  "Interest schemes": GOLD_PLEDGE_PRESET,
  "Top-up / Renewal": GOLD_PLEDGE_PRESET,
  Foreclosure: GOLD_PLEDGE_PRESET,
  "Auction & P&L": GOLD_PLEDGE_PRESET,
  "Multi-Branch": MULTI_BRANCH_PRESET,
};

function statusClass(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("active") || normalized.includes("paid") || normalized.includes("filed") || normalized.includes("received") || normalized.includes("sent") || normalized.includes("converted") || normalized.includes("adjusted") || normalized.includes("issued")) {
    return "text-success-700 bg-success-50";
  }
  if (normalized.includes("due") || normalized.includes("pending") || normalized.includes("partial") || normalized.includes("in-transit") || normalized.includes("expired")) {
    return "text-warning-700 bg-warning-50";
  }
  if (normalized.includes("closed")) {
    return "text-muted bg-surface2";
  }
  return "text-text bg-surface2";
}

export function ModulePlaceholder({ title, description, presetKey }: Readonly<ModulePlaceholderProps>) {
  const resolvedKey = presetKey ?? title;
  const preset = MODULE_PRESETS[resolvedKey] ?? MODULE_PRESETS[title] ?? DEFAULT_PRESET;
  const showKpis = preset.showKpis ?? true;
  const showSidePanel = preset.showSidePanel ?? true;

  return (
    <Screen
      title={title}
      subtitle={description}
      backHref={ROUTES.app.jewellery.dashboard}
      actions={
        <button
          type="button"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${preset.actionClassName}`}
        >
          <span className="text-base leading-none">+</span>
          {preset.actionLabel}
        </button>
      }
    >
      <div className="space-y-5">
        {showKpis ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {preset.kpis.map((kpi) => (
              <article key={kpi.label} className="app-panel rounded-2xl p-4">
                <p className="text-sm text-muted">{kpi.label}</p>
                <p className={`mt-2 text-4xl font-bold text-text ${kpi.valueClassName ?? ""}`}>{kpi.value}</p>
                <p className="mt-1 text-sm text-muted">{kpi.meta}</p>
              </article>
            ))}
          </section>
        ) : null}

        <section className={showSidePanel ? "grid grid-cols-1 xl:grid-cols-3 gap-4" : "space-y-4"}>
          <article className={`app-panel rounded-2xl overflow-hidden ${showSidePanel ? "xl:col-span-2" : ""}`}>
            {preset.blankState ? (
              <div className="px-6 py-10">
                <h2 className="text-2xl font-semibold text-text">{preset.blankState.title}</h2>
                <p className="mt-2 text-muted">{preset.blankState.description}</p>
              </div>
            ) : (
              <>
                <header className="px-4 py-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-text">{preset.mainTitle}</h2>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface2">
                      <tr>
                        {preset.tableColumns.map((column) => (
                          <th key={column} className="px-4 py-3 font-semibold text-muted whitespace-nowrap">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preset.tableRows.map((row, idx) => {
                        const status = row[row.length - 1];
                        return (
                          <tr key={`${row[0]}-${idx}`} className="border-t border-border">
                            {row.map((cell, cellIdx) => (
                              <td key={`${cell}-${cellIdx}`} className="px-4 py-3 text-text whitespace-nowrap">
                                {cellIdx === row.length - 1 ? (
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(status)}`}>
                                    {cell}
                                  </span>
                                ) : (
                                  cell
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </article>

          {showSidePanel ? (
            <article className="app-panel rounded-2xl p-4">
              <h2 className="text-xl font-semibold text-text">{preset.sideTitle}</h2>
              <ul className="mt-4 space-y-3">
                {preset.sideItems.map((item) => (
                  <li key={item.label} className="rounded-xl border border-border bg-surface2/45 px-3 py-2.5">
                    <p className="text-sm text-muted">{item.label}</p>
                    <p className={`mt-1 text-sm font-semibold text-text ${item.valueClassName ?? ""}`}>{item.value}</p>
                  </li>
                ))}
              </ul>
              <Link
                href={ROUTES.app.jewellery.dashboard}
                className="inline-flex mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Back to Jewellery dashboard
              </Link>
            </article>
          ) : null}
        </section>
      </div>
    </Screen>
  );
}
