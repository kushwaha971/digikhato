"use client";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import ModuleAccessPage from "@/app/module-access/page";
import { useAppSelector } from "@/store/hooks";
import { useRequestModuleAccessMutation } from "@/features/auth/auth-api";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/store/hooks", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("@/features/auth/auth-api", () => ({
  useRequestModuleAccessMutation: jest.fn(),
}));

const useAppSelectorMock = useAppSelector as jest.Mock;
const useRequestModuleAccessMutationMock = useRequestModuleAccessMutation as jest.Mock;

const requestMock = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({}) }));

function setupMocks(accessible_modules: string[] = []) {
  useAppSelectorMock.mockImplementation((selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        currentUser: {
          id: 1,
          mobile_number: "9999999999",
          full_name: "Test User",
          role: "admin",
          theme_preference: "system",
          onboarding_completed: true,
          accessible_modules,
          module_access_policy: {
            allow_request_access: true,
            requestable_modules: [],
          },
        },
      },
    })
  );
  useRequestModuleAccessMutationMock.mockReturnValue([requestMock, { isLoading: false }]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ModuleAccessPage", () => {
  it("renders 'No module access yet' heading when user has no accessible modules", () => {
    setupMocks([]);
    render(<ModuleAccessPage />);
    expect(screen.getByRole("heading", { name: /no module access yet/i })).toBeInTheDocument();
  });

  it("renders 'Request access' buttons for each module when user has no accessible modules", () => {
    setupMocks([]);
    render(<ModuleAccessPage />);
    const requestButtons = screen.getAllByRole("button", { name: /request access/i });
    expect(requestButtons.length).toBeGreaterThan(0);
  });

  it("dispatches request module access mutation when 'Request access' button is clicked", async () => {
    setupMocks([]);
    render(<ModuleAccessPage />);
    const requestButtons = screen.getAllByRole("button", { name: /request access/i });
    fireEvent.click(requestButtons[0]);
    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows 'Continue to Modules' link when user already has accessible modules", () => {
    setupMocks(["jewellery"]);
    render(<ModuleAccessPage />);
    expect(screen.getByRole("link", { name: /continue to modules/i })).toBeInTheDocument();
  });
});
