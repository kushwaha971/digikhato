import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ItemSearchSelect } from "@/components/jewellery/billing/ItemSearchSelect";
import { useLazyScanItemQuery, useListItemsQuery } from "@/store/jewellery-api";

jest.mock("@/store/jewellery-api", () => ({
  useListItemsQuery: jest.fn(),
  useLazyScanItemQuery: jest.fn(),
}));

const useListItemsQueryMock = useListItemsQuery as jest.Mock;
const useLazyScanItemQueryMock = useLazyScanItemQuery as jest.Mock;

function buildItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "f7ff8f24-4a3a-4bb6-a0de-123456789abc",
    sku: "",
    barcode: "",
    huid: "",
    design_name: "Floral Ring",
    metal_code: "GOLD",
    purity_code: "22K",
    net_wt: "5.2500",
    ...overrides,
  };
}

describe("ItemSearchSelect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLazyScanItemQueryMock.mockReturnValue([
      jest.fn().mockImplementation(() => ({ unwrap: () => Promise.resolve(buildItem()) })),
      { isFetching: false },
    ]);
    useListItemsQueryMock.mockReturnValue({ data: { results: [] }, isFetching: false });
  });

  it("shows 2-char hint and keeps query skipped for single character", async () => {
    render(<ItemSearchSelect value="" onChange={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Inventory item"), { target: { value: "A" } });

    expect(await screen.findByText("Type at least 2 characters to search")).toBeInTheDocument();
    const latestCall = useListItemsQueryMock.mock.calls[useListItemsQueryMock.mock.calls.length - 1];
    expect(latestCall[1]).toMatchObject({ skip: true });
  });

  it("uses IN_STOCK for normal billing search and applies debounce", async () => {
    jest.useFakeTimers();
    render(<ItemSearchSelect value="" onChange={jest.fn()} invoiceType="TAX_INVOICE" />);

    fireEvent.change(screen.getByLabelText("Inventory item"), { target: { value: "RG" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const call = useListItemsQueryMock.mock.calls.find(
        ([params, opts]: [{ search?: string; status?: string; page_size?: number }, { skip?: boolean }]) =>
          params.search === "RG" && opts.skip === false,
      );
      expect(call).toBeTruthy();
    });

    const matchedCall = useListItemsQueryMock.mock.calls.find(
      ([params, opts]: [{ search?: string; status?: string; page_size?: number }, { skip?: boolean }]) =>
        params.search === "RG" && opts.skip === false,
    );

    expect(matchedCall?.[0]).toMatchObject({
      search: "RG",
      status: "IN_STOCK",
      page_size: 30,
    });

    jest.useRealTimers();
  });

  it("uses SOLD status for credit-note search", async () => {
    jest.useFakeTimers();
    render(<ItemSearchSelect value="" onChange={jest.fn()} invoiceType="CREDIT_NOTE" />);

    fireEvent.change(screen.getByLabelText("Inventory item"), { target: { value: "RG" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const call = useListItemsQueryMock.mock.calls.find(
        ([params, opts]: [{ search?: string; status?: string }, { skip?: boolean }]) =>
          params.search === "RG" && opts.skip === false,
      );
      expect(call).toBeTruthy();
    });

    const matchedCall = useListItemsQueryMock.mock.calls.find(
      ([params, opts]: [{ search?: string; status?: string }, { skip?: boolean }]) =>
        params.search === "RG" && opts.skip === false,
    );

    expect(matchedCall?.[0]).toMatchObject({ status: "SOLD" });
    jest.useRealTimers();
  });

  it("shows 30-result narrowing warning", async () => {
    const results = Array.from({ length: 30 }, (_, idx) =>
      buildItem({
        id: `item-${idx}`,
        sku: `SKU-${idx}`,
        design_name: `Ring ${idx}`,
      }),
    );
    useListItemsQueryMock.mockReturnValue({ data: { results }, isFetching: false });

    jest.useFakeTimers();
    render(<ItemSearchSelect value="" onChange={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Inventory item"), { target: { value: "RI" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText("Showing first 30 — type more to narrow results")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("uses readable fallback label and does not show UUID in dropdown", async () => {
    const uuid = "f7ff8f24-4a3a-4bb6-a0de-123456789abc";
    useListItemsQueryMock.mockReturnValue({ data: { results: [buildItem({ id: uuid })] }, isFetching: false });

    jest.useFakeTimers();
    render(<ItemSearchSelect value="" onChange={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Inventory item"), { target: { value: "FL" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText("— Floral Ring")).toBeInTheDocument();
    expect(screen.queryByText(uuid)).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
