import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

import JewelleryBillingPage from "@/app/jewellery/billing/page";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";
import jewelleryFiltersReducer from "@/store/jewellery-filters-slice";
import {
  useGenerateEInvoiceMutation,
  useGetAdminFeatureFlagsQuery,
  useListCustomersQuery,
  useListInvoicesQuery,
} from "@/store/jewellery-api";

const pushMock = jest.fn();
let currentView = "tax-invoice";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: pushMock })),
  useSearchParams: jest.fn(() => ({
    get: (key: string) => (key === "view" ? currentView : null),
  })),
}));

jest.mock("@/hooks/useInfiniteItems", () => ({
  useInfiniteItems: jest.fn(),
}));

jest.mock("@/components/ui/ResponsiveFilterPanel", () => ({
  FilterSelect: ({ label, children, value, onChange, disabled }: any) => (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={onChange} disabled={disabled}>
        {children}
      </select>
    </label>
  ),
  ResponsiveFilterPanel: ({ children, onApply, onReset }: any) => (
    <div>
      {children}
      <button type="button" onClick={onReset}>Reset</button>
      <button type="button" onClick={onApply}>Apply</button>
    </div>
  ),
}));

jest.mock("@/components/jewellery/shared/CustomerSearchSelect", () => ({
  CustomerSearchSelect: ({ label, value, onChange }: any) => (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All customers</option>
        <option value="cust-1">Asha</option>
      </select>
    </label>
  ),
}));

jest.mock("@/store/jewellery-api", () => ({
  useListInvoicesQuery: jest.fn(),
  useGenerateEInvoiceMutation: jest.fn(),
  useGetAdminFeatureFlagsQuery: jest.fn(),
  useListCustomersQuery: jest.fn(),
}));

const useInfiniteItemsMock = useInfiniteItems as jest.Mock;
const useListInvoicesQueryMock = useListInvoicesQuery as jest.Mock;
const useGenerateEInvoiceMutationMock = useGenerateEInvoiceMutation as jest.Mock;
const useGetAdminFeatureFlagsQueryMock = useGetAdminFeatureFlagsQuery as jest.Mock;
const useListCustomersQueryMock = useListCustomersQuery as jest.Mock;

function renderBillingPage() {
  const store = configureStore({
    reducer: {
      jewelleryFilters: jewelleryFiltersReducer,
    },
  });

  return render(
    <Provider store={store}>
      <JewelleryBillingPage />
    </Provider>,
  );
}

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv-1",
    voucher_no: "INV-1",
    voucher_date: "2026-05-06",
    invoice_type: "TAX_INVOICE",
    status: "ISSUED",
    customer: "cust-1",
    customer_name: "Asha",
    customer_gstin: "27ABCDE1234F1Z5",
    reference_invoice: null,
    reference_invoice_no: "",
    place_of_supply_state_code: "27",
    seller_state_code: "27",
    is_inter_state: false,
    gross_amount: "1000",
    discount_amount: "0",
    taxable_amount: "1000",
    stone_value: "0",
    cgst: "15",
    sgst: "15",
    igst: "0",
    hallmark_gst: "0",
    round_off: "0",
    total_amount: "1030",
    advance_used: "0",
    paid_amount: "500",
    balance_amount: "530",
    e_invoice_irn: "",
    e_invoice_qr: "",
    notes: "",
    issued_at: "2026-05-06T10:00:00Z",
    cancelled_at: null,
    cancel_reason: "",
    branch_name: "Main",
    created_at: "2026-05-06T09:00:00Z",
    updated_at: "2026-05-06T10:00:00Z",
    lines: [],
    payments: [],
    old_gold_purchases: [],
    ...overrides,
  };
}

describe("Jewellery billing page list + operational views", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentView = "tax-invoice";

    useListCustomersQueryMock.mockReturnValue({
      data: { results: [{ id: "cust-1", name: "Asha", mobile: "9999999999" }] },
      isFetching: false,
    });
    useGetAdminFeatureFlagsQueryMock.mockReturnValue({
      data: { einvoice_applicable: true },
      isFetching: false,
    });

    useListInvoicesQueryMock.mockImplementation((_params: unknown, options?: { skip?: boolean }) => {
      if (options?.skip) {
        return { data: undefined, isFetching: false };
      }
      return {
        data: { count: 1, results: [makeInvoice()] },
        isFetching: false,
      };
    });

    useInfiniteItemsMock.mockImplementation((data: { results?: unknown[] } | undefined) => ({
      items: data?.results ?? [],
      hasMore: false,
      sentinelRef: { current: null },
    }));

    useGenerateEInvoiceMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
  });

  it("applies dedicated customer and status filters to invoice list query", async () => {
    renderBillingPage();

    await waitFor(() => {
      expect(useListInvoicesQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          type: undefined,
          status: undefined,
          customer: undefined,
        }),
      );
    });

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ISSUED" } });
    fireEvent.change(screen.getByLabelText("Customer"), { target: { value: "cust-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(useListInvoicesQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          status: "ISSUED",
          customer: "cust-1",
        }),
      );
    });

    expect(screen.getByText("Filters applied")).toBeInTheDocument();
  });

  it("renders messages view with issued invoice cards", async () => {
    currentView = "messages";
    useListInvoicesQueryMock.mockImplementation((params: { status?: string }, options?: { skip?: boolean }) => {
      if (options?.skip) {
        return { data: undefined, isFetching: false };
      }
      if (params.status === "ISSUED") {
        return {
          data: { count: 1, results: [makeInvoice({ voucher_no: "INV-MSG" })] },
          isFetching: false,
        };
      }
      return { data: { count: 0, results: [] }, isFetching: false };
    });

    renderBillingPage();

    expect(await screen.findByText("WhatsApp / SMS send")).toBeInTheDocument();
    expect(screen.getByText("INV-MSG")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open share" })).toBeInTheDocument();
  });

  it("renders e-invoice view and triggers IRN generation for pending rows", async () => {
    currentView = "einvoice";
    const generateMock = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({}) }));
    useGenerateEInvoiceMutationMock.mockReturnValue([generateMock, { isLoading: false }]);
    useListInvoicesQueryMock.mockImplementation((params: { type?: string }, options?: { skip?: boolean }) => {
      if (options?.skip) {
        return { data: undefined, isFetching: false };
      }
      if (params.type === "TAX_INVOICE") {
        return {
          data: {
            count: 2,
            results: [
              makeInvoice({ id: "inv-pending", voucher_no: "INV-PENDING", e_invoice_irn: "" }),
              makeInvoice({ id: "inv-ready", voucher_no: "INV-READY", e_invoice_irn: "IRN-ABC-123" }),
            ],
          },
          isFetching: false,
        };
      }
      return { data: { count: 0, results: [] }, isFetching: false };
    });

    renderBillingPage();

    expect(await screen.findByText("E-invoice (IRN+QR)")).toBeInTheDocument();
    expect(screen.getByText("INV-PENDING")).toBeInTheDocument();
    expect(screen.getByText("INV-READY")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Generate IRN" }));
    const acknowledgmentCheckboxes = screen.getAllByRole("checkbox", { name: /simulated IRN for internal reference only/i });
    fireEvent.click(acknowledgmentCheckboxes[acknowledgmentCheckboxes.length - 1]);
    const generateButtons = screen.getAllByRole("button", { name: "Generate IRN" });
    fireEvent.click(generateButtons[generateButtons.length - 1]);
    expect(generateMock).toHaveBeenCalledWith("inv-pending");
    expect(screen.getByText(/IRN: IRN-ABC-123/i)).toBeInTheDocument();
  });

  it("resets all filters including date sort on Reset click", async () => {
    renderBillingPage();

    // Set status to ISSUED and ordering to oldest-first
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ISSUED" } });
    fireEvent.change(screen.getByLabelText("Date order"), { target: { value: "voucher_date" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(useListInvoicesQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ISSUED", ordering: "voucher_date" }),
      );
    });

    // Now reset
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(useListInvoicesQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined, ordering: "-voucher_date" }),
      );
    });
  });

  it("shows empty state message in messages view when no invoices", async () => {
    currentView = "messages";
    useListInvoicesQueryMock.mockImplementation((_params: unknown, options?: { skip?: boolean }) => {
      if (options?.skip) return { data: undefined, isFetching: false };
      return { data: { count: 0, results: [] }, isFetching: false };
    });

    renderBillingPage();

    expect(await screen.findByText("WhatsApp / SMS send")).toBeInTheDocument();
    // No invoice cards rendered — the list container is empty
    expect(screen.queryByRole("button", { name: "Open share" })).not.toBeInTheDocument();
  });

  it("shows empty state in einvoice view when no invoices", async () => {
    currentView = "einvoice";
    useListInvoicesQueryMock.mockImplementation((_params: unknown, options?: { skip?: boolean }) => {
      if (options?.skip) return { data: undefined, isFetching: false };
      return { data: { count: 0, results: [] }, isFetching: false };
    });

    renderBillingPage();

    expect(await screen.findByText("E-invoice (IRN+QR)")).toBeInTheDocument();
    // No invoice cards rendered — neither action button is present
    expect(screen.queryByRole("button", { name: "Generate IRN" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open invoice" })).not.toBeInTheDocument();
  });

  it("renders date order filter select in tax-invoice view", async () => {
    renderBillingPage();

    const select = await screen.findByLabelText("Date order");
    expect(select).toBeInTheDocument();

    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text);
    expect(options).toContain("Newest first");
    expect(options).toContain("Oldest first");
  });
});
