import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import JewelleryOutstandingPage from "@/app/jewellery/outstanding/page";
import { useAppSelector } from "@/store/hooks";
import {
  useGetOutstandingMovementsQuery,
  useGetOutstandingPartyQuery,
  useLazyExportOutstandingCsvQuery,
  useListOutstandingQuery,
  usePostOutstandingAdjustmentMutation,
} from "@/store/jewellery-api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

jest.mock("@/store/hooks", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("@/store/jewellery-api", () => ({
  useListOutstandingQuery: jest.fn(),
  useGetOutstandingPartyQuery: jest.fn(),
  useGetOutstandingMovementsQuery: jest.fn(),
  useLazyExportOutstandingCsvQuery: jest.fn(),
  usePostOutstandingAdjustmentMutation: jest.fn(),
}));

const useAppSelectorMock = useAppSelector as jest.Mock;
const useListOutstandingQueryMock = useListOutstandingQuery as jest.Mock;
const useGetOutstandingPartyQueryMock = useGetOutstandingPartyQuery as jest.Mock;
const useGetOutstandingMovementsQueryMock = useGetOutstandingMovementsQuery as jest.Mock;
const useLazyExportOutstandingCsvQueryMock = useLazyExportOutstandingCsvQuery as jest.Mock;
const usePostOutstandingAdjustmentMutationMock = usePostOutstandingAdjustmentMutation as jest.Mock;

const party = {
  id: "bal-1",
  customer_id: "cust-1",
  customer_name: "Asha",
  mobile: "9999999999",
  amount_balance: "1200.00",
  metal_balance_grams: "0.0000",
  last_txn_date: "2026-05-08",
  overdue_90_plus: false,
  age_days: 1,
  ageing_bucket: "0_30" as const,
};

const detail = {
  id: "bal-1",
  customer: "cust-1",
  customer_name: "Asha",
  customer_mobile: "9999999999",
  amount_balance: "1200.00",
  metal_balance_grams: "0.0000",
  last_txn_date: "2026-05-08",
  movements: [],
};

const movement1 = {
  id: "mv-1",
  balance: "bal-1",
  movement_type: "INVOICE_DEBIT",
  amount_delta: "1200.00",
  metal_delta_grams: "0.0000",
  reference_type: "",
  reference_id: "",
  notes: "Invoice posted",
  txn_date: "2026-05-08",
  created_at: "2026-05-08T10:00:00Z",
};

const movement2 = {
  id: "mv-2",
  balance: "bal-1",
  movement_type: "PAYMENT_RECEIVED",
  amount_delta: "-200.00",
  metal_delta_grams: "0.0000",
  reference_type: "",
  reference_id: "",
  notes: "Part payment",
  txn_date: "2026-05-09",
  created_at: "2026-05-09T10:00:00Z",
};

const page1MovementsResponse = {
  count: 2,
  next: "http://localhost/api/jwl/v1/outstanding/bal-1/movements/?page=2&page_size=25",
  previous: null,
  results: [movement1],
};

const page2MovementsResponse = {
  count: 2,
  next: null,
  previous: "http://localhost/api/jwl/v1/outstanding/bal-1/movements/?page=1&page_size=25",
  results: [movement2],
};

function setupBase() {
  useAppSelectorMock.mockImplementation((selector: (state: unknown) => unknown) =>
    selector({ auth: { currentUser: { role: "collector", module_roles: [] } } }),
  );
  useListOutstandingQueryMock.mockReturnValue({
    data: [party],
    isFetching: false,
    isError: false,
    refetch: jest.fn(),
  });
  useGetOutstandingPartyQueryMock.mockImplementation((id: string, options?: { skip?: boolean }) => {
    if (options?.skip || !id) {
      return { data: undefined, isFetching: false };
    }
    return { data: detail, isFetching: false };
  });
  useLazyExportOutstandingCsvQueryMock.mockReturnValue([jest.fn(), { isFetching: false }]);
  usePostOutstandingAdjustmentMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
}

describe("Jewellery outstanding page movement pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupBase();
  });

  it("wires paginated movement API params and loads next page on demand", async () => {
    useGetOutstandingMovementsQueryMock.mockImplementation((params: { id: string; page?: number }, options?: { skip?: boolean }) => {
      if (options?.skip || !params.id) {
        return { data: undefined, isLoading: false, isFetching: false, isError: false, refetch: jest.fn() };
      }

      if (params.page === 2) {
        return {
          data: page2MovementsResponse,
          isLoading: false,
          isFetching: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      return {
        data: page1MovementsResponse,
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: jest.fn(),
      };
    });

    render(<JewelleryOutstandingPage />);

    const partyCard = screen.getByText("Asha").closest("button");
    expect(partyCard).toBeTruthy();
    fireEvent.click(partyCard!);

    await waitFor(() => {
      expect(useGetOutstandingMovementsQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "bal-1", page: 1, page_size: 25 }),
        expect.objectContaining({ skip: false }),
      );
    });

    expect((await screen.findAllByText("Invoice raised")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Load more movements" })[0]);

    expect((await screen.findAllByText("Payment received")).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Load more movements" })).toHaveLength(0);
  });

  it("falls back to detail movements if paginated movement API errors", async () => {
    useGetOutstandingPartyQueryMock.mockReturnValue({
      data: {
        ...detail,
        movements: [movement2],
      },
      isFetching: false,
    });
    useGetOutstandingMovementsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: jest.fn(),
    });

    render(<JewelleryOutstandingPage />);

    const partyCard = screen.getByText("Asha").closest("button");
    expect(partyCard).toBeTruthy();
    fireEvent.click(partyCard!);

    expect((await screen.findAllByText("Movement history fallback mode active.")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Payment received")).length).toBeGreaterThan(0);
  });

  it("keeps manual adjustment gated for non-manager roles", () => {
    useGetOutstandingMovementsQueryMock.mockReturnValue({
      data: { count: 0, next: null, previous: null, results: [] },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<JewelleryOutstandingPage />);

    expect(screen.queryByRole("button", { name: "Manual Adjustment" })).not.toBeInTheDocument();
  });

  it("shows retry state when outstanding list load fails", () => {
    const refetch = jest.fn();
    useListOutstandingQueryMock.mockReturnValue({
      data: [],
      isFetching: false,
      isError: true,
      refetch,
    });
    useGetOutstandingMovementsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<JewelleryOutstandingPage />);

    expect(screen.getByTestId("jwl-outstanding-list-error")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows movement retry and readonly note when movement fetch fails and no fallback rows", async () => {
    const movementRefetch = jest.fn();
    useGetOutstandingMovementsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: movementRefetch,
    });
    useGetOutstandingPartyQueryMock.mockReturnValue({
      data: {
        ...detail,
        movements: [],
      },
      isFetching: false,
    });

    render(<JewelleryOutstandingPage />);

    const partyCard = screen.getByText("Asha").closest("button");
    expect(partyCard).toBeTruthy();
    fireEvent.click(partyCard!);

    expect((await screen.findAllByText("Could not load movement history.")).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("jwl-outstanding-readonly-note").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    expect(movementRefetch).toHaveBeenCalled();
  });
});
