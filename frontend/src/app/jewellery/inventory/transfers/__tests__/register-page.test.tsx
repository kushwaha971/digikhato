import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import TransferRegisterReportPage from "@/app/jewellery/inventory/transfers/register/page";
import { useJwlPermission } from "@/hooks/useRoleAccess";
import { useGetTransferRegisterReportQuery } from "@/store/jewellery-api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

jest.mock("@/store/jewellery-api", () => ({
  useGetTransferRegisterReportQuery: jest.fn(),
}));
jest.mock("@/hooks/useRoleAccess", () => ({
  useJwlPermission: jest.fn(),
}));

const useGetTransferRegisterReportQueryMock = useGetTransferRegisterReportQuery as jest.Mock;
const useJwlPermissionMock = useJwlPermission as jest.Mock;

describe("TransferRegisterReportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-05-10T08:00:00Z"));
    useJwlPermissionMock.mockReturnValue(true);
    useGetTransferRegisterReportQueryMock.mockReturnValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        summary: {
          count: 1,
          received_count: 1,
          in_transit_count: 0,
          total_weight: "5.5000",
        },
        results: [
          {
            id: "tr-1",
            from_branch: "Main",
            to_branch: "Branch-2",
            status: "RECEIVED",
            created_at: "2026-05-10T08:00:00Z",
            dispatched_at: "2026-05-10T09:00:00Z",
            received_at: "2026-05-10T10:00:00Z",
            line_count: 2,
            total_weight: "5.5000",
            notes: "Daily transfer",
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders summary cards and transfer rows", () => {
    render(<TransferRegisterReportPage />);
    expect(screen.getByText("Transfer Register")).toBeInTheDocument();
    expect(screen.getByText("5.5000 g")).toBeInTheDocument();
    expect(screen.getByText("Main → Branch-2")).toBeInTheDocument();
    expect(screen.getByText("RECEIVED")).toBeInTheDocument();
  });

  it("shows retry state when report query fails", () => {
    useGetTransferRegisterReportQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: { status: 400, data: { detail: "Date range cannot exceed 92 days." } },
      refetch: jest.fn(),
    });
    render(<TransferRegisterReportPage />);
    expect(screen.getByText("Could not load transfer register")).toBeInTheDocument();
    expect(screen.getByText("Date range cannot exceed 92 days.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("uses current month window as default filters on initial load", () => {
    render(<TransferRegisterReportPage />);
    expect(useGetTransferRegisterReportQueryMock).toHaveBeenLastCalledWith({
      from_date: "2026-05-01",
      to_date: "2026-05-10",
    });
  });

  it("passes filter params to report query hook", async () => {
    render(<TransferRegisterReportPage />);
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-05-10" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "IN_TRANSIT" } });
    fireEvent.change(screen.getByLabelText("From branch"), { target: { value: "Main" } });
    fireEvent.change(screen.getByLabelText("To branch"), { target: { value: "Branch-2" } });

    await waitFor(() => {
      expect(useGetTransferRegisterReportQueryMock).toHaveBeenLastCalledWith({
        from_date: "2026-05-01",
        to_date: "2026-05-10",
        status: "IN_TRANSIT",
        from_branch: "Main",
        to_branch: "Branch-2",
      });
    });
  });

  it("exports csv for filtered rows", () => {
    const createObjectURL = jest.fn(() => "blob:mock-url");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(global.URL, "createObjectURL", { writable: true, value: createObjectURL });
    Object.defineProperty(global.URL, "revokeObjectURL", { writable: true, value: revokeObjectURL });

    render(<TransferRegisterReportPage />);
    fireEvent.click(screen.getByTestId("jwl-transfer-register-export"));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("keeps export disabled when there are no rows", () => {
    useGetTransferRegisterReportQueryMock.mockReturnValue({
      data: {
        count: 0,
        next: null,
        previous: null,
        summary: {
          count: 0,
          received_count: 0,
          in_transit_count: 0,
          total_weight: "0.0000",
        },
        results: [],
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<TransferRegisterReportPage />);
    expect(screen.getByTestId("jwl-transfer-register-export")).toBeDisabled();
  });

  it("keeps export disabled when user lacks export permission", () => {
    useJwlPermissionMock.mockReturnValue(false);
    render(<TransferRegisterReportPage />);
    expect(screen.getByTestId("jwl-transfer-register-export")).toBeDisabled();
  });
});
