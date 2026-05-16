import { render, screen } from "@testing-library/react";

import TransfersPage from "@/app/jewellery/inventory/transfers/page";
import { TRANSFER_STATUS_OPTIONS } from "@/constants/jewellery";
import {
  useApproveTransferMutation,
  useDispatchTransferMutation,
  useListTransfersQuery,
  useRejectTransferMutation,
  useReceiveTransferMutation,
} from "@/store/jewellery-api";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

jest.mock("@/components/ui/ResponsiveFilterPanel", () => ({
  ResponsiveFilterPanel: ({ children }: any) => <div>{children}</div>,
  FilterSelect: ({ label, children, value, onChange }: any) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  ),
}));

jest.mock("@/store/jewellery-api", () => ({
  useListTransfersQuery: jest.fn(),
  useApproveTransferMutation: jest.fn(),
  useDispatchTransferMutation: jest.fn(),
  useReceiveTransferMutation: jest.fn(),
  useRejectTransferMutation: jest.fn(),
}));

const useListTransfersQueryMock = useListTransfersQuery as jest.Mock;
const useApproveTransferMutationMock = useApproveTransferMutation as jest.Mock;
const useDispatchTransferMutationMock = useDispatchTransferMutation as jest.Mock;
const useReceiveTransferMutationMock = useReceiveTransferMutation as jest.Mock;
const useRejectTransferMutationMock = useRejectTransferMutation as jest.Mock;

function transfer(status: "REQUESTED" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "REJECTED", id: string) {
  return {
    id,
    from_branch: "Main",
    to_branch: "Branch-2",
    status,
    dispatched_at: null,
    received_at: null,
    notes: "",
    created_at: "2026-05-09T10:00:00Z",
    updated_at: "2026-05-09T10:00:00Z",
    lines: [],
  };
}

describe("TransfersPage hardening paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useApproveTransferMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
    useDispatchTransferMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
    useReceiveTransferMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
    useRejectTransferMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
    useListTransfersQueryMock.mockReturnValue({
      data: { count: 0, next: null, previous: null, results: [] },
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("renders transfer status filter options from shared constants", () => {
    render(<TransfersPage />);
    const select = screen.getByLabelText("Status") as HTMLSelectElement;
    const rendered = Array.from(select.options).map((option) => ({
      label: option.textContent,
      value: option.value,
    }));
    expect(rendered).toEqual(
      TRANSFER_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
      })),
    );
  });

  it("shows status actions only for actionable transfer states", () => {
    useListTransfersQueryMock.mockReturnValue({
      data: {
        count: 4,
        next: null,
        previous: null,
        results: [
          transfer("REQUESTED", "t-1"),
          transfer("APPROVED", "t-2"),
          transfer("IN_TRANSIT", "t-3"),
          transfer("RECEIVED", "t-4"),
        ],
      },
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<TransfersPage />);

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dispatch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark received" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Reject" })).toHaveLength(2);
  });

  it("shows retry state when transfers query fails", () => {
    useListTransfersQueryMock.mockReturnValue({
      data: undefined,
      isFetching: false,
      error: { status: 500 },
      refetch: jest.fn(),
    });

    render(<TransfersPage />);
    expect(screen.getByText("Could not load transfers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
