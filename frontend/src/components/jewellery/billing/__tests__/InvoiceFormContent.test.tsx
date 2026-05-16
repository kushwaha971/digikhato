import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { InvoiceFormContent } from "@/components/jewellery/billing/InvoiceFormContent";
import {
  useCalculateInvoiceMutation,
  useCreateInvoiceMutation,
  useGetLiveRatesQuery,
  useIssueInvoiceMutation,
  useLazyScanItemQuery,
  useListInvoicesQuery,
  useListCustomersQuery,
  useListItemsQuery,
} from "@/store/jewellery-api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/store/jewellery-api", () => ({
  useGetLiveRatesQuery: jest.fn(),
  useCalculateInvoiceMutation: jest.fn(),
  useCreateInvoiceMutation: jest.fn(),
  useIssueInvoiceMutation: jest.fn(),
  useLazyScanItemQuery: jest.fn(),
  useListInvoicesQuery: jest.fn(),
  useListCustomersQuery: jest.fn(),
  useListItemsQuery: jest.fn(),
}));

const useGetLiveRatesQueryMock = useGetLiveRatesQuery as jest.Mock;
const useCalculateInvoiceMutationMock = useCalculateInvoiceMutation as jest.Mock;
const useCreateInvoiceMutationMock = useCreateInvoiceMutation as jest.Mock;
const useIssueInvoiceMutationMock = useIssueInvoiceMutation as jest.Mock;
const useLazyScanItemQueryMock = useLazyScanItemQuery as jest.Mock;
const useListInvoicesQueryMock = useListInvoicesQuery as jest.Mock;
const useListCustomersQueryMock = useListCustomersQuery as jest.Mock;
const useListItemsQueryMock = useListItemsQuery as jest.Mock;

function setupHookDefaults() {
  const calculateTrigger = jest.fn().mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }));
  const createTrigger = jest.fn().mockImplementation(() => ({ unwrap: () => Promise.resolve({ id: "draft-1" }) }));
  const issueTrigger = jest.fn().mockImplementation(() => ({ unwrap: () => Promise.resolve({ id: "issued-1" }) }));
  const scanTrigger = jest.fn().mockImplementation(() => ({ unwrap: () => Promise.resolve({ id: "item-1" }) }));

  useGetLiveRatesQueryMock.mockReturnValue({ data: [{ metal: "GOLD", purity: "22K", sell_rate: "6200" }] });
  useCalculateInvoiceMutationMock.mockReturnValue([calculateTrigger, { data: undefined, isLoading: false }]);
  useCreateInvoiceMutationMock.mockReturnValue([createTrigger, { isLoading: false }]);
  useIssueInvoiceMutationMock.mockReturnValue([issueTrigger, { isLoading: false }]);
  useLazyScanItemQueryMock.mockReturnValue([scanTrigger, { isFetching: false }]);
  useListInvoicesQueryMock.mockReturnValue({ data: { results: [] } });
  useListCustomersQueryMock.mockReturnValue({ data: { results: [] } });
  useListItemsQueryMock.mockReturnValue({ data: { results: [] } });

  return { calculateTrigger, createTrigger, issueTrigger };
}

function addValidLine() {
  fireEvent.click(screen.getByRole("button", { name: "Add line" }));
  fireEvent.change(screen.getByLabelText("Description"), { target: { value: "22K ring" } });
  fireEvent.change(screen.getByLabelText("Net Wt"), { target: { value: "5.2500" } });
}

describe("InvoiceFormContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    setupHookDefaults();
  });

  it("debounces calculate calls by 300ms", async () => {
    jest.useFakeTimers();
    const { calculateTrigger } = setupHookDefaults();

    render(<InvoiceFormContent />);

    fireEvent.click(screen.getByRole("button", { name: "Add line" }));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    calculateTrigger.mockClear();

    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Test line" } });
    fireEvent.change(screen.getByLabelText("Net Wt"), { target: { value: "1.0000" } });

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(calculateTrigger).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(calculateTrigger).toHaveBeenCalledTimes(1));
  });

  it("shows validation error for credit note without reference invoice", async () => {
    const { createTrigger } = setupHookDefaults();
    render(<InvoiceFormContent initialInvoiceType="CREDIT_NOTE" />);

    addValidLine();
    fireEvent.click(screen.getByRole("button", { name: "Save & issue" }));

    expect(await screen.findByText("Reference invoice is required for credit note.")).toBeInTheDocument();
    expect(createTrigger).not.toHaveBeenCalled();
  });

  it("submits credit note flow and issues invoice", async () => {
    const created = { id: "credit-draft-1" };
    const issued = { id: "credit-issued-1", status: "ISSUED" };
    const onSuccess = jest.fn();
    const createTrigger = jest.fn().mockImplementation(() => ({ unwrap: () => Promise.resolve(created) }));
    const issueTrigger = jest.fn().mockImplementation(() => ({ unwrap: () => Promise.resolve(issued) }));

    useCreateInvoiceMutationMock.mockReturnValue([createTrigger, { isLoading: false }]);
    useIssueInvoiceMutationMock.mockReturnValue([issueTrigger, { isLoading: false }]);

    render(
      <InvoiceFormContent
        initialInvoiceType="CREDIT_NOTE"
        initialReferenceInvoiceId="inv-original-12"
        onSuccess={onSuccess}
      />,
    );

    addValidLine();
    fireEvent.click(screen.getByRole("button", { name: "Save & issue" }));

    await waitFor(() => expect(createTrigger).toHaveBeenCalledTimes(1));
    const payload = createTrigger.mock.calls[0][0];
    expect(payload.invoice_type).toBe("CREDIT_NOTE");
    expect(payload.reference_invoice).toBe("inv-original-12");
    await waitFor(() => expect(issueTrigger).toHaveBeenCalledWith("credit-draft-1"));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(issued));
  });

  it("surfaces create failure and allows retry", async () => {
    const onSuccess = jest.fn();
    const created = { id: "draft-retry-1" };
    const createTrigger = jest
      .fn()
      .mockImplementationOnce(() => ({ unwrap: () => Promise.reject(new Error("network")) }))
      .mockImplementationOnce(() => ({ unwrap: () => Promise.resolve(created) }));

    useCreateInvoiceMutationMock.mockReturnValue([createTrigger, { isLoading: false }]);

    render(<InvoiceFormContent onSuccess={onSuccess} />);

    addValidLine();

    const saveDraftButton = screen.getByRole("button", { name: "Save draft" });
    fireEvent.click(saveDraftButton);

    expect(await screen.findByText("Could not save invoice. Check values and try again.")).toBeInTheDocument();
    expect(saveDraftButton).toBeEnabled();

    fireEvent.click(saveDraftButton);
    await waitFor(() => expect(createTrigger).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(created));
  });

  it("disables submit buttons while create is loading", () => {
    useCreateInvoiceMutationMock.mockReturnValue([jest.fn(), { isLoading: true }]);

    render(<InvoiceFormContent />);

    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save & issue" })).toBeDisabled();
  });

  it("supports mobile-safe collapse and expand interaction on line item", () => {
    render(<InvoiceFormContent />);

    fireEvent.click(screen.getByRole("button", { name: "Add line" }));

    const collapseButton = screen.getByRole("button", { name: "Collapse line 1" });
    fireEvent.click(collapseButton);

    expect(screen.queryByLabelText("HSN Code")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand line 1" }));

    expect(screen.getByLabelText("HSN Code")).toBeInTheDocument();
  });
});
