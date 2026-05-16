import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import NewTransferPage from "@/app/jewellery/inventory/transfers/new/page";
import { useCreateTransferMutation } from "@/store/jewellery-api";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: pushMock })),
}));

jest.mock("@/store/jewellery-api", () => ({
  useCreateTransferMutation: jest.fn(),
}));

const useCreateTransferMutationMock = useCreateTransferMutation as jest.Mock;

describe("NewTransferPage transfer policy hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCreateTransferMutationMock.mockReturnValue([
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ id: "tr-1" }) })),
      { isLoading: false },
    ]);
  });

  it("blocks submit when source and destination branch are same", async () => {
    render(<NewTransferPage />);

    fireEvent.change(screen.getByLabelText("From branch"), { target: { value: "Main" } });
    fireEvent.change(screen.getByLabelText("To branch *"), { target: { value: "main" } });
    fireEvent.change(screen.getByLabelText("Item SKU / ID"), { target: { value: "item-1" } });
    fireEvent.change(screen.getByLabelText("Weight (g)"), { target: { value: "9.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Create transfer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Destination branch must be different from source branch."),
      ).toBeInTheDocument();
    });
  });

  it("submits valid transfer payload and routes back to list", async () => {
    const unwrap = jest.fn().mockResolvedValue({ id: "tr-2" });
    const createTransfer = jest.fn(() => ({ unwrap }));
    useCreateTransferMutationMock.mockReturnValue([createTransfer, { isLoading: false }]);

    render(<NewTransferPage />);

    fireEvent.change(screen.getByLabelText("From branch"), { target: { value: "Main" } });
    fireEvent.change(screen.getByLabelText("To branch *"), { target: { value: "Branch-2" } });
    fireEvent.change(screen.getByLabelText("Item SKU / ID"), { target: { value: "item-1" } });
    fireEvent.change(screen.getByLabelText("Weight (g)"), { target: { value: "9.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Create transfer" }));

    await waitFor(() => {
      expect(createTransfer).toHaveBeenCalledWith({
        from_branch: "Main",
        to_branch: "Branch-2",
        notes: "",
        lines: [{ item: "item-1", qty: 1, weight: "9.5" }],
      });
      expect(pushMock).toHaveBeenCalledWith("/jewellery/inventory/transfers");
    });
  });
});
