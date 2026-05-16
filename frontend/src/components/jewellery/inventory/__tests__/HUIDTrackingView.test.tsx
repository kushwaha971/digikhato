import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { HUIDTrackingView } from "@/components/jewellery/inventory/HUIDTrackingView";
import { useListItemsQuery } from "@/store/jewellery-api";

jest.mock("next/link", () => {
  return function MockLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

jest.mock("@/store/jewellery-api", () => ({
  useListItemsQuery: jest.fn(),
}));

const useListItemsQueryMock = useListItemsQuery as jest.Mock;

function buildItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    sku: "SKU-1",
    barcode: "",
    huid: "AB1234",
    hallmark_status: "HUID_ASSIGNED",
    design_name: "Bracelet",
    metal_code: "GOLD",
    purity_code: "22K",
    net_wt: "8.2000",
    status: "IN_STOCK",
    ...overrides,
  };
}

describe("HUIDTrackingView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useListItemsQueryMock.mockReturnValue({ data: { results: [] }, isFetching: false });
  });

  it("shows empty state copy when no rows match", () => {
    render(<HUIDTrackingView />);

    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(screen.getByText("No inventory rows match the selected HUID filters.")).toBeInTheDocument();
  });

  it("normalizes search input to uppercase and sends search param", () => {
    render(<HUIDTrackingView />);

    fireEvent.change(screen.getByLabelText("Search HUID / SKU"), { target: { value: "ab1234" } });

    expect(screen.getByLabelText("Search HUID / SKU")).toHaveValue("AB1234");
    const latestCall = useListItemsQueryMock.mock.calls[useListItemsQueryMock.mock.calls.length - 1];
    expect(latestCall[0]).toMatchObject({ search: "AB1234", page_size: 200 });
  });

  it("renders inventory row details and open link", () => {
    useListItemsQueryMock.mockReturnValue({
      data: {
        results: [buildItem({ id: "item-2", sku: "SKU-2", design_name: "Gold Ring", net_wt: "3.8000" })],
      },
      isFetching: false,
    });

    render(<HUIDTrackingView />);

    expect(screen.getByText("SKU-2")).toBeInTheDocument();
    expect(screen.getByText("Gold Ring")).toBeInTheDocument();
    expect(screen.getByText("AB1234")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/jewellery/inventory/item-2");
  });

  it("shows No HUID badge for rows without a HUID", () => {
    useListItemsQueryMock.mockReturnValue({
      data: {
        results: [buildItem({ id: "item-3", huid: "", hallmark_status: "NOT_HALLMARKED" })],
      },
      isFetching: false,
    });

    render(<HUIDTrackingView />);

    expect(screen.getByText("No HUID")).toBeInTheDocument();
    expect(screen.getByText("NOT HALLMARKED")).toBeInTheDocument();
  });
});
