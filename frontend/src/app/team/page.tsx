"use client";

import { useState } from "react";
import { useFormik } from "formik";

import {
  FormErrorBanner,
  MobileNumberInput,
  PasswordInput,
  SelectInput,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  useCreateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useGetTeamMembersQuery,
  useToggleTeamMemberStatusMutation,
} from "@/features/team/team-api";
import type { AuthUser } from "@/store/auth-slice";
import {
  focusFirstInvalidField,
  mapBackendErrorsToFormik,
  normalizeUserValues,
  teamMemberInitialValues,
  teamMemberValidationSchema,
  trimObjectValues,
  type TeamMemberFormValues,
} from "@/validation";

type MemberRole = "admin" | "collector" | "borrower";

const ROLE_VARIANT: Record<MemberRole, "primary" | "success" | "neutral"> = {
  admin: "primary",
  collector: "success",
  borrower: "neutral",
};

const TEAM_FIELDS: Array<keyof TeamMemberFormValues> = ["full_name", "mobile_number", "password", "role", "branch_name"];

export default function TeamPage() {
  const { data: team, isLoading } = useGetTeamMembersQuery();
  const [createMember, { isLoading: isCreating }] = useCreateTeamMemberMutation();
  const [deleteMember] = useDeleteTeamMemberMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleTeamMemberStatusMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmToggleMember, setConfirmToggleMember] = useState<AuthUser | null>(null);

  const formik = useFormik<TeamMemberFormValues>({
    initialValues: { ...teamMemberInitialValues, role: "collector" },
    validationSchema: teamMemberValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const payload = normalizeUserValues(trimObjectValues(values));
        await createMember({
          full_name: payload.full_name,
          mobile_number: payload.mobile_number,
          password: payload.password,
          role: payload.role,
          branch_name: payload.branch_name,
        }).unwrap();
        helpers.resetForm({ values: { ...teamMemberInitialValues, role: "collector" } });
        setShowAddModal(false);
      } catch (error) {
        const parsed = mapBackendErrorsToFormik(error, helpers, TEAM_FIELDS);
        focusFirstInvalidField(Object.keys(parsed.fieldErrors));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    setShowAddModal(false);
    formik.resetForm({ values: { ...teamMemberInitialValues, role: "collector" } });
  };

  const handleDelete = async (id: number) => {
    await deleteMember(id).unwrap();
    setConfirmDeleteId(null);
  };

  const handleToggleConfirmed = async () => {
    if (!confirmToggleMember) return;
    await toggleStatus(confirmToggleMember.id).unwrap();
    setConfirmToggleMember(null);
  };

  const nameState = formikFieldState(formik, "full_name");
  const mobileState = formikFieldState(formik, "mobile_number");
  const passwordState = formikFieldState(formik, "password");
  const roleState = formikFieldState(formik, "role");

  return (
    <Screen
      title="Team"
      actions={
        <Button size="sm" fullWidth={false} onClick={() => setShowAddModal(true)}>
          + Add Member
        </Button>
      }
    >
      {isLoading ? <SkeletonList count={3} /> : null}

      {!isLoading && (!team || team.length === 0) ? (
        <EmptyState
          title="No team members yet"
          description="Add collectors to help manage your borrowers."
          action={{ label: "Add Member", onClick: () => setShowAddModal(true) }}
        />
      ) : null}

      {!isLoading && team && team.length > 0 ? (
        <div className="space-y-3">
          {team.map((member) => (
            <div key={member.id} className="app-panel p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${member.is_active === false ? "bg-neutral-400" : "bg-gradient-primary"}`}>
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-text text-sm">{member.full_name}</p>
                    {member.is_active === false ? <Badge variant="neutral" className="text-[10px]">Inactive</Badge> : null}
                  </div>
                  <p className="text-xs text-muted">{member.mobile_number}</p>
                </div>
                <Badge variant={ROLE_VARIANT[member.role as MemberRole] ?? "neutral"} className="capitalize">
                  {member.role}
                </Badge>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  size="xs"
                  variant={member.is_active === false ? "success" : "ghost"}
                  fullWidth={false}
                  onClick={() => setConfirmToggleMember(member)}
                  type="button"
                >
                  {member.is_active === false ? "Activate" : "Deactivate"}
                </Button>
                <Button
                  size="xs"
                  variant="danger"
                  fullWidth={false}
                  onClick={() => setConfirmDeleteId(member.id)}
                  type="button"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Modal
        open={showAddModal}
        onClose={handleClose}
        title="Add Team Member"
        description="Create a new account for your team member."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} size="sm" fullWidth={false}>Cancel</Button>
            <Button
              size="sm"
              fullWidth={false}
              loading={formik.isSubmitting || isCreating}
              type="submit"
              form="team-member-form"
              disabled={formik.isSubmitting || isCreating}
            >
              Create Member
            </Button>
          </>
        }
      >
        <form id="team-member-form" className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
          <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

          <TextInput
            label="Full Name"
            name="full_name"
            value={formik.values.full_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={nameState.touched}
            error={nameState.error}
            placeholder="Enter full name"
            required
          />

          <MobileNumberInput
            label="Mobile Number"
            name="mobile_number"
            value={formik.values.mobile_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={mobileState.touched}
            error={mobileState.error}
            placeholder="10-digit mobile"
            required
          />

          <PasswordInput
            label="Password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={passwordState.touched}
            error={passwordState.error}
            placeholder="Strong password"
            helperText="At least 8 chars, one uppercase, one number, one special char"
            required
          />

          <SelectInput
            label="Role"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={roleState.touched}
            error={roleState.error}
            required
          >
            <option value="collector">Collector</option>
            <option value="admin">Admin</option>
          </SelectInput>
        </form>
      </Modal>

      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Team Member"
        description="This will permanently remove the member. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" fullWidth={false} onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" fullWidth={false} onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)} type="button">
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">Are you sure you want to delete this team member?</p>
      </Modal>

      <ConfirmDialog
        open={confirmToggleMember !== null}
        onClose={() => setConfirmToggleMember(null)}
        onConfirm={handleToggleConfirmed}
        isLoading={isToggling}
        title={confirmToggleMember?.is_active === false ? "Activate Team Member" : "Deactivate Team Member"}
        description={
          confirmToggleMember?.is_active === false
            ? `Activating ${confirmToggleMember?.full_name ?? "this member"} will restore login and work assignment access.`
            : `Deactivating ${confirmToggleMember?.full_name ?? "this member"} will block login, while preserving existing records.`
        }
        confirmLabel={confirmToggleMember?.is_active === false ? "Activate" : "Deactivate"}
        confirmVariant={confirmToggleMember?.is_active === false ? "success" : "danger"}
      />
    </Screen>
  );
}
