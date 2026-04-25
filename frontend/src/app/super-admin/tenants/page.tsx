"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import {
  FormErrorBanner,
  TextInput,
  formikFieldState,
} from "@/components/forms/system";
import {
  useGetTeamMembersQuery,
  useToggleTeamMemberStatusMutation,
  useUpdateTeamMemberMutation,
} from "@/features/team/team-api";
import { ROUTES } from "@/lib/routes";
import { requiredTrimmedString } from "@/validation/common";
import type { AuthUser } from "@/store/auth-slice";

type EditValues = { full_name: string; branch_name: string };

const editSchema = Yup.object({
  full_name: requiredTrimmedString("Owner name", 2, 120),
  branch_name: Yup.string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .max(120, "Branch name must be at most 120 characters")
    .notRequired(),
});

export default function TenantsPage() {
  const router = useRouter();
  const { data: allMembers, isLoading } = useGetTeamMembersQuery();
  const [toggleStatus, { isLoading: isToggling }] = useToggleTeamMemberStatusMutation();
  const [updateMember, { isLoading: isUpdating }] = useUpdateTeamMemberMutation();

  const [search, setSearch] = useState("");
  const [confirmToggleMember, setConfirmToggleMember] = useState<AuthUser | null>(null);
  const [editMember, setEditMember] = useState<AuthUser | null>(null);

  const admins = (allMembers ?? [])
    .filter((m) => m.role === "admin")
    .filter(
      (m) =>
        !search ||
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.mobile_number.includes(search),
    );

  const handleToggleConfirmed = async () => {
    if (!confirmToggleMember) return;
    await toggleStatus(confirmToggleMember.id).unwrap();
    setConfirmToggleMember(null);
  };

  const openEdit = (member: AuthUser) => {
    setEditMember(member);
    formik.resetForm({
      values: {
        full_name: member.full_name,
        branch_name: member.branch_name ?? "",
      },
    });
  };

  const formik = useFormik<EditValues>({
    initialValues: { full_name: "", branch_name: "" },
    validationSchema: editSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, helpers) => {
      if (!editMember) return;
      helpers.setStatus(undefined);
      try {
        await updateMember({
          id: editMember.id,
          data: {
            full_name: values.full_name.trim(),
            branch_name: values.branch_name.trim() || undefined,
          },
        }).unwrap();
        setEditMember(null);
      } catch {
        helpers.setStatus({ formError: "Failed to save changes. Please try again." });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const nameState = formikFieldState(formik, "full_name");
  const branchState = formikFieldState(formik, "branch_name");

  const confirmToggleIsReactivation = confirmToggleMember?.is_active === false;

  return (
    <Screen
      title="Tenant Admins"
      actions={
        <Link href={`${ROUTES.app.superAdmin.tenants}/create`}>
          <Button size="sm" fullWidth={false}>+ New Tenant</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        <Input
          placeholder="Search by name or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading && <SkeletonList count={4} />}

        {!isLoading && admins.length === 0 && (
          <EmptyState
            title="No tenant admins found"
            description="Create a new tenant to get started."
            action={{ label: "New Tenant", onClick: () => router.push(`${ROUTES.app.superAdmin.tenants}/create`) }}
          />
        )}

        {!isLoading && admins.map((admin) => (
          <div key={admin.id} className="app-panel p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${admin.is_active === false ? "bg-neutral-400" : "bg-gradient-primary"}`}>
                {admin.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text text-sm">{admin.full_name}</p>
                  {admin.is_active === false && <Badge variant="neutral" className="text-[10px]">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted">{admin.mobile_number}</p>
                {admin.branch_name && <p className="text-xs text-muted">{admin.branch_name}</p>}
              </div>
              <Badge variant="primary">Admin</Badge>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
              <Button
                size="xs"
                variant="secondary"
                fullWidth={false}
                onClick={() => openEdit(admin)}
                type="button"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant={admin.is_active === false ? "success" : "ghost"}
                fullWidth={false}
                onClick={() => setConfirmToggleMember(admin)}
                type="button"
              >
                {admin.is_active === false ? "Activate" : "Deactivate"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Tenant Drawer */}
      <Drawer
        open={editMember !== null}
        onClose={() => setEditMember(null)}
        title="Edit Tenant Admin"
        footer={
          <>
            <Button variant="secondary" size="sm" fullWidth={false} onClick={() => setEditMember(null)} type="button">
              Cancel
            </Button>
            <Button
              size="sm"
              fullWidth={false}
              loading={formik.isSubmitting || isUpdating}
              disabled={formik.isSubmitting || isUpdating}
              type="submit"
              form="edit-tenant-form"
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-tenant-form" className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
          <p className="text-sm text-muted">
            Update the name or branch for <strong>{editMember?.full_name}</strong>.
            Mobile and password changes are handled separately.
          </p>

          <FormErrorBanner message={(formik.status as { formError?: string } | undefined)?.formError} />

          <TextInput
            label="Owner Name"
            name="full_name"
            value={formik.values.full_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={nameState.touched}
            error={nameState.error}
            placeholder="Full name"
            required
          />

          <TextInput
            label="Business / Branch Name (optional)"
            name="branch_name"
            value={formik.values.branch_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={branchState.touched}
            error={branchState.error}
            placeholder="e.g. Sharma Finance"
          />
        </form>
      </Drawer>

      {/* Activate / Deactivate confirmation */}
      <ConfirmDialog
        open={confirmToggleMember !== null}
        onClose={() => setConfirmToggleMember(null)}
        onConfirm={handleToggleConfirmed}
        isLoading={isToggling}
        title={confirmToggleIsReactivation ? "Activate Tenant" : "Deactivate Tenant"}
        description={
          confirmToggleIsReactivation
            ? `Activating ${confirmToggleMember?.full_name ?? "this admin"} will restore their platform access and allow them to manage borrowers and loans.`
            : `Deactivating ${confirmToggleMember?.full_name ?? "this admin"} will revoke their login access. Their data will be preserved.`
        }
        confirmLabel={confirmToggleIsReactivation ? "Activate" : "Deactivate"}
        confirmVariant={confirmToggleIsReactivation ? "success" : "danger"}
      />
    </Screen>
  );
}
