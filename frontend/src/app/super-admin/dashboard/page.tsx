"use client";

import Link from "next/link";
import { useState } from "react";
import { useGetTeamMembersQuery, useToggleTeamMemberStatusMutation } from "@/features/team/team-api";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { AuthUser } from "@/store/auth-slice";

export default function SuperAdminDashboardPage() {
  const { data: allMembers, isLoading } = useGetTeamMembersQuery();
  const [toggleStatus, { isLoading: isToggling }] = useToggleTeamMemberStatusMutation();
  const [confirmToggleTenant, setConfirmToggleTenant] = useState<AuthUser | null>(null);

  const tenants = (allMembers ?? []).filter((m) => m.role === "admin");
  const activeTenants = tenants.filter((m) => m.is_active !== false);
  const inactiveTenants = tenants.filter((m) => m.is_active === false);

  const handleToggleConfirmed = async () => {
    if (!confirmToggleTenant) return;
    await toggleStatus(confirmToggleTenant.id).unwrap();
    setConfirmToggleTenant(null);
  };

  return (
    <Screen
      title="Platform Overview"
      actions={
        <Link href="/super-admin/tenants/create">
          <Button size="sm" fullWidth={false}>+ New Tenant</Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Platform KPIs — only tenant-level counts, no financial data */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card-gradient p-4 rounded-2xl">
            <p className="text-white/70 text-xs font-medium">Total Tenants</p>
            <p className="text-white text-3xl font-bold mt-1">{isLoading ? "—" : tenants.length}</p>
            <p className="text-white/60 text-xs mt-1">registered businesses</p>
          </div>
          <div className="stat-card-success p-4 rounded-2xl">
            <p className="text-white/70 text-xs font-medium">Active</p>
            <p className="text-white text-3xl font-bold mt-1">{isLoading ? "—" : activeTenants.length}</p>
            <p className="text-white/60 text-xs mt-1">live tenants</p>
          </div>
          <div className="stat-card-warning p-4 rounded-2xl">
            <p className="text-neutral-900/80 text-xs font-medium">Inactive</p>
            <p className="text-neutral-900 text-3xl font-bold mt-1">{isLoading ? "—" : inactiveTenants.length}</p>
            <p className="text-neutral-900/60 text-xs mt-1">suspended</p>
          </div>
        </div>

        {/* Note: Financial data (borrowers, loans, collections) belongs to each tenant and is not visible here */}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/super-admin/tenants"
            className="app-panel p-4 card-clickable flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-text">Manage Tenants</p>
          </Link>
          <Link
            href="/super-admin/tenants/create"
            className="app-panel p-4 card-clickable flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-green-900/30 flex items-center justify-center text-success-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-text">New Tenant</p>
          </Link>
        </div>

        {/* Tenant list */}
        <div className="app-panel overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text">Tenant Accounts</h3>
            <Link href="/super-admin/tenants" className="text-sm text-primary-500 font-medium hover:underline">
              View all
            </Link>
          </div>

          {isLoading && <div className="p-4"><SkeletonList count={3} /></div>}

          {!isLoading && tenants.length === 0 && (
            <div className="p-6 text-center text-sm text-muted">No tenants yet. Create your first one.</div>
          )}

          {!isLoading && tenants.slice(0, 6).map((tenant) => (
            <div key={tenant.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${tenant.is_active === false ? "bg-neutral-400" : "bg-gradient-primary"}`}>
                {tenant.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{tenant.full_name}</p>
                {tenant.branch_name && <p className="text-xs text-muted truncate">{tenant.branch_name}</p>}
                <p className="text-xs text-muted">{tenant.mobile_number}</p>
              </div>
              <Badge variant={tenant.is_active === false ? "neutral" : "success"}>
                {tenant.is_active === false ? "Inactive" : "Active"}
              </Badge>
              <Link href="/super-admin/tenants">
                <Button size="xs" variant="secondary" fullWidth={false} type="button">
                  Edit
                </Button>
              </Link>
              <Button
                size="xs"
                variant={tenant.is_active === false ? "success" : "ghost"}
                fullWidth={false}
                type="button"
                onClick={() => setConfirmToggleTenant(tenant)}
              >
                {tenant.is_active === false ? "Activate" : "Deactivate"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmToggleTenant !== null}
        onClose={() => setConfirmToggleTenant(null)}
        onConfirm={handleToggleConfirmed}
        isLoading={isToggling}
        title={confirmToggleTenant?.is_active === false ? "Activate Tenant" : "Deactivate Tenant"}
        description={
          confirmToggleTenant?.is_active === false
            ? `Activating ${confirmToggleTenant?.full_name ?? "this tenant"} will restore tenant login and operations.`
            : `Deactivating ${confirmToggleTenant?.full_name ?? "this tenant"} will block tenant login while keeping all records safe.`
        }
        confirmLabel={confirmToggleTenant?.is_active === false ? "Activate" : "Deactivate"}
        confirmVariant={confirmToggleTenant?.is_active === false ? "success" : "danger"}
      />
    </Screen>
  );
}
