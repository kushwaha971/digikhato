import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import JewelleryUsersRolesPage from "@/app/jewellery/users-roles/page";
import {
  useAssignModuleTeamRoleMutation,
  useGetModuleTeamRolesQuery,
  useGetTeamMembersQuery,
  useRevokeModuleTeamRoleMutation,
} from "@/features/team/team-api";

jest.mock("@/features/team/team-api", () => ({
  useGetModuleTeamRolesQuery: jest.fn(),
  useAssignModuleTeamRoleMutation: jest.fn(),
  useRevokeModuleTeamRoleMutation: jest.fn(),
  useGetTeamMembersQuery: jest.fn(),
}));

const useGetModuleTeamRolesQueryMock = useGetModuleTeamRolesQuery as jest.Mock;
const useAssignModuleTeamRoleMutationMock = useAssignModuleTeamRoleMutation as jest.Mock;
const useRevokeModuleTeamRoleMutationMock = useRevokeModuleTeamRoleMutation as jest.Mock;
const useGetTeamMembersQueryMock = useGetTeamMembersQuery as jest.Mock;

const TEAM_MEMBERS = [
  { id: 1, full_name: "Alice Kumar", mobile_number: "9876543210" },
  { id: 2, full_name: "Bob Singh", mobile_number: "9876543211" },
];

const ROLE_ROWS = [
  {
    id: 10,
    module: "jewellery",
    role_code: "jwl_admin",
    branch_name: "Main",
    is_active: true,
    user: { id: 1, full_name: "Alice Kumar", mobile_number: "9876543210" },
  },
  {
    id: 11,
    module: "jewellery",
    role_code: "jwl_cashier",
    branch_name: "Main",
    is_active: true,
    user: { id: 2, full_name: "Bob Singh", mobile_number: "9876543211" },
  },
];

function setup() {
  return render(<JewelleryUsersRolesPage />);
}

describe("Jewellery Users & Roles page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGetTeamMembersQueryMock.mockReturnValue({ data: TEAM_MEMBERS });
    useGetModuleTeamRolesQueryMock.mockReturnValue({ data: ROLE_ROWS, isLoading: false });
    useAssignModuleTeamRoleMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
    useRevokeModuleTeamRoleMutationMock.mockReturnValue([jest.fn(), { isLoading: false }]);
  });

  it("renders the Users & Roles page title", () => {
    setup();
    expect(screen.getByText("Users & Roles")).toBeInTheDocument();
  });

  it("shows role rows with Badge when data is loaded", () => {
    setup();
    // Names appear
    expect(screen.getByText("Alice Kumar")).toBeInTheDocument();
    expect(screen.getByText("Bob Singh")).toBeInTheDocument();
    // Role badges displayed
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Cashier")).toBeInTheDocument();
  });

  it("shows empty state when no roles are assigned", () => {
    useGetModuleTeamRolesQueryMock.mockReturnValue({ data: [], isLoading: false });
    setup();
    expect(screen.getByText("No JWL roles assigned yet")).toBeInTheDocument();
  });

  it("shows loading skeleton while fetching", () => {
    useGetModuleTeamRolesQueryMock.mockReturnValue({ data: [], isLoading: true });
    setup();
    // SkeletonList renders divs with the "skeleton" class
    const skeletons = document.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("Assign Role button opens the assign modal", async () => {
    setup();
    // Modal title should not yet be visible (modal closed)
    expect(screen.queryByText("Assign JWL Role")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Assign Role" }));

    await waitFor(() => {
      expect(screen.getByText("Assign JWL Role")).toBeInTheDocument();
    });
    // Team member select is rendered
    expect(screen.getByLabelText("Team member")).toBeInTheDocument();
    expect(screen.getByLabelText("JWL role")).toBeInTheDocument();
  });

  it("revoke button opens confirm dialog and calls revokeModuleTeamRole on confirm", async () => {
    const revokeMock = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue(undefined) }));
    useRevokeModuleTeamRoleMutationMock.mockReturnValue([revokeMock, { isLoading: false }]);

    setup();

    // Click the first Revoke button (Alice)
    const revokeButtons = screen.getAllByRole("button", { name: "Revoke" });
    fireEvent.click(revokeButtons[0]);

    // ConfirmDialog appears
    await waitFor(() => {
      expect(screen.getByText("Revoke Role")).toBeInTheDocument();
    });

    // Click the confirm Revoke in the dialog (last button named "Revoke")
    const dialogRevokeButtons = screen.getAllByRole("button", { name: "Revoke" });
    fireEvent.click(dialogRevokeButtons[dialogRevokeButtons.length - 1]);

    await waitFor(() => {
      expect(revokeMock).toHaveBeenCalledWith({ module: "jewellery", roleId: 10 });
    });
  });
});
