import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/layout/Screen";
import { ROUTES } from "@/lib/routes";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  presetKey?: string;
}

type SideItem = { label: string; description: string };

type ModulePreset = {
  actionLabel: string;
  actionHref?: string;
  actionClassName: string;
  tableColumns: string[];
  sideTitle: string;
  sideItems: SideItem[];
  emptyMessage: string;
};

// ─── Presets define structure only — no fake data rows ─────────────────────

const BILLING_PRESET: ModulePreset = {
  actionLabel: "New Invoice",
  actionHref: "/jewellery/billing/new",
  actionClassName: "bg-warning-600 hover:bg-warning-700 text-white",
  tableColumns: ["Invoice No", "Date", "Customer", "Items", "Total", "Status"],
  emptyMessage: "No invoices yet. Create your first sales invoice to get started.",
  sideTitle: "Quick Actions",
  sideItems: [
    { label: "Estimate / Quotation", description: "Send a price estimate before billing" },
    { label: "Old Gold Exchange", description: "Record an old gold exchange deduction" },
    { label: "Sale Return", description: "Create a credit note for a return" },
    { label: "Payment Follow-up", description: "Track outstanding balances" },
  ],
};

const INVENTORY_PRESET: ModulePreset = {
  actionLabel: "Add Item",
  actionHref: "/jewellery/inventory/new",
  actionClassName: "bg-success-600 hover:bg-success-700 text-white",
  tableColumns: ["SKU", "Design", "Metal / Purity", "Net Wt (g)", "Status", "Branch"],
  emptyMessage: "No inventory items yet. Add your first jewellery item to begin tracking stock.",
  sideTitle: "Inventory Checks",
  sideItems: [
    { label: "Physical Stock-take", description: "Count and reconcile branch stock" },
    { label: "Inter-Branch Transfers", description: "Move items between branches" },
    { label: "HUID Exceptions", description: "Items without BIS hallmark tagging" },
    { label: "Write-off Register", description: "Damaged or lost item records" },
  ],
};

const KARIGAR_PRESET: ModulePreset = {
  actionLabel: "New Order",
  actionClassName: "bg-warning-700 hover:bg-warning-800 text-white",
  tableColumns: ["Order No", "Date", "Customer", "Design", "Metal", "Status"],
  emptyMessage: "No orders or karigar jobs yet. Create a customer order to start the workflow.",
  sideTitle: "Metal Ledger",
  sideItems: [
    { label: "Metal Issue Voucher", description: "Issued to karigars for job work" },
    { label: "Karigar Receipt", description: "Received items back from karigars" },
    { label: "Tunch Reconciliation", description: "Purity-adjusted metal balance" },
    { label: "Labour Bills", description: "Making charge settlement" },
  ],
};

const GST_REPORTS_PRESET: ModulePreset = {
  actionLabel: "Prepare Return",
  actionClassName: "bg-primary-600 hover:bg-primary-700 text-white",
  tableColumns: ["Return Type", "Period", "Due Date", "Status"],
  emptyMessage: "No GST returns configured. Returns will appear here once billing is active.",
  sideTitle: "Business Reports",
  sideItems: [
    { label: "Sales Register", description: "Invoice-wise sales summary" },
    { label: "Purchase Register", description: "Supplier-wise purchase summary" },
    { label: "HSN Summary", description: "HSN-wise quantity & value for filing" },
    { label: "Profitability Report", description: "Item and party-wise margin analysis" },
  ],
};

const GOLD_PLEDGE_PRESET: ModulePreset = {
  actionLabel: "New Pledge Loan",
  actionClassName: "bg-warning-600 hover:bg-warning-700 text-white",
  tableColumns: ["Loan No", "Customer", "Pledge Value", "Principal", "LTV", "Status"],
  emptyMessage: "No pledge loans yet. Create your first gold pledge loan to get started.",
  sideTitle: "Portfolio Watch",
  sideItems: [
    { label: "KYC Capture", description: "Customer photo, ID & signature" },
    { label: "Pledge Entry", description: "Record ornament details & valuation" },
    { label: "Renewal / Top-up", description: "Renew or top-up an existing loan" },
    { label: "Foreclosure", description: "Full settlement and item release" },
  ],
};

const MULTI_BRANCH_PRESET: ModulePreset = {
  actionLabel: "Add Branch",
  actionClassName: "bg-success-600 hover:bg-success-700 text-white",
  tableColumns: ["Branch Name", "Location", "GSTIN", "Inventory", "Status"],
  emptyMessage: "No additional branches configured. Add a branch to enable multi-branch operations.",
  sideTitle: "Branch Operations",
  sideItems: [
    { label: "Inter-Branch Transfers", description: "Move stock between branches" },
    { label: "Branch Reconciliation", description: "Reconcile transferred items" },
    { label: "Branch Reports", description: "Per-branch sales and stock summary" },
    { label: "Branch Users", description: "Assign team members to branches" },
  ],
};

const DEFAULT_PRESET: ModulePreset = {
  actionLabel: "Get Started",
  actionClassName: "bg-primary-600 hover:bg-primary-700 text-white",
  tableColumns: ["Reference", "Date", "Description", "Status"],
  emptyMessage: "This module workspace will populate as you start using it.",
  sideTitle: "Module Features",
  sideItems: [
    { label: "Records", description: "View and manage all entries" },
    { label: "Reports", description: "Analyze trends and performance" },
    { label: "Settings", description: "Configure module preferences" },
    { label: "Audit", description: "Review activity log" },
  ],
};

const MODULE_PRESETS: Record<string, ModulePreset> = {
  "Billing & Sales": BILLING_PRESET,
  "Tax invoice (GST)": BILLING_PRESET,
  "E-invoice (IRN+QR)": { ...BILLING_PRESET, actionLabel: "Available soon", actionHref: undefined },
  "Split payment modes": { ...BILLING_PRESET, actionLabel: "Available soon", actionHref: undefined },
  "Print templates": { ...BILLING_PRESET, actionLabel: "Available soon", actionHref: undefined },
  "WhatsApp / SMS send": { ...BILLING_PRESET, actionLabel: "Available soon", actionHref: undefined },
  "Estimate / Quotation": { ...BILLING_PRESET, actionLabel: "New Estimate", tableColumns: ["Estimate No", "Date", "Customer", "Items", "Amount", "Status"], emptyMessage: "No estimates yet. Create an estimate to share with a customer." },
  "Sale return / credit note": { ...BILLING_PRESET, actionLabel: "Available soon", actionHref: undefined, tableColumns: ["Credit Note", "Date", "Invoice Ref", "Customer", "Amount", "Status"], emptyMessage: "No credit notes yet." },
  "Old Gold Exchange": { ...BILLING_PRESET, actionLabel: "New Exchange Entry", tableColumns: ["Voucher No", "Date", "Customer", "Metal", "Weight", "Value"], emptyMessage: "No old gold exchange entries yet." },
  Inventory: INVENTORY_PRESET,
  "Item master": INVENTORY_PRESET,
  "Purity tracking": INVENTORY_PRESET,
  "HUID / BIS hallmark": INVENTORY_PRESET,
  "Physical stock-take": { ...INVENTORY_PRESET, actionLabel: "Start Stock-take", tableColumns: ["Session", "Branch", "Started", "Items", "Status"], emptyMessage: "No stock-take sessions yet. Start a physical stock count to reconcile your inventory." },
  "Item Chain of Custody": { ...INVENTORY_PRESET, actionLabel: "View Movements", tableColumns: ["Date", "Movement", "Reference", "Weight (g)", "From → To"], emptyMessage: "No movement records yet. Movements are created automatically as items are sold, transferred, or issued." },
  Karigar: KARIGAR_PRESET,
  "Customer order": { ...KARIGAR_PRESET, actionLabel: "New Order", tableColumns: ["Order No", "Date", "Customer", "Design", "Expected", "Status"], emptyMessage: "No customer orders yet." },
  "Metal Issue Voucher": { ...KARIGAR_PRESET, actionLabel: "New Issue Voucher", tableColumns: ["MIV No", "Date", "Karigar", "Order Ref", "Metal", "Status"], emptyMessage: "No metal issue vouchers yet." },
  "Karigar receipt": { ...KARIGAR_PRESET, actionLabel: "New Receipt", tableColumns: ["Receipt No", "Date", "Karigar", "Issue Ref", "Net Wt", "Status"], emptyMessage: "No karigar receipts yet." },
  "Tunch reconciliation": { ...KARIGAR_PRESET, actionLabel: "Run Reconciliation", tableColumns: ["Karigar", "Issued (g)", "Received (g)", "Wastage %", "Variance", "Status"], emptyMessage: "No tunch reconciliation records yet." },
  "Wastage reconciliation": { ...KARIGAR_PRESET, actionLabel: "Reconcile Wastage", tableColumns: ["Period", "Karigar", "Allowed Wastage", "Actual Wastage", "Variance"], emptyMessage: "No wastage reconciliation records yet." },
  "Labour bill": { ...KARIGAR_PRESET, actionLabel: "New Labour Bill", tableColumns: ["Bill No", "Date", "Karigar", "Items", "Amount", "Status"], emptyMessage: "No labour bills yet." },
  "Repair / alteration": { ...KARIGAR_PRESET, actionLabel: "New Repair Job", tableColumns: ["Job No", "Date", "Customer", "Type", "Expected", "Status"], emptyMessage: "No repair jobs yet." },
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

export function ModulePlaceholder({ title, description, presetKey }: Readonly<ModulePlaceholderProps>) {
  const resolvedKey = presetKey ?? title;
  const preset = MODULE_PRESETS[resolvedKey] ?? MODULE_PRESETS[title] ?? DEFAULT_PRESET;

  return (
    <Screen
      title={title}
      subtitle={description}
      backHref={ROUTES.app.jewellery.dashboard}
      actions={
        preset.actionHref ? (
          <Link
            href={preset.actionHref}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${preset.actionClassName}`}
          >
            <span className="text-base leading-none">+</span>
            {preset.actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${preset.actionClassName}`}
          >
            <span className="text-base leading-none">+</span>
            {preset.actionLabel}
          </button>
        )
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main content panel */}
        <article className="xl:col-span-2 app-panel rounded-2xl overflow-hidden">
          <header className="px-4 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">Records</h2>
          </header>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface2">
                <tr>
                  {preset.tableColumns.map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold text-muted whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={preset.tableColumns.length} className="px-4 py-12 text-center text-muted text-sm">
                    {preset.emptyMessage}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="md:hidden p-4 space-y-2">
            {preset.tableColumns.slice(0, 4).map((col) => (
              <div key={col} className="rounded-xl border border-border bg-surface2/45 px-3 py-2">
                <p className="text-xs text-muted uppercase tracking-wide">{col}</p>
                <p className="text-sm text-text mt-1">No data yet</p>
              </div>
            ))}
            <p className="text-center text-xs text-muted pt-1">{preset.emptyMessage}</p>
          </div>
        </article>

        {/* Side panel */}
        <article className="app-panel rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-text">{preset.sideTitle}</h2>
          <ul className="mt-4 space-y-3">
            {preset.sideItems.map((item) => (
              <li key={item.label} className="rounded-xl border border-border bg-surface2/45 px-3 py-2.5">
                <p className="text-sm font-semibold text-text">{item.label}</p>
                <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
          <Link
            href={ROUTES.app.jewellery.dashboard}
            className="inline-flex mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Back to Dashboard
          </Link>
        </article>
      </div>
    </Screen>
  );
}
