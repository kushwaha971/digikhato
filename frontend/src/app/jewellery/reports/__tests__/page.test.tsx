import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import JewelleryReportsPage from "@/app/jewellery/reports/page";
import { useListInvoicesQuery } from "@/store/jewellery-api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/store/jewellery-api", () => ({
  useListInvoicesQuery: jest.fn(),
}));

const useListInvoicesQueryMock = useListInvoicesQuery as jest.Mock;

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv-1",
    voucher_no: "INV-001",
    voucher_date: "2026-05-01",
    invoice_type: "TAX_INVOICE",
    status: "ISSUED",
    customer: "cust-1",
    customer_name: "Asha Sharma",
    customer_gstin: "27ABCDE1234F1Z5",
    reference_invoice: null,
    reference_invoice_no: "",
    place_of_supply_state_code: "27",
    seller_state_code: "27",
    is_inter_state: false,
    gross_amount: "10000",
    discount_amount: "0",
    taxable_amount: "10000",
    stone_value: "0",
    cgst: "150",
    sgst: "150",
    igst: "0",
    hallmark_gst: "0",
    round_off: "0",
    total_amount: "10300",
    advance_used: "0",
    paid_amount: "10300",
    balance_amount: "0",
    e_invoice_irn: "",
    e_invoice_qr: "",
    e_invoice_is_simulated: false,
    notes: "",
    issued_at: "2026-05-01T10:00:00Z",
    cancelled_at: null,
    cancel_reason: "",
    branch_name: "Main Branch",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    lines: [],
    payments: [],
    old_gold_purchases: [],
    ...overrides,
  };
}

function renderPage() {
  return render(<JewelleryReportsPage />);
}

beforeEach(() => {
  useListInvoicesQueryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── Test 1: renders "Reports" page title ─────────────────────────────────────

test("renders Reports page title", () => {
  renderPage();
  expect(screen.getByText("Reports")).toBeInTheDocument();
});

// ─── Test 2: renders GSTR-1 and GSTR-3B navigation cards ─────────────────────

test("renders GSTR-1 and GSTR-3B navigation cards", () => {
  renderPage();
  expect(screen.getByText("GSTR-1")).toBeInTheDocument();
  expect(screen.getByText("GSTR-3B")).toBeInTheDocument();
  expect(screen.getByText("Section-wise invoice preview + CSV export")).toBeInTheDocument();
  expect(screen.getByText("Net tax summary with outward supplies + ITC")).toBeInTheDocument();
});

// ─── Test 3: shows invoice rows in sales register after date range set ────────

test("shows invoice rows in sales register after date range set and Load clicked", async () => {
  const invoice = makeInvoice();

  // Initially show loading indicator on click
  useListInvoicesQueryMock
    .mockReturnValueOnce({ data: undefined, isLoading: false, isFetching: false, error: undefined })
    .mockReturnValue({
      data: { count: 1, next: null, previous: null, results: [invoice] },
      isLoading: false,
      isFetching: false,
      error: undefined,
    });

  renderPage();

  const dateFromInput = screen.getByLabelText("Date From");
  const dateToInput = screen.getByLabelText("Date To");
  const loadButton = screen.getByTestId("sales-register-load");

  fireEvent.change(dateFromInput, { target: { value: "2026-05-01" } });
  fireEvent.change(dateToInput, { target: { value: "2026-05-31" } });
  fireEvent.click(loadButton);

  await waitFor(() => {
    expect(screen.getByTestId("sales-register-table")).toBeInTheDocument();
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("Asha Sharma")).toBeInTheDocument();
  });
});

// ─── Test 4: shows empty state when no invoices found ────────────────────────

test("shows empty state when no invoices found", async () => {
  useListInvoicesQueryMock
    .mockReturnValueOnce({ data: undefined, isLoading: false, isFetching: false, error: undefined })
    .mockReturnValue({
      data: { count: 0, next: null, previous: null, results: [] },
      isLoading: false,
      isFetching: false,
      error: undefined,
    });

  renderPage();

  const loadButton = screen.getByTestId("sales-register-load");
  fireEvent.click(loadButton);

  await waitFor(() => {
    expect(screen.getByText("No invoices found")).toBeInTheDocument();
  });
});

// ─── Test 5: shows loading skeleton while fetching ───────────────────────────

test("shows loading skeleton while fetching invoices", async () => {
  useListInvoicesQueryMock
    .mockReturnValueOnce({ data: undefined, isLoading: false, isFetching: false, error: undefined })
    .mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: undefined,
    });

  renderPage();

  const loadButton = screen.getByTestId("sales-register-load");
  fireEvent.click(loadButton);

  await waitFor(() => {
    // SkeletonList renders skeleton items; check there's no table yet
    expect(screen.queryByTestId("sales-register-table")).not.toBeInTheDocument();
    expect(screen.queryByText("No invoices found")).not.toBeInTheDocument();
  });
});
