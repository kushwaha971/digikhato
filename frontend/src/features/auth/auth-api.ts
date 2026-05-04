import { api } from "@/store/api";
import { AuthUser } from "@/store/auth-slice";

interface LoginRequest {
  mobile_number: string;
}

// Refresh token is now an httpOnly cookie — never returned in the response body.
interface LoginResponse {
  access: string;
  user: AuthUser;
}

interface SignupRequest {
  full_name: string;
  mobile_number: string;
  role: "super_admin" | "admin" | "collector" | "borrower";
  branch_name?: string;
}

interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

interface RefreshTokenResponse {
  access: string;
}

interface ActivateModuleRequest {
  module: string;
}

interface ActivateModuleResponse {
  module: string;
  feature_enabled: boolean;
}

interface RequestModuleAccessRequest {
  module: string;
  mode?: "request" | "self_onboard";
}

interface RequestModuleAccessResponse {
  detail?: string;
  module?: string;
  status?: string;
  request_id?: number | string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (data) => ({ url: "auth/login/", method: "POST", data }),
      invalidatesTags: ["Auth"],
    }),
    signup: builder.mutation<LoginResponse, SignupRequest>({
      query: (data) => ({ url: "auth/signup/", method: "POST", data, successMessage: "Account created successfully." }),
      invalidatesTags: ["Auth"],
    }),
    getMe: builder.query<AuthUser, void>({
      query: () => ({ url: "auth/me/" }),
      providesTags: ["Auth"],
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({ url: "auth/token/refresh/", method: "POST" }),
    }),
    updateMe: builder.mutation<AuthUser, Partial<AuthUser>>({
      query: (data) => ({ url: "auth/me/", method: "PATCH", data, successMessage: "Preferences updated." }),
      invalidatesTags: ["Auth"],
    }),
    changePassword: builder.mutation<{ detail: string }, ChangePasswordRequest>({
      query: (data) => ({ url: "auth/change-password/", method: "POST", data, successMessage: "Password changed successfully." }),
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation<{ detail: string }, void>({
      // Cookie is cleared server-side and blacklisted; no body needed.
      query: () => ({ url: "auth/logout/", method: "POST" }),
    }),
    activateModule: builder.mutation<ActivateModuleResponse, ActivateModuleRequest>({
      query: (data) => ({
        url: "users/modules/activate/",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Auth", "Onboarding"],
    }),
    requestModuleAccess: builder.mutation<RequestModuleAccessResponse, RequestModuleAccessRequest>({
      query: (data) => ({
        url: "users/modules/request-access/",
        method: "POST",
        data: {
          ...data,
          action: data.mode,
        },
        successMessage: "Access request submitted.",
      }),
      invalidatesTags: ["Auth", "Onboarding"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useActivateModuleMutation,
  useRequestModuleAccessMutation,
} = authApi;
