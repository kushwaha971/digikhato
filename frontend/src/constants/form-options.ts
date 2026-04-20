export const TEAM_MEMBER_ROLE_VALUES = ["borrower", "collector", "admin"] as const;

export type TeamMemberRole = (typeof TEAM_MEMBER_ROLE_VALUES)[number];

export const TEAM_MEMBER_ROLE_OPTIONS: ReadonlyArray<{ value: TeamMemberRole; label: string }> = [
  { value: "borrower", label: "Borrower" },
  { value: "collector", label: "Collector" },
  { value: "admin", label: "Admin" },
];

export type BorrowerStatusFilter = "" | "active" | "inactive";

export const BORROWER_STATUS_OPTIONS: ReadonlyArray<{ label: string; value: BorrowerStatusFilter }> = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];
