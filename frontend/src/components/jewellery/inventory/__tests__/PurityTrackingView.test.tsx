import { render, screen } from "@testing-library/react";

import { PurityTrackingView } from "@/components/jewellery/inventory/PurityTrackingView";
import { useGetLiveRatesQuery, useListItemPuritySummaryQuery, useListItemsQuery } from "@/store/jewellery-api";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
});

jest.mock("@/store/jewellery-api", () => ({
  useGetLiveRatesQuery: jest.fn(),
  useListItemPuritySummaryQuery: jest.fn(),
  useListItemsQuery: jest.fn(),
}));

const useGetLiveRatesQueryMock = useGetLiveRatesQuery as jest.Mock;
const useListItemPuritySummaryQueryMock = useListItemPuritySummaryQuery as jest.Mock;
const useListItemsQueryMock = useListItemsQuery as jest.Mock;

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    sku: "SKU-1",
    barcode: "",
    huid: "AB1234",
    hallmark_status: "HUID_ASSIGNED",
    design: "design-1",
    design_name: "Gold Ring",
    category_name: "Ring",
    metal: "metal-1",
    metal_code: "GOLD",
    purity: "purity-1",
    purity_code: "22K",
    gross_wt: "4.0000",
    net_wt: "3.8000",
    stone_wt: "0",
    charge_wt: "0",
    status: "IN_STOCK",
    location_bin: "",
    branch_name: "Main",
    created_at: "2026-05-09T10:00:00Z",
    ...overrides,
  };
}

describe("PurityTrackingView residual Feature-5 cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGetLiveRatesQueryMock.mockReturnValue({
      data: [],
      isFetching: false,
    });
    useListItemPuritySummaryQueryMock.mockReturnValue({
      data: [],
      isFetching: false,
    });
    useListItemsQueryMock.mockReturnValue({
      data: { results: [] },
      isFetching: false,
    });
  });

  it("TC-P11: all items same purity should render a single summary card", () => {
    useListItemPuritySummaryQueryMock.mockReturnValue({
      data: [
        {
          metal_code: "GOLD",
          purity_code: "22K",
          item_count: 3,
          gross_wt_total: "12.0000",
          net_wt_total: "11.4000",
          charge_wt_total: "0.2000",
        },
      ],
      isFetching: false,
    });
    useListItemsQueryMock.mockReturnValue({
      data: {
        results: [
          makeItem({ id: "item-1", sku: "SKU-1" }),
          makeItem({ id: "item-2", sku: "SKU-2" }),
          makeItem({ id: "item-3", sku: "SKU-3" }),
        ],
      },
      isFetching: false,
    });

    render(<PurityTrackingView />);

    expect(screen.getByText("GOLD 22K")).toBeInTheDocument();
    expect(screen.getAllByText("3 items")).toHaveLength(1);
  });

  it("TC-P12: empty inventory should show purity empty state without crash", () => {
    render(<PurityTrackingView />);

    expect(screen.getByText("No purity summary")).toBeInTheDocument();
    expect(screen.getByText("No in-stock inventory available for the selected filter.")).toBeInTheDocument();
  });

  it("TC-P13: renders summary and item list even when live rates are unavailable", () => {
    useListItemPuritySummaryQueryMock.mockReturnValue({
      data: [
        {
          metal_code: "GOLD",
          purity_code: "22K",
          item_count: 1,
          gross_wt_total: "4.0000",
          net_wt_total: "3.8000",
          charge_wt_total: "0.1000",
        },
      ],
      isFetching: false,
    });
    useListItemsQueryMock.mockReturnValue({
      data: { results: [makeItem()] },
      isFetching: false,
    });

    render(<PurityTrackingView />);

    expect(screen.getByText("GOLD 22K")).toBeInTheDocument();
    expect(screen.getByText("Net: 3.8000 g")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /SKU-1/i })).toHaveAttribute("href", "/jewellery/inventory/item-1");
  });

  it("keeps summary card copy stable when live rates are present", () => {
    useGetLiveRatesQueryMock.mockReturnValue({
      data: [{ metal: "GOLD", purity: "22K", sell_rate: "6200.00" }],
      isFetching: false,
    });
    useListItemPuritySummaryQueryMock.mockReturnValue({
      data: [
        {
          metal_code: "GOLD",
          purity_code: "22K",
          item_count: 1,
          gross_wt_total: "4.0000",
          net_wt_total: "3.8000",
          charge_wt_total: "0.1000",
        },
      ],
      isFetching: false,
    });
    useListItemsQueryMock.mockReturnValue({
      data: { results: [makeItem()] },
      isFetching: false,
    });

    render(<PurityTrackingView />);

    expect(screen.getByText("GOLD 22K")).toBeInTheDocument();
    expect(screen.getByText("Charge: 0.1000 g")).toBeInTheDocument();
  });
});
