import { render, screen, fireEvent } from "@testing-library/react";

import AccountsPage from "@/app/jewellery/accounts/page";
import {
  useGetCoaTreeQuery,
  useListVouchersQuery,
  useGetTrialBalanceQuery,
  useCreateVoucherMutation,
  usePostVoucherMutation,
} from "@/store/jewellery-api";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/store/jewellery-api", () => ({
  useGetCoaTreeQuery: jest.fn(),
  useListVouchersQuery: jest.fn(),
  useGetTrialBalanceQuery: jest.fn(),
  useCreateVoucherMutation: jest.fn(),
  usePostVoucherMutation: jest.fn(),
}));

// Drawer uses createPortal — stub it so content renders inline in tests.
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

const useGetCoaTreeQueryMock = useGetCoaTreeQuery as jest.Mock;
const useListVouchersQueryMock = useListVouchersQuery as jest.Mock;
const useGetTrialBalanceQueryMock = useGetTrialBalanceQuery as jest.Mock;
const useCreateVoucherMutationMock = useCreateVoucherMutation as jest.Mock;
const usePostVoucherMutationMock = usePostVoucherMutation as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS = [
  {
    id: "acc-1",
    code: "1000",
    name: "Cash",
    account_type: "ASSET",
    parent_id: null,
    is_system: true,
    children: [
      {
        id: "acc-2",
        code: "1010",
        name: "Petty Cash",
        account_type: "ASSET",
        parent_id: "acc-1",
        is_system: true,
        children: [],
      },
    ],
  },
  {
    id: "acc-3",
    code: "3000",
    name: "Sales",
    account_type: "INCOME",
    parent_id: null,
    is_system: true,
    children: [],
  },
];

const MOCK_VOUCHER = {
  id: "vch-1",
  voucher_no: "VCH-001",
  voucher_date: "2026-05-01",
  voucher_type: "RECEIPT",
  narration: "Test",
  total_amount: "5000.00",
  status: "DRAFT",
  entries: [],
};

const MOCK_TRIAL_BALANCE = [
  {
    account_id: "acc-1",
    account_code: "1000",
    account_name: "Cash",
    debit_total: "5000.00",
    credit_total: "0.00",
    balance: "5000.00",
  },
  {
    account_id: "acc-3",
    account_code: "3000",
    account_name: "Sales",
    debit_total: "0.00",
    credit_total: "5000.00",
    balance: "-5000.00",
  },
];

// ─── Setup ────────────────────────────────────────────────────────────────────

function setupDefaults() {
  useGetCoaTreeQueryMock.mockReturnValue({ data: MOCK_ACCOUNTS, isLoading: false, isError: false });
  useListVouchersQueryMock.mockReturnValue({
    data: { results: [MOCK_VOUCHER], count: 1 },
    isLoading: false,
    isError: false,
  });
  useGetTrialBalanceQueryMock.mockReturnValue({ data: MOCK_TRIAL_BALANCE, isLoading: false, isFetching: false });
  useCreateVoucherMutationMock.mockReturnValue([jest.fn().mockResolvedValue({}), { isLoading: false }]);
  usePostVoucherMutationMock.mockReturnValue([jest.fn().mockResolvedValue({}), { isLoading: false }]);
}

function renderPage() {
  return render(<AccountsPage />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Accounts & Ledger page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("renders page title 'Accounts & Ledger'", () => {
    renderPage();
    expect(screen.getByText("Accounts & Ledger")).toBeInTheDocument();
  });

  it("COA tab shows account tree with nested children", () => {
    renderPage();

    // COA tab is active by default
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Petty Cash")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();

    // Account codes are shown
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("3000")).toBeInTheDocument();
  });

  it("COA tab shows account_type as Badge", () => {
    renderPage();
    // Multiple ASSET badges expected (for Cash and Petty Cash)
    const assetBadges = screen.getAllByText("ASSET");
    expect(assetBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("INCOME")).toBeInTheDocument();
  });

  it("Vouchers tab shows voucher list when switching to it", () => {
    renderPage();

    // Switch to vouchers tab
    fireEvent.click(screen.getByText("Vouchers"));

    expect(screen.getByText("VCH-001")).toBeInTheDocument();
    expect(screen.getByText("RECEIPT")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("New Voucher")).toBeInTheDocument();
  });

  it("Vouchers tab shows empty state when no vouchers", () => {
    useListVouchersQueryMock.mockReturnValue({
      data: { results: [], count: 0 },
      isLoading: false,
      isError: false,
    });

    renderPage();
    fireEvent.click(screen.getByText("Vouchers"));

    expect(screen.getByText("No vouchers found")).toBeInTheDocument();
  });

  it("Trial Balance tab shows table rows after switching to it", () => {
    // Pre-load query args by setting skip=false; we do this by calling Load
    renderPage();

    fireEvent.click(screen.getByText("Trial Balance"));

    // Click Load to trigger the query
    fireEvent.click(screen.getByText("Load"));

    expect(screen.getByText("Account Name")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("switching tabs changes visible content", () => {
    renderPage();

    // COA is default — account tree visible
    expect(screen.getByText("Cash")).toBeInTheDocument();

    // Switch to Vouchers
    fireEvent.click(screen.getByText("Vouchers"));
    expect(screen.getByText("VCH-001")).toBeInTheDocument();
    // COA content no longer rendered
    expect(screen.queryByText("Petty Cash")).not.toBeInTheDocument();

    // Switch to Trial Balance
    fireEvent.click(screen.getByText("Trial Balance"));
    expect(screen.getByText("Load")).toBeInTheDocument();
    // Voucher content no longer rendered
    expect(screen.queryByText("VCH-001")).not.toBeInTheDocument();
  });

  it("shows COA loading skeleton when data is fetching", () => {
    useGetCoaTreeQueryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();
    // SkeletonList renders multiple skeleton items
    const skeletons = document.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error empty state when COA fetch fails", () => {
    useGetCoaTreeQueryMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText("Failed to load accounts")).toBeInTheDocument();
  });
});
