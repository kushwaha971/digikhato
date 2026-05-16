import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import JewelleryMultiBranchPage from "@/app/jewellery/multi-branch/page";
import { useListTransfersQuery } from "@/store/jewellery-api";

jest.mock("@/store/jewellery-api", () => ({
  useListTransfersQuery: jest.fn(),
}));

const useListTransfersQueryMock = useListTransfersQuery as jest.Mock;

function makeTransfer(overrides: Record<string, unknown> = {}) {
  return {
    id: "tr-1",
    from_branch: "Main Branch",
    to_branch: "East Branch",
    status: "REQUESTED",
    dispatched_at: null,
    received_at: null,
    notes: "",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    lines: [{ id: 1, item: "item-1", item_sku: "SKU-001", item_status: "IN_STOCK", qty: 1, weight: "10.00" }],
    ...overrides,
  };
}

describe("Jewellery Multi-Branch page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useListTransfersQueryMock.mockReturnValue({ data: { results: [] }, isLoading: false });
  });

  it("renders the Multi-Branch page title", () => {
    render(<JewelleryMultiBranchPage />);
    expect(screen.getByText("Multi-Branch")).toBeInTheDocument();
  });

  it("shows transfer rows when data is available", () => {
    useListTransfersQueryMock.mockReturnValue({
      data: {
        results: [
          makeTransfer({ id: "tr-1", from_branch: "Main Branch", to_branch: "East Branch", status: "REQUESTED" }),
          makeTransfer({ id: "tr-2", from_branch: "East Branch", to_branch: "West Branch", status: "RECEIVED" }),
        ],
      },
      isLoading: false,
    });

    render(<JewelleryMultiBranchPage />);

    expect(screen.getByText("Main Branch")).toBeInTheDocument();
    // "East Branch" appears as to_branch of tr-1 and from_branch of tr-2
    expect(screen.getAllByText("East Branch").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("West Branch")).toBeInTheDocument();
    // Status badges (Received also appears in summary cards when no statusFilter)
    expect(screen.getAllByText("Requested").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Received").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no transfers exist", () => {
    useListTransfersQueryMock.mockReturnValue({
      data: { results: [] },
      isLoading: false,
    });

    render(<JewelleryMultiBranchPage />);

    expect(screen.getByText("No transfers found")).toBeInTheDocument();
  });

  it("status filter pill changes the query parameter passed to useListTransfersQuery", async () => {
    useListTransfersQueryMock.mockReturnValue({
      data: { results: [] },
      isLoading: false,
    });

    render(<JewelleryMultiBranchPage />);

    // Click "In Transit" filter pill
    fireEvent.click(screen.getByRole("button", { name: "In Transit" }));

    await waitFor(() => {
      expect(useListTransfersQueryMock).toHaveBeenCalledWith({ status: "IN_TRANSIT" });
    });

    // Click "All" to reset
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    await waitFor(() => {
      expect(useListTransfersQueryMock).toHaveBeenCalledWith({});
    });
  });

  it("New Transfer link points to the correct route", () => {
    render(<JewelleryMultiBranchPage />);

    const link = screen.getByRole("link", { name: /New Transfer/i });
    expect(link).toHaveAttribute("href", "/jewellery/inventory/transfers/new");
  });
});
