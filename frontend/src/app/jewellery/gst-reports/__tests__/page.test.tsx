import { fireEvent, render, screen } from "@testing-library/react";

import JewelleryGstReportsPage from "../page";
import { useGetGstr1ReportQuery, useGetGstr3bReportQuery } from "@/store/jewellery-api";

jest.mock("@/store/jewellery-api", () => ({
  useGetGstr1ReportQuery: jest.fn(),
  useGetGstr3bReportQuery: jest.fn(),
}));

const useGetGstr1ReportQueryMock = useGetGstr1ReportQuery as jest.Mock;
const useGetGstr3bReportQueryMock = useGetGstr3bReportQuery as jest.Mock;

function makeGstr1Row(overrides?: Partial<Record<string, unknown>>) {
  return {
    voucher_no: "INV-001",
    voucher_date: "2026-05-10",
    invoice_type: "TAX_INVOICE",
    customer_gstin: "",
    taxable_amount: "1000.00",
    cgst: "15.00",
    sgst: "15.00",
    igst: "0.00",
    total_amount: "1030.00",
    ...overrides,
  };
}

function makeGstr1Report(overrides?: Partial<Record<string, unknown>>) {
  return {
    period: "202605",
    generated_at: "2026-05-10T10:00:00Z",
    summary: {
      invoice_count: 2,
      b2b_count: 1,
      b2c_count: 1,
      credit_note_count: 0,
      taxable_total: "2000.00",
      cgst_total: "30.00",
      sgst_total: "30.00",
      igst_total: "0.00",
    },
    b2b: [makeGstr1Row({ voucher_no: "INV-B2B", customer_gstin: "27AAAAA0000A1Z5" })],
    b2c: [makeGstr1Row({ voucher_no: "INV-B2C", customer_gstin: "" })],
    cdnr: [],
    ...overrides,
  };
}

function makeGstr3bReport() {
  return {
    period: "202605",
    generated_at: "2026-05-10T10:00:00Z",
    outward_supplies: {
      taxable_value: "2000.00",
      igst: "0.00",
      cgst: "30.00",
      sgst: "30.00",
      cess: "0.00",
    },
    itc: {
      eligible_igst: "0.00",
      eligible_cgst: "0.00",
      eligible_sgst: "0.00",
      reversed_igst: "0.00",
      reversed_cgst: "0.00",
      reversed_sgst: "0.00",
    },
    net_tax_payable: {
      igst: "0.00",
      cgst: "30.00",
      sgst: "30.00",
      cess: "0.00",
    },
  };
}

function idleGstr1() {
  return { data: undefined, isLoading: false, isFetching: false, error: null, refetch: jest.fn() };
}

function idleGstr3b() {
  return { data: undefined, isLoading: false, error: null, refetch: jest.fn() };
}

describe("JewelleryGstReportsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGetGstr1ReportQueryMock.mockReturnValue(idleGstr1());
    useGetGstr3bReportQueryMock.mockReturnValue(idleGstr3b());
  });

  it("renders page title and period picker without data", () => {
    render(<JewelleryGstReportsPage />);
    expect(screen.getByText("GST & Reports")).toBeInTheDocument();
    expect(screen.getByLabelText("Period")).toBeInTheDocument();
    expect(screen.getByText("Select a period to load data")).toBeInTheDocument();
  });

  it("shows empty state when no period is selected", () => {
    render(<JewelleryGstReportsPage />);
    expect(screen.getByText("Select a period to load data")).toBeInTheDocument();
  });

  it("passes YYYYMM period to GSTR-1 query when period is selected", () => {
    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });
    const lastCall = useGetGstr1ReportQueryMock.mock.calls.at(-1);
    expect(lastCall?.[0]).toEqual({ period: "202605" });
    expect(lastCall?.[1]).toMatchObject({ skip: false });
  });

  it("renders GSTR-1 summary cards from API response", () => {
    useGetGstr1ReportQueryMock.mockReturnValue({
      data: makeGstr1Report(),
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });

    expect(screen.getByText("Taxable amount")).toBeInTheDocument();
    expect(screen.getAllByText("₹2,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("B2B: 1")).toBeInTheDocument();
    expect(screen.getByText("B2C: 1")).toBeInTheDocument();
  });

  it("renders preview rows for B2B and B2C in ALL section", () => {
    useGetGstr1ReportQueryMock.mockReturnValue({
      data: makeGstr1Report(),
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });

    expect(screen.getByText("INV-B2B")).toBeInTheDocument();
    expect(screen.getByText("INV-B2C")).toBeInTheDocument();
  });

  it("filters preview rows by B2B section", () => {
    useGetGstr1ReportQueryMock.mockReturnValue({
      data: makeGstr1Report(),
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });

    fireEvent.click(screen.getByRole("button", { name: "B2B" }));
    expect(screen.getByText("INV-B2B")).toBeInTheDocument();
    expect(screen.queryByText("INV-B2C")).not.toBeInTheDocument();
  });

  it("filters preview rows by B2C section", () => {
    useGetGstr1ReportQueryMock.mockReturnValue({
      data: makeGstr1Report(),
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });

    fireEvent.click(screen.getByRole("button", { name: "B2C" }));
    expect(screen.getByText("INV-B2C")).toBeInTheDocument();
    expect(screen.queryByText("INV-B2B")).not.toBeInTheDocument();
  });

  it("shows empty state when no invoices found for period", () => {
    useGetGstr1ReportQueryMock.mockReturnValue({
      data: makeGstr1Report({ b2b: [], b2c: [], cdnr: [], summary: { invoice_count: 0, b2b_count: 0, b2c_count: 0, credit_note_count: 0, taxable_total: "0.00", cgst_total: "0.00", sgst_total: "0.00", igst_total: "0.00" } }),
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });

    expect(screen.getByText("No invoices found for this period")).toBeInTheDocument();
  });

  it("shows error state and retry button on query failure", () => {
    const refetch = jest.fn();
    useGetGstr1ReportQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: { status: 500 },
      refetch,
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });

    expect(screen.getByText("Could not load GST preview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("exports CSV when export button is clicked", () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:csv");
    URL.revokeObjectURL = jest.fn();
    const anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const appendChild = jest.spyOn(document.body, "appendChild");
    const removeChild = jest.spyOn(document.body, "removeChild");

    useGetGstr1ReportQueryMock.mockReturnValue({
      data: makeGstr1Report(),
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });
    fireEvent.click(screen.getByTestId("jwl-gst-export-csv"));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(anchorClickSpy).toHaveBeenCalled();

    anchorClickSpy.mockRestore();
    appendChild.mockRestore();
    removeChild.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("shows GSTR-3B summary when GSTR-3B tab is active", () => {
    useGetGstr3bReportQueryMock.mockReturnValue({
      data: makeGstr3bReport(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<JewelleryGstReportsPage />);
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "2026-05" } });
    fireEvent.click(screen.getByRole("button", { name: "GSTR-3B" }));

    expect(screen.getByText("Outward supplies")).toBeInTheDocument();
    expect(screen.getByText("Net tax payable")).toBeInTheDocument();
    expect(screen.getByText("CGST payable")).toBeInTheDocument();
  });
});
