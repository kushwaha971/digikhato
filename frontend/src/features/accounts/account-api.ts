import { api } from "@/store/api";
import { PaginatedResponse } from "@/types/api";

export interface Account {
  id: number;
  uuid: string;
  borrower: number;
  amount_given: string | number;
  amount_paid: string | number;
  outstanding_amount: string | number;
  daily_interest_rate: string | number;
  duration_days?: number;
  start_date?: string;
  status: "active" | "closed" | "overdue";
  created_at?: string;
}

export interface AccountSummary {
  total_given: string | number;
  total_paid: string | number;
  total_outstanding: string | number;
  active_count: number;
  closed_count: number;
  overdue_count: number;
}

export const accountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query<PaginatedResponse<Account>, Record<string, unknown> | undefined>({
      query: (params) => ({ url: "accounts/", params }),
      providesTags: ["Account"],
    }),
    getAccount: builder.query<Account, string>({
      query: (id) => ({ url: `accounts/${id}/` }),
      providesTags: (result, error, id) => [{ type: "Account", id }],
    }),
    createAccount: builder.mutation<Account, Partial<Account>>({
      query: (body) => ({ url: "accounts/", method: "POST", data: body }),
      invalidatesTags: ["Account", "Dashboard"],
    }),
    updateAccount: builder.mutation<Account, { id: string } & Partial<Account>>({
      query: ({ id, ...body }) => ({ url: `accounts/${id}/`, method: "PATCH", data: body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Account", id }, "Account", "Dashboard"],
    }),
    deleteAccount: builder.mutation<void, string>({
      query: (id) => ({ url: `accounts/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Account", "Dashboard"],
    }),
    getAccountSummary: builder.query<AccountSummary, void>({
      query: () => ({ url: "accounts/summary/" }),
      providesTags: ["Account"],
    }),
    getDailyCollections: builder.query<PaginatedResponse<DailyCollection>, Record<string, unknown> | undefined>({
      query: (params) => ({ url: "daily-collections/", params }),
      providesTags: ["Collection"],
    }),
    createDailyCollection: builder.mutation<DailyCollection, Partial<DailyCollection>>({
      query: (body) => ({ url: "daily-collections/", method: "POST", data: body }),
      invalidatesTags: ["Collection", "Account", "Dashboard"],
    }),
    getTodayCollections: builder.query<PaginatedResponse<DailyCollection>, void>({
      query: () => ({ url: "daily-collections/today/" }),
      providesTags: ["Collection"],
    }),
    updateDailyCollection: builder.mutation<DailyCollection, { id: number; data: Partial<DailyCollection> }>({
      query: ({ id, data }) => ({ url: `daily-collections/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Collection", "Account", "Dashboard"],
    }),
  }),
});

export interface DailyCollection {
  id: number;
  account: number;
  account_uuid?: string;
  borrower?: number;
  date: string;
  payment: string | number;
  notes?: string;
}

export const {
  useGetAccountsQuery,
  useGetAccountQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetAccountSummaryQuery,
  useGetDailyCollectionsQuery,
  useCreateDailyCollectionMutation,
  useGetTodayCollectionsQuery,
  useUpdateDailyCollectionMutation,
} = accountApi;
