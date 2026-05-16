"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills } from "@/components/ui/FilterPills";
import { SkeletonList } from "@/components/ui/Skeleton";
import { GST_SECTION_OPTIONS, type GstSectionFilter } from "@/constants/jewellery";
import { formatINRCurrency } from "@/utils/jewellery/formulas";
import {
  useGetGstr1ReportQuery,
  useGetGstr3bReportQuery,
  type JwlGstReportRow,
} from "@/store/jewellery-api";

function asNumber(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function periodToYYYYMM(monthInput: string): string {
  // input type="month" gives "YYYY-MM"; API expects "YYYYMM"
  return monthInput.replace("-", "");
}

type ReportTab = "GSTR1" | "GSTR3B";

const REPORT_TAB_OPTIONS = [
  { label: "GSTR-1", value: "GSTR1" },
  { label: "GSTR-3B", value: "GSTR3B" },
] as const;

const GstPreviewTable = memo(function GstPreviewTable({ rows }: { rows: JwlGstReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-2 py-2">Voucher</th>
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">GSTIN</th>
            <th className="px-2 py-2">Taxable</th>
            <th className="px-2 py-2">CGST</th>
            <th className="px-2 py-2">SGST</th>
            <th className="px-2 py-2">IGST</th>
            <th className="px-2 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.voucher_no}-${idx}`} className="border-b border-border/70 last:border-0">
              <td className="px-2 py-2 font-medium text-text">{row.voucher_no || "—"}</td>
              <td className="px-2 py-2">{row.voucher_date || "—"}</td>
              <td className="px-2 py-2">{row.invoice_type}</td>
              <td className="px-2 py-2">{row.customer_gstin || "—"}</td>
              <td className="px-2 py-2">{formatINRCurrency(row.taxable_amount)}</td>
              <td className="px-2 py-2">{formatINRCurrency(row.cgst)}</td>
              <td className="px-2 py-2">{formatINRCurrency(row.sgst)}</td>
              <td className="px-2 py-2">{formatINRCurrency(row.igst)}</td>
              <td className="px-2 py-2">{formatINRCurrency(row.total_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default function JewelleryGstReportsPage() {
  const [period, setPeriod] = useState("");
  const [sectionFilter, setSectionFilter] = useState<GstSectionFilter>("ALL");
  const [activeTab, setActiveTab] = useState<ReportTab>("GSTR1");

  const apiPeriod = useMemo(() => (period ? periodToYYYYMM(period) : ""), [period]);

  const {
    data: gstr1,
    isLoading: gstr1Loading,
    isFetching: gstr1Fetching,
    error: gstr1Error,
    refetch: refetchGstr1,
  } = useGetGstr1ReportQuery({ period: apiPeriod }, { skip: !apiPeriod });

  const {
    data: gstr3b,
    isLoading: gstr3bLoading,
    error: gstr3bError,
    refetch: refetchGstr3b,
  } = useGetGstr3bReportQuery({ period: apiPeriod }, { skip: !apiPeriod });

  const previewRows = useMemo(() => {
    if (!gstr1) return [];
    if (sectionFilter === "B2B") return gstr1.b2b;
    if (sectionFilter === "B2C") return gstr1.b2c;
    if (sectionFilter === "CDNR") return gstr1.cdnr;
    return [...gstr1.b2b, ...gstr1.b2c, ...gstr1.cdnr];
  }, [gstr1, sectionFilter]);

  const exportCsv = useCallback(() => {
    if (!previewRows.length) return;

    const header = ["Section", "Voucher No", "Voucher Date", "Invoice Type", "GSTIN", "Taxable Amount", "CGST", "SGST", "IGST", "Total Amount"];

    const sectionOf = (row: JwlGstReportRow): string => {
      if (!gstr1) return "";
      if (gstr1.cdnr.includes(row)) return "CDNR";
      if (gstr1.b2b.includes(row)) return "B2B";
      return "B2C";
    };

    const csvRows = previewRows.map((row) => [
      sectionOf(row),
      row.voucher_no || "",
      row.voucher_date || "",
      row.invoice_type,
      row.customer_gstin || "",
      row.taxable_amount || "0",
      row.cgst || "0",
      row.sgst || "0",
      row.igst || "0",
      row.total_amount || "0",
    ]);

    const csv = [header, ...csvRows]
      .map((line) => line.map((cell) => csvEscape(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jwl-gstr-1-${apiPeriod}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [previewRows, gstr1, apiPeriod]);

  const isLoading = activeTab === "GSTR1" ? gstr1Loading || gstr1Fetching : gstr3bLoading;
  const hasError = activeTab === "GSTR1" ? Boolean(gstr1Error) : Boolean(gstr3bError);
  const refetch = activeTab === "GSTR1" ? refetchGstr1 : refetchGstr3b;

  return (
    <Screen
      title="GST & Reports"
      subtitle="GSTR-1 section-wise preview and GSTR-3B net tax summary. Select a month to load data."
      actions={(
        <Button
          onClick={exportCsv}
          disabled={!previewRows.length || gstr1Loading || gstr1Fetching || activeTab !== "GSTR1"}
          data-testid="jwl-gst-export-csv"
        >
          Export CSV
        </Button>
      )}
    >
      <div className="space-y-4">
        {/* Period selector */}
        <div className="app-panel p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs text-muted">Period (month)</span>
            <input
              type="month"
              aria-label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
        </div>

        {/* Report type tabs */}
        <div data-testid="gst-report-tabs">
          <FilterPills
            options={REPORT_TAB_OPTIONS as unknown as Array<{ label: string; value: string }>}
            value={activeTab}
            onChange={(v) => setActiveTab(v as ReportTab)}
          />
        </div>

        {/* GSTR-1 tab */}
        {activeTab === "GSTR1" && (
          <div className="space-y-4">
            {/* Summary cards from API */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="app-panel p-3">
                <p className="text-xs text-muted">Taxable amount</p>
                <p className="mt-1 font-semibold">
                  {formatINRCurrency(gstr1?.summary.taxable_total ?? 0)}
                </p>
              </div>
              <div className="app-panel p-3">
                <p className="text-xs text-muted">CGST</p>
                <p className="mt-1 font-semibold">
                  {formatINRCurrency(gstr1?.summary.cgst_total ?? 0)}
                </p>
              </div>
              <div className="app-panel p-3">
                <p className="text-xs text-muted">SGST</p>
                <p className="mt-1 font-semibold">
                  {formatINRCurrency(gstr1?.summary.sgst_total ?? 0)}
                </p>
              </div>
              <div className="app-panel p-3">
                <p className="text-xs text-muted">IGST</p>
                <p className="mt-1 font-semibold">
                  {formatINRCurrency(gstr1?.summary.igst_total ?? 0)}
                </p>
              </div>
            </div>

            {/* Section counts */}
            {gstr1 && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">B2B: {gstr1.summary.b2b_count}</Badge>
                <Badge variant="neutral">B2C: {gstr1.summary.b2c_count}</Badge>
                <Badge variant="neutral">Credit Notes: {gstr1.summary.credit_note_count}</Badge>
                <Badge variant="neutral">Total invoices: {gstr1.summary.invoice_count}</Badge>
              </div>
            )}

            {/* Section filter + preview table */}
            <div className="app-panel p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <FilterPills
                  options={GST_SECTION_OPTIONS as unknown as Array<{ label: string; value: string }>}
                  value={sectionFilter}
                  onChange={(v) => setSectionFilter(v as GstSectionFilter)}
                />
                <Badge variant="neutral">{previewRows.length} rows</Badge>
              </div>

              {!apiPeriod && (
                <EmptyState
                  title="Select a period to load data"
                  description="Choose a month above to preview GSTR-1 data."
                />
              )}

              {apiPeriod && isLoading && <SkeletonList count={4} />}

              {apiPeriod && hasError && !isLoading && (
                <EmptyState
                  title="Could not load GST preview"
                  description="The report preview could not be fetched. Retry after checking your filters."
                  action={{ label: "Retry", onClick: () => void refetch() }}
                />
              )}

              {apiPeriod && !isLoading && !hasError && previewRows.length === 0 && (
                <EmptyState
                  title="No invoices found for this period"
                  description="No issued tax invoices or credit notes found for the selected month."
                />
              )}

              {apiPeriod && !isLoading && !hasError && previewRows.length > 0 && (
                <GstPreviewTable rows={previewRows} />
              )}
            </div>
          </div>
        )}

        {/* GSTR-3B tab */}
        {activeTab === "GSTR3B" && (
          <div className="space-y-4">
            {!apiPeriod && (
              <EmptyState
                title="Select a period to load data"
                description="Choose a month above to preview GSTR-3B summary."
              />
            )}

            {apiPeriod && isLoading && <SkeletonList count={3} />}

            {apiPeriod && hasError && !isLoading && (
              <EmptyState
                title="Could not load GSTR-3B summary"
                description="The GSTR-3B summary could not be fetched."
                action={{ label: "Retry", onClick: () => void refetch() }}
              />
            )}

            {apiPeriod && !isLoading && !hasError && gstr3b && (
              <>
                <div className="app-panel p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Outward supplies
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted">Taxable value</p>
                      <p className="mt-1 font-semibold">{formatINRCurrency(gstr3b.outward_supplies.taxable_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">CGST</p>
                      <p className="mt-1 font-semibold">{formatINRCurrency(gstr3b.outward_supplies.cgst)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">SGST</p>
                      <p className="mt-1 font-semibold">{formatINRCurrency(gstr3b.outward_supplies.sgst)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">IGST</p>
                      <p className="mt-1 font-semibold">{formatINRCurrency(gstr3b.outward_supplies.igst)}</p>
                    </div>
                  </div>
                </div>

                <div className="app-panel p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Net tax payable
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted">CGST payable</p>
                      <p className="mt-1 font-semibold">{formatINRCurrency(gstr3b.net_tax_payable.cgst)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">SGST payable</p>
                      <p className="mt-1 font-semibold">{formatINRCurrency(gstr3b.net_tax_payable.sgst)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">IGST payable</p>
                      <p className="mt-1 font-semibold">{formatINRCurrency(gstr3b.net_tax_payable.igst)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Screen>
  );
}
