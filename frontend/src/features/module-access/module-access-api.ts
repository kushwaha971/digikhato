import { api } from "@/store/api";

export interface ModuleAccessRequest {
  id: number;
  module: string;
  module_label: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string;
  created_at: string;
  reviewed_at: string | null;
  user: {
    id: number;
    full_name: string;
    mobile_number: string;
    role: string;
    branch_name: string;
  };
  reviewed_by: { id: number; full_name: string } | null;
}

export interface TenantModuleStatus {
  module: string;
  label: string;
  enabled: boolean;
}

export interface TenantModulesResponse {
  tenant_id: number;
  modules: TenantModuleStatus[];
}

export const moduleAccessApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listModuleAccessRequests: builder.query<ModuleAccessRequest[], { status?: string } | void>({
      query: (params) => ({
        url: "users/modules/access-requests/",
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: ["ModuleAccessRequest"],
    }),
    approveModuleAccessRequest: builder.mutation<{ detail: string; module: string }, number>({
      query: (id) => ({
        url: `users/modules/access-requests/${id}/approve/`,
        method: "POST",
        successMessage: "Access granted successfully.",
      }),
      invalidatesTags: ["ModuleAccessRequest"],
    }),
    rejectModuleAccessRequest: builder.mutation<{ detail: string }, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `users/modules/access-requests/${id}/reject/`,
        method: "POST",
        data: { reason },
        successMessage: "Request rejected.",
      }),
      invalidatesTags: ["ModuleAccessRequest"],
    }),
    getTenantModules: builder.query<TenantModulesResponse, number>({
      query: (tenantId) => ({ url: `super-admin/tenants/${tenantId}/modules/` }),
      providesTags: (_result, _err, tenantId) => [{ type: "TenantModules", id: tenantId }],
    }),
    updateTenantModule: builder.mutation<TenantModulesResponse, { tenantId: number; module: string; action: "grant" | "revoke" }>({
      query: ({ tenantId, module, action }) => ({
        url: `super-admin/tenants/${tenantId}/modules/`,
        method: "POST",
        data: { module, action },
        successMessage: action === "grant" ? "Module access granted." : "Module access revoked.",
      }),
      invalidatesTags: (_result, _err, { tenantId }) => [{ type: "TenantModules", id: tenantId }],
    }),
  }),
});

export const {
  useListModuleAccessRequestsQuery,
  useApproveModuleAccessRequestMutation,
  useRejectModuleAccessRequestMutation,
  useGetTenantModulesQuery,
  useUpdateTenantModuleMutation,
} = moduleAccessApi;
