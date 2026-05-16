import { fireEvent, render, screen } from "@testing-library/react";

import InvoiceDetailPage from "@/app/jewellery/billing/[id]/page";
import { useAppSelector } from "@/store/hooks";
import {
  useCancelInvoiceMutation,
  useConvertToInvoiceMutation,
  useGenerateEInvoiceMutation,
  useGetAdminFeatureFlagsQuery,
  useGetInvoiceQuery,
  useIssueInvoiceMutation,
  useLazyGetInvoicePdfQuery,
  useSendInvoiceMutation,
} from "@/store/jewellery-api";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ id: "inv-101" })),
  useRouter: jest.fn(() => ({ push: pushMock })),
}));

jest.mock("@/store/hooks", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("@/store/jewellery-api", () => ({
  useGetInvoiceQuery: jest.fn(),
  useGetAdminFeatureFlagsQuery: jest.fn(),
  useIssueInvoiceMutation: jest.fn(),
  useCancelInvoiceMutation: jest.fn(),
  useConvertToInvoiceMutation: jest.fn(),
  useLazyGetInvoicePdfQuery: jest.fn(),
  useSendInvoiceMutation: jest.fn(),
  useGenerateEInvoiceMutation: jest.fn(),
}));

const useAppSelectorMock = useAppSelector as jest.Mock;
const useGetInvoiceQueryMock = useGetInvoiceQuery as jest.Mock;
const useGetAdminFeatureFlagsQueryMock = useGetAdminFeatureFlagsQuery as jest.Mock;
const useIssueInvoiceMutationMock = useIssueInvoiceMutation as jest.Mock;
const useCancelInvoiceMutationMock = useCancelInvoiceMutation as jest.Mock;
const useConvertToInvoiceMutationMock = useConvertToInvoiceMutation as jest.Mock;
const useLazyGetInvoicePdfQueryMock = useLazyGetInvoicePdfQuery as jest.Mock;
const useSendInvoiceMutationMock = useSendInvoiceMutation as jest.Mock;
const useGenerateEInvoiceMutationMock = useGenerateEInvoiceMutation as jest.Mock;

function makeIssuedInvoice() {
  return {
    id: "inv-101",
    voucher_no: "INV-101",
    voucher_date: "2026-05-06",
    invoice_type: "TAX_INVOICE",
    status: "ISSUED",
    customer: "cust-1",
    customer_name: "Asha",
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
    paid_amount: "0",
    balance_amount: "1030",
    e_invoice_irn: "",
    e_invoice_qr: "",
    notes: "",
    issued_at: "2026-05-06T10:00:00Z",
    cancelled_at: null,
    cancel_reason: "",
    branch_name: "Main",
    created_at: "2026-05-06T09:00:00Z",
    updated_at: "2026-05-06T10:00:00Z",
    lines: [
      {
        id: "line-1",
        item: null,
        sku: "",
        description: "Ring",
        hsn_code: "7113",
        metal_code: "GOLD",
        purity_code: "22K",
        gross_wt: "5.5000",
        net_wt: "5.2500",
        stone_wt: "0",
        rate_per_gram: "6200",
        metal_value: "32550",
        making_mode: "PER_GRAM",
        making_rate: "0",
        making_charge: "0",
        wastage_pct: "0",
        wastage_amount: "0",
        hallmarking_fee: "0",
        stone_value: "0",
        gst_rate_pct: "3",
        gst_amount: "976.5",
        hallmark_gst_amount: "0",
        discount_allocated: "0",
        line_subtotal: "32550",
        line_total: "33526.5",
      },
    ],
    payments: [],
    old_gold_purchases: [],
  };
}

function makeEstimateInvoice(overrides?: Partial<ReturnType<typeof makeIssuedInvoice>>) {
  return {
    ...makeIssuedInvoice(),
    invoice_type: "ESTIMATE",
    status: "DRAFT",
    ...overrides,
  };
}

function setupDefaults() {
  useAppSelectorMock.mockImplementation((selector: (state: unknown) => unknown) =>
    selector({ auth: { currentUser: { role: "collector", module_roles: [] } } }),
  );
  useGetInvoiceQueryMock.mockReturnValue({ data: makeIssuedInvoice(), isLoading: false });
  useGetAdminFeatureFlagsQueryMock.mockReturnValue({ data: { einvoice_applicable: true } });
  useIssueInvoiceMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
  useCancelInvoiceMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
  useConvertToInvoiceMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
  useLazyGetInvoicePdfQueryMock.mockReturnValue([jest.fn(), { isFetching: false }]);
  useSendInvoiceMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
  useGenerateEInvoiceMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
}

describe("Invoice detail permission and loading behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushMock.mockReset();
    setupDefaults();
  });

  it("hides cancel action for users without admin/manager jewellery roles", () => {
    render(<InvoiceDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "More ▾" }));

    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("shows cancel action for jewellery manager role", () => {
    useAppSelectorMock.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          currentUser: {
            role: "collector",
            module_roles: [{ module: "jewellery", is_active: true, role_code: "jwl_manager" }],
          },
        },
      }),
    );

    render(<InvoiceDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "More ▾" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders loading state while invoice detail is fetching", () => {
    useGetInvoiceQueryMock.mockReturnValue({ data: undefined, isLoading: true });

    render(<InvoiceDetailPage />);

    expect(screen.getByText("Loading invoice...")).toBeInTheDocument();
  });

  it("shows warning feedback for non-draft estimate conversion", () => {
    useGetInvoiceQueryMock.mockReturnValue({
      data: makeEstimateInvoice({ status: "ISSUED" }),
      isLoading: false,
    });

    render(<InvoiceDetailPage />);

    fireEvent.click(screen.getByTestId("jwl-estimate-convert-button"));
    expect(screen.getByTestId("jwl-estimate-convert-permission")).toBeInTheDocument();
    expect(screen.getByTestId("jwl-estimate-convert-feedback")).toHaveTextContent(
      "Only draft estimates can be converted to invoice.",
    );
  });

  it("hides convert action for non-estimate invoice", () => {
    useGetInvoiceQueryMock.mockReturnValue({
      data: makeIssuedInvoice({ invoice_type: "TAX_INVOICE", status: "DRAFT" }),
      isLoading: false,
    });

    render(<InvoiceDetailPage />);

    expect(screen.queryByTestId("jwl-estimate-convert-button")).not.toBeInTheDocument();
  });

  it("converts draft estimate and routes to new invoice detail", async () => {
    useGetInvoiceQueryMock.mockReturnValue({
      data: makeEstimateInvoice(),
      isLoading: false,
    });
    const convertMutation = jest.fn(() => ({
      unwrap: () => Promise.resolve({ id: "inv-202" }),
    }));
    useConvertToInvoiceMutationMock.mockReturnValue([convertMutation, { isLoading: false }]);

    render(<InvoiceDetailPage />);

    fireEvent.click(screen.getByTestId("jwl-estimate-convert-button"));
    expect(await screen.findByTestId("jwl-estimate-convert-feedback")).toHaveTextContent(
      "Converting estimate and opening invoice...",
    );
    expect(convertMutation).toHaveBeenCalledWith("inv-101");
    expect(pushMock).toHaveBeenCalledWith("/jewellery/billing/inv-202");
  });

  it("shows error feedback when estimate conversion fails", async () => {
    useGetInvoiceQueryMock.mockReturnValue({
      data: makeEstimateInvoice(),
      isLoading: false,
    });
    const convertMutation = jest.fn(() => ({
      unwrap: () => Promise.reject(new Error("bad request")),
    }));
    useConvertToInvoiceMutationMock.mockReturnValue([convertMutation, { isLoading: false }]);

    render(<InvoiceDetailPage />);

    fireEvent.click(screen.getByTestId("jwl-estimate-convert-button"));
    expect(await screen.findByTestId("jwl-estimate-convert-feedback")).toHaveTextContent(
      "Could not convert estimate. Please try again.",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
