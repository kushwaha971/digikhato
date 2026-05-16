import { render, screen } from "@testing-library/react";

import JewelleryBarcodeRfidPage from "@/app/jewellery/barcode-rfid/page";
import { useListItemsQuery } from "@/store/jewellery-api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/store/jewellery-api", () => ({
  useListItemsQuery: jest.fn(),
}));

const useListItemsQueryMock = useListItemsQuery as jest.Mock;

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    sku: "SKU-001",
    barcode: "BC-12345",
    huid: "HUID-ABCDE",
    hallmark_status: "HUID_ASSIGNED",
    design: "des-1",
    design_name: "Ring Classic",
    category_name: "Rings",
    hsn_code: "7113",
    metal: "gold",
    metal_code: "AU",
    purity: "pur-1",
    purity_code: "18K",
    gross_wt: "5.00",
    net_wt: "4.80",
    stone_wt: "0.20",
    charge_wt: "4.80",
    status: "IN_STOCK",
    location_bin: "BIN-A1",
    branch_name: "Main Branch",
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function renderPage() {
  return render(<JewelleryBarcodeRfidPage />);
}

beforeEach(() => {
  useListItemsQueryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── Test 1: renders "Barcode & RFID" title ───────────────────────────────────

test("renders Barcode & RFID title", () => {
  renderPage();
  expect(screen.getByText("Barcode & RFID")).toBeInTheDocument();
  expect(screen.getByText("Manage item tags and prepare for hardware scanning.")).toBeInTheDocument();
});

// ─── Test 2: shows tagged items table when items have barcodes ────────────────

test("shows tagged items table when items have barcodes or HUIDs", () => {
  const item1 = makeItem({ id: "item-1", sku: "SKU-001", barcode: "BC-12345", huid: "HUID-ABCDE" });
  const item2 = makeItem({ id: "item-2", sku: "SKU-002", barcode: "", huid: "HUID-FGHIJ" });
  // item3 has neither barcode nor huid — should be filtered out
  const item3 = makeItem({ id: "item-3", sku: "SKU-003", barcode: "", huid: "" });

  useListItemsQueryMock.mockReturnValue({
    data: { count: 3, next: null, previous: null, results: [item1, item2, item3] },
    isLoading: false,
    isFetching: false,
    error: undefined,
  });

  renderPage();

  expect(screen.getByTestId("tagged-items-table")).toBeInTheDocument();
  expect(screen.getByText("SKU-001")).toBeInTheDocument();
  expect(screen.getByText("SKU-002")).toBeInTheDocument();
  // item3 should not appear (no barcode or huid)
  expect(screen.queryByText("SKU-003")).not.toBeInTheDocument();
  expect(screen.getByText("BC-12345")).toBeInTheDocument();
});

// ─── Test 3: shows empty state when no tagged items ───────────────────────────

test("shows empty state when no tagged items exist", () => {
  const untaggedItem = makeItem({ id: "item-1", sku: "SKU-001", barcode: "", huid: "" });

  useListItemsQueryMock.mockReturnValue({
    data: { count: 1, next: null, previous: null, results: [untaggedItem] },
    isLoading: false,
    isFetching: false,
    error: undefined,
  });

  renderPage();

  expect(screen.getByText("No tagged items yet")).toBeInTheDocument();
  expect(screen.getByText("Add a barcode or HUID when creating inventory items.")).toBeInTheDocument();
  expect(screen.queryByTestId("tagged-items-table")).not.toBeInTheDocument();
});

// ─── Test 4: Print Tags button is disabled (Phase 3) ─────────────────────────

test("Print Tags button is disabled (Phase 3)", () => {
  useListItemsQueryMock.mockReturnValue({
    data: { count: 0, next: null, previous: null, results: [] },
    isLoading: false,
    isFetching: false,
    error: undefined,
  });

  renderPage();

  const printBtn = screen.getByTestId("print-tags-btn");
  expect(printBtn).toBeDisabled();
  expect(screen.getByText("Bulk tag printing requires RFID hardware integration. Available in Phase 3.")).toBeInTheDocument();
});
