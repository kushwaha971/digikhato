import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import JewelleryNotificationsPage from "@/app/jewellery/notifications/page";
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useRefreshNotificationsMutation,
} from "@/features/notifications/notification-api";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, onClick, ...rest }: any) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

jest.mock("@/features/notifications/notification-api", () => ({
  useListNotificationsQuery: jest.fn(),
  useMarkNotificationReadMutation: jest.fn(),
  useRefreshNotificationsMutation: jest.fn(),
}));

const useListNotificationsQueryMock = useListNotificationsQuery as jest.Mock;
const useMarkNotificationReadMutationMock = useMarkNotificationReadMutation as jest.Mock;
const useRefreshNotificationsMutationMock = useRefreshNotificationsMutation as jest.Mock;

function makeNotification(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 1,
    user: 2,
    user_id: 2,
    role: "admin",
    loan: null,
    loan_uuid: null,
    loan_code: null,
    loan_amount: null,
    borrower: null,
    borrower_uuid: null,
    borrower_name: "Asha Retail",
    type: "system_activity",
    message: "Transfer dispatched from Main to Branch-2",
    redirect_target: "/jewellery/inventory/transfers",
    due_date: null,
    is_read: false,
    is_active: true,
    resolved_at: null,
    created_at: "2026-05-10T10:00:00Z",
    updated_at: "2026-05-10T10:00:00Z",
    ...overrides,
  };
}

describe("JewelleryNotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMarkNotificationReadMutationMock.mockReturnValue([jest.fn(), {}]);
    useRefreshNotificationsMutationMock.mockReturnValue([jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ synced_loans: 0 }) })), { isLoading: false }]);
    useListNotificationsQueryMock.mockReturnValue({
      data: { count: 1, next: null, previous: null, results: [makeNotification()] },
      isLoading: false,
      isFetching: false,
      refetch: jest.fn(),
    });
  });

  it("renders notifications list with refresh action", () => {
    render(<JewelleryNotificationsPage />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByTestId("jwl-notifications-refresh")).toBeInTheDocument();
    expect(screen.getByText("Asha Retail")).toBeInTheDocument();
    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
  });

  it("shows empty state when no notifications are available", () => {
    useListNotificationsQueryMock.mockReturnValue({
      data: { count: 0, next: null, previous: null, results: [] },
      isLoading: false,
      isFetching: false,
      refetch: jest.fn(),
    });
    render(<JewelleryNotificationsPage />);
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("refreshes notifications when refresh button is clicked", async () => {
    const refetch = jest.fn();
    const unwrap = jest.fn().mockResolvedValue({ synced_loans: 2 });
    const refresh = jest.fn(() => ({ unwrap }));
    useRefreshNotificationsMutationMock.mockReturnValue([refresh, { isLoading: false }]);
    useListNotificationsQueryMock.mockReturnValue({
      data: { count: 1, next: null, previous: null, results: [makeNotification()] },
      isLoading: false,
      isFetching: false,
      refetch,
    });
    render(<JewelleryNotificationsPage />);
    fireEvent.click(screen.getByTestId("jwl-notifications-refresh"));
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
      expect(refetch).toHaveBeenCalled();
    });
  });
});
