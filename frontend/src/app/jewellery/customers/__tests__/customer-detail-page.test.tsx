import { render, screen } from "@testing-library/react";

import CustomerDetailPage from "../[id]/page";
import { useGetCustomerQuery, useListInvoicesQuery } from "@/store/jewellery-api";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ id: "cust-1" })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/store/jewellery-api", () => ({
  useGetCustomerQuery: jest.fn(),
  useListInvoicesQuery: jest.fn(),
}));

const useGetCustomerQueryMock = useGetCustomerQuery as jest.Mock;
const useListInvoicesQueryMock = useListInvoicesQuery as jest.Mock;

function makeCustomer(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: "cust-1",
    name: "Asha Shah",
    mobile: "9876543210",
    email: "",
    gstin: "",
    pan: "",
    state_code: "27",
    address: "",
    city: "Mumbai",
    dob: null,
    anniversary: null,
    loyalty_points: 0,
    outstanding_amount_balance: "15250.75",
    outstanding_metal_balance_grams: "3.2400",
    outstanding_last_txn_date: "2026-05-10",
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

describe("Customer detail outstanding snapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useListInvoicesQueryMock.mockReturnValue({ data: { results: [] }, isFetching: false });
  });

  it("renders outstanding snapshot with amount, metal and last activity", () => {
    useGetCustomerQueryMock.mockReturnValue({ data: makeCustomer(), isFetching: false });

    render(<CustomerDetailPage />);

    expect(screen.getByTestId("jwl-customer-outstanding-card")).toBeInTheDocument();
    expect(screen.getByText("Amount balance")).toBeInTheDocument();
    expect(screen.getByText("₹15,250.75")).toBeInTheDocument();
    expect(screen.getByText("3.2400 g")).toBeInTheDocument();
    expect(screen.getByText("2026-05-10")).toBeInTheDocument();
  });

  it("shows default outstanding last activity text when none is present", () => {
    useGetCustomerQueryMock.mockReturnValue({
      data: makeCustomer({ outstanding_last_txn_date: null }),
      isFetching: false,
    });

    render(<CustomerDetailPage />);

    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });
});

