"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useListInvoicesQuery } from "@/store/jewellery-api";
import { formatINRCurrency } from "@/utils/jewellery/formulas";

export interface PrintTemplatesViewProps {
  onPrintInvoice?: (invoiceId: string) => void;
}

type TemplateId = "a4-standard" | "a4-compact" | "thermal-80mm";

interface PrintSettings {
  includeGstBreakdown: boolean;
  printQrCode: boolean;
  printLogo: boolean;
}

const SETTINGS_KEY = "jwl_print_settings";

const DEFAULT_SETTINGS: PrintSettings = {
  includeGstBreakdown: true,
  printQrCode: true,
  printLogo: true,
};

function loadSettings(): PrintSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PrintSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function TemplateWireframe({ type }: { type: TemplateId }) {
  if (type === "thermal-80mm") {
    return (
      <div className="w-16 mx-auto border border-border rounded bg-surface2 p-1.5 space-y-1 text-[6px] leading-tight text-muted font-mono">
        <div className="bg-neutral-200 dark:bg-neutral-700 h-2 rounded" />
        <div className="bg-neutral-200 dark:bg-neutral-700 h-1 w-3/4 rounded" />
        <div className="border-t border-dashed border-border my-0.5" />
        <div className="space-y-0.5">
          <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-full rounded" />
          <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-full rounded" />
          <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-3/4 rounded" />
        </div>
        <div className="border-t border-dashed border-border my-0.5" />
        <div className="w-8 h-8 mx-auto border border-border rounded" />
        <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-full rounded" />
      </div>
    );
  }

  if (type === "a4-compact") {
    return (
      <div className="w-20 mx-auto border border-border rounded bg-surface2 p-1.5 space-y-1 text-[6px] leading-tight text-muted">
        <div className="flex justify-between items-start">
          <div className="bg-neutral-200 dark:bg-neutral-700 h-2.5 w-6 rounded" />
          <div className="space-y-0.5">
            <div className="bg-neutral-200 dark:bg-neutral-700 h-1 w-10 rounded" />
            <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-8 rounded" />
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="space-y-0.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-1">
              <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 flex-1 rounded" />
              <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-4 rounded" />
              <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-5 rounded" />
            </div>
          ))}
        </div>
        <div className="border-t border-border" />
        <div className="flex justify-end">
          <div className="space-y-0.5 w-1/2">
            <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-full rounded" />
            <div className="bg-neutral-200 dark:bg-neutral-700 h-1 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  // a4-standard
  return (
    <div className="w-20 mx-auto border border-border rounded bg-surface2 p-1.5 space-y-1 text-[6px] leading-tight text-muted">
      <div className="flex justify-between items-start">
        <div className="bg-neutral-200 dark:bg-neutral-700 h-3 w-8 rounded" />
        <div className="space-y-0.5">
          <div className="bg-neutral-200 dark:bg-neutral-700 h-1.5 w-12 rounded" />
          <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-10 rounded" />
          <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-8 rounded" />
        </div>
      </div>
      <div className="border-t border-border" />
      <div className="grid grid-cols-4 gap-0.5">
        {["Desc", "Wt", "Rate", "Amt"].map((h) => (
          <div key={h} className="bg-neutral-200 dark:bg-neutral-700 h-1 rounded" />
        ))}
        {[1, 2, 3].flatMap((i) =>
          [1, 2, 3, 4].map((j) => (
            <div key={`${i}-${j}`} className="bg-neutral-100 dark:bg-neutral-800 h-0.5 rounded" />
          )),
        )}
      </div>
      <div className="border-t border-border" />
      <div className="flex justify-end">
        <div className="space-y-0.5 w-1/2">
          <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-full rounded" />
          <div className="bg-neutral-100 dark:bg-neutral-800 h-0.5 w-full rounded" />
          <div className="bg-neutral-200 dark:bg-neutral-700 h-1 w-full rounded" />
        </div>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {description ? <p className="text-xs text-muted mt-0.5">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export function PrintTemplatesView({ onPrintInvoice }: PrintTemplatesViewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("a4-standard");
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Persist settings to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Silently ignore storage errors
    }
  }, [settings]);

  const { data, isFetching } = useListInvoicesQuery({ page: 1, status: "ISSUED" });
  const recentInvoices = (data?.results ?? []).slice(0, 5);

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const templates: Array<{
    id: TemplateId;
    title: string;
    description: string;
    note?: string;
  }> = [
    {
      id: "a4-standard",
      title: "A4 Standard",
      description: "Full-width A4 layout with logo, GST split, and item table.",
    },
    {
      id: "a4-compact",
      title: "A4 Compact",
      description: "Condensed layout for shorter invoices, reduces paper usage.",
    },
    {
      id: "thermal-80mm",
      title: "Thermal (80mm)",
      description: "POS thermal printer format with QR code at the bottom.",
      note: "For POS printers",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div>
        <h2 className="text-base font-semibold text-text mb-3">Choose a template</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template.id)}
                className={[
                  "app-panel rounded-2xl p-4 text-left transition-all space-y-3",
                  isSelected
                    ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "card-clickable",
                ].join(" ")}
              >
                {/* Wireframe preview */}
                <div className="py-2">
                  <TemplateWireframe type={template.id} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text text-sm">{template.title}</p>
                    {isSelected ? (
                      <Badge variant="success">Selected</Badge>
                    ) : null}
                    {template.id === "a4-standard" && !isSelected ? (
                      <Badge variant="neutral">Default</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">{template.description}</p>
                  {template.note ? (
                    <p className="text-[11px] text-primary-600 dark:text-primary-400 font-medium">
                      {template.note}
                    </p>
                  ) : null}
                </div>

                {!isSelected ? (
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                    Select template
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Print settings */}
      <div className="app-panel rounded-2xl p-4">
        <h2 className="text-base font-semibold text-text mb-1">Print settings</h2>
        <p className="text-xs text-muted mb-3">Preferences are saved locally on this device.</p>
        <div>
          <ToggleRow
            label="Include GST breakdown on print"
            description="Shows CGST, SGST, and IGST as separate line items."
            checked={settings.includeGstBreakdown}
            onChange={(value) => updateSetting("includeGstBreakdown", value)}
          />
          <ToggleRow
            label="Print QR code for payment"
            description="Adds a scannable UPI / payment QR at the bottom of the invoice."
            checked={settings.printQrCode}
            onChange={(value) => updateSetting("printQrCode", value)}
          />
          <ToggleRow
            label="Print jeweller's watermark / logo"
            description="Includes your shop logo and branding on the printed invoice."
            checked={settings.printLogo}
            onChange={(value) => updateSetting("printLogo", value)}
          />
        </div>
      </div>

      {/* Recent invoices for quick print */}
      <div>
        <h2 className="text-base font-semibold text-text mb-3">Recent issued invoices</h2>

        {isFetching ? <SkeletonList count={3} /> : null}

        {!isFetching && recentInvoices.length === 0 ? (
          <div className="app-panel rounded-2xl p-6 text-center text-sm text-muted">
            No issued invoices found.
          </div>
        ) : null}

        {recentInvoices.length > 0 ? (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="app-panel rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text truncate">
                    {invoice.voucher_no || "Issued invoice"}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {invoice.customer_name || "Walk-in"}
                    <span className="mx-1.5">·</span>
                    {formatINRCurrency(invoice.total_amount)}
                    {invoice.voucher_date ? (
                      <>
                        <span className="mx-1.5">·</span>
                        {invoice.voucher_date}
                      </>
                    ) : null}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="min-h-11 shrink-0"
                  variant="secondary"
                  onClick={() => {
                    if (onPrintInvoice) {
                      onPrintInvoice(invoice.id);
                    } else {
                      window.print();
                    }
                  }}
                >
                  Print
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
