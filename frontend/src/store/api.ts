import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { AxiosError, AxiosRequestConfig } from "axios";

import { performLogout } from "@/lib/auth/logout";
import { axiosClient } from "@/lib/axios";
import type { RootState } from "@/store";
import { setAccessToken } from "@/store/auth-slice";
import { showSnackbar } from "@/store/snackbar-slice";
import { parseBackendErrors } from "@/validation";

type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
};

type QueryError = { status?: number; data?: unknown };
const REAUTH_EXCLUDED_PATHS = ["auth/login/", "auth/signup/", "auth/token/refresh/"];

const shouldAttemptReauth = (url: string) => {
  const normalized = url.trim().toLowerCase().replace(/^\//, "");
  return !REAUTH_EXCLUDED_PATHS.some((path) => normalized.includes(path));
};

const axiosBaseQuery = (): BaseQueryFn<AxiosBaseQueryArgs, unknown, QueryError> =>
  async ({ url, method = "GET", data, params, successMessage, errorMessage, silent = false }, api) => {
    try {
      // Access token from Redux state (authoritative) or localStorage (rehydration)
      let token = (api.getState() as RootState).auth.accessToken;
      if (!token && typeof window !== "undefined") {
        token = window.localStorage.getItem("accessToken");
      }
      const result = await axiosClient({
        url,
        method,
        data,
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const normalizedUrl = url.toLowerCase();
      const isSilentEndpoint = normalizedUrl.includes("auth/token/refresh/") || silent;
      if (String(method).toUpperCase() !== "GET" && !isSilentEndpoint) {
        api.dispatch(showSnackbar({ message: successMessage ?? "Action completed successfully.", variant: "success" }));
      }
      return { data: result.data };
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 401) {
        return { error: { status: 401, data: err.response?.data } };
      }

      if (silent) {
        return { error: { status: err.response?.status, data: err.response?.data } };
      }

      const parsed = parseBackendErrors(err.response?.data);
      const backendMessage = parsed.allMessages.length ? parsed.allMessages.join(" | ") : null;
      const fallback = backendMessage ?? errorMessage ?? err.message ?? "Request failed. Please try again.";
      api.dispatch(showSnackbar({ message: fallback, variant: "error" }));
      return { error: { status: err.response?.status, data: err.response?.data } };
    }
  };

const rawQuery = axiosBaseQuery();

/**
 * Wraps the base query with automatic access-token refresh on 401.
 *
 * Flow:
 *  1. Make the original request with the current access token.
 *  2. If the server returns 401, POST /auth/token/refresh/ — the httpOnly
 *     refresh_token cookie is sent automatically (withCredentials: true).
 *  3. Store the new access token, retry the original request once.
 *  4. If refresh also fails (cookie expired / blacklisted), clear auth and
 *     redirect to /login.
 */
const baseQueryWithReauth: BaseQueryFn<AxiosBaseQueryArgs, unknown, QueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawQuery(args, api, extraOptions);

  if (result.error?.status === 401 && shouldAttemptReauth(args.url)) {
    // Silence the 401 snackbar — a new one will appear only if refresh also fails
    // Attempt silent token refresh — cookie is sent automatically
    const refreshResult = await rawQuery(
      { url: "auth/token/refresh/", method: "POST", silent: true },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const newAccess = (refreshResult.data as { access: string }).access;
      api.dispatch(setAccessToken(newAccess));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("accessToken", newAccess);
      }
      // Retry original request with the new token now in Redux state
      result = await rawQuery(args, api, extraOptions);
    } else {
      // Refresh token is expired or blacklisted — force logout
      await performLogout({
        dispatch: api.dispatch,
      });
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Borrower", "Loan", "Collection", "Dashboard", "Report", "Onboarding", "Account", "Team", "Notification", "CustomerLedger", "Note", "Location"],
  endpoints: () => ({}),
});
