"use client";

import { useMemo, useState } from "react";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  useAssignModuleTeamRoleMutation,
  useGetModuleTeamRolesQuery,
  useGetTeamMembersQuery,
  useRevokeModuleTeamRoleMutation,
} from "@/features/team/team-api";

const MODULE = "jewellery";

const JWL_ROLE_OPTIONS = [
  { value: "jwl_admin", label: "Admin" },
  { value: "jwl_manager", label: "Manager" },
  { value: "jwl_cashier", label: "Cashier" },
  { value: "jwl_salesperson", label: "Salesperson" },
  { value: "jwl_karigar_manager", label: "Karigar Manager" },
  { value: "jwl_pledge_officer", label: "Pledge Officer" },
  { value: "jwl_auditor", label: "Auditor" },
];

export default function JewelleryUsersRolesPage() {
  const { data: teamMembers = [] } = useGetTeamMembersQuery();
  const { data: roles = [], isLoading } = useGetModuleTeamRolesQuery(MODULE);
  const [assignRole, { isLoading: isAssigning }] = useAssignModuleTeamRoleMutation();
  const [revokeRole, { isLoading: isRevoking }] = useRevokeModuleTeamRoleMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleCode, setSelectedRoleCode] = useState(JWL_ROLE_OPTIONS[0].value);

  const roleRows = useMemo(() => {
    return roles.map((role) => {
      const member = teamMembers.find((m) => m.id === (role.user?.id ?? -1));
      return {
        ...role,
        userName: role.user?.full_name ?? member?.full_name ?? `User #${role.user?.id ?? "?"}`,
        userMobile: role.user?.mobile_number ?? member?.mobile_number ?? "",
      };
    });
  }, [roles, teamMembers]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    await assignRole({
      module: MODULE,
      user_id: Number(selectedUserId),
      role_code: selectedRoleCode,
      branch_name: "",
    }).unwrap();
    setModalOpen(false);
    setSelectedUserId("");
    setSelectedRoleCode(JWL_ROLE_OPTIONS[0].value);
  };

  const handleRevoke = async (roleId: number) => {
    await revokeRole({ module: MODULE, roleId }).unwrap();
  };

  return (
    <Screen
      title="Users & Roles"
      subtitle="Manage Jewellery (JWL) module access without affecting other modules."
      actions={(
        <Button size="sm" fullWidth={false} onClick={() => setModalOpen(true)}>
          Assign Role
        </Button>
      )}
    >
      {isLoading ? <div className="app-panel p-4 text-sm text-muted">Loading module roles…</div> : null}

      {!isLoading && roleRows.length === 0 ? (
        <EmptyState
          title="No JWL roles assigned yet"
          description="Assign module roles to team members to grant JWL feature access."
          action={{ label: "Assign Role", onClick: () => setModalOpen(true) }}
        />
      ) : null}

      {!isLoading && roleRows.length > 0 ? (
        <div className="space-y-3">
          {roleRows.map((role) => (
            <div key={role.id} className="app-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">{role.userName}</p>
                  <p className="text-xs text-muted">{role.userMobile}</p>
                  <p className="text-xs text-muted mt-1">Role: {role.role_code}</p>
                </div>
                <Button
                  size="xs"
                  variant="danger"
                  fullWidth={false}
                  onClick={() => handleRevoke(role.id)}
                  loading={isRevoking}
                >
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Assign JWL Role"
        description="This assignment affects only Jewellery module access."
        size="sm"
        footer={(
          <>
            <Button variant="secondary" size="sm" fullWidth={false} onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              fullWidth={false}
              onClick={handleAssign}
              loading={isAssigning}
              disabled={!selectedUserId || isAssigning}
            >
              Assign
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <Select
            label="Team member"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            <option value="">Select member</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} ({member.mobile_number})
              </option>
            ))}
          </Select>

          <Select
            label="JWL role"
            value={selectedRoleCode}
            onChange={(event) => setSelectedRoleCode(event.target.value)}
          >
            {JWL_ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </Screen>
  );
}
