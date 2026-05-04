import { api } from "@/store/api";
import type { TeamMemberRole } from "@/constants/form-options";
import type { AuthUser } from "@/store/auth-slice";

export interface CreateTeamMemberRequest {
  full_name: string;
  mobile_number: string;
  role: TeamMemberRole;
  branch_name?: string;
}

export interface ModuleTeamRole {
  id: number;
  module: string;
  role_code: string;
  branch_name: string;
  is_active: boolean;
  user?: AuthUser;
  granted_by?: number | null;
}

export interface AssignModuleRoleRequest {
  module: string;
  user_id: number;
  role_code: string;
  branch_name?: string;
}

export const teamApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTeamMembers: builder.query<AuthUser[], void>({
      query: () => ({ url: "users/team/" }),
      transformResponse: (response: AuthUser[] | { results?: AuthUser[] }) => {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.results)) return response.results;
        return [];
      },
      providesTags: ["Team"],
    }),
    createTeamMember: builder.mutation<AuthUser, CreateTeamMemberRequest>({
      query: (body) => ({ url: "users/team/", method: "POST", data: body }),
      invalidatesTags: ["Team"],
    }),
    updateTeamMember: builder.mutation<AuthUser, { id: number; data: Partial<AuthUser> }>({
      query: ({ id, data }) => ({ url: `users/team/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Team"],
    }),
    deleteTeamMember: builder.mutation<void, number>({
      query: (id) => ({ url: `users/team/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Team"],
    }),
    toggleTeamMemberStatus: builder.mutation<AuthUser, number>({
      query: (id) => ({ url: `users/team/${id}/toggle-status/`, method: "POST" }),
      invalidatesTags: ["Team"],
    }),
    getModuleTeamRoles: builder.query<ModuleTeamRole[], string>({
      query: (module) => ({ url: `users/modules/${module}/team-roles/` }),
      providesTags: ["Team"],
    }),
    assignModuleTeamRole: builder.mutation<ModuleTeamRole, AssignModuleRoleRequest>({
      query: ({ module, ...data }) => ({
        url: `users/modules/${module}/team-roles/`,
        method: "POST",
        data,
      }),
      invalidatesTags: ["Team", "Auth"],
    }),
    revokeModuleTeamRole: builder.mutation<void, { module: string; roleId: number }>({
      query: ({ module, roleId }) => ({
        url: `users/modules/${module}/team-roles/${roleId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Team", "Auth"],
    }),
  }),
});

export const {
  useGetTeamMembersQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useToggleTeamMemberStatusMutation,
  useGetModuleTeamRolesQuery,
  useAssignModuleTeamRoleMutation,
  useRevokeModuleTeamRoleMutation,
} = teamApi;
