import { api } from "@/store/api";
import { PaginatedResponse } from "@/types/api";

export interface Loan {
  id: number;
  uuid: string;
  loan_code?: string | null;
  borrower: number;
  borrower_uuid?: string;
  borrower_name: string;
  principal: string;
  interest_rate: string | null;
  interest_type: "flat";
  tenure_days: number | null;
  start_date: string;
  notes?: string;
  daily_emi: string;
  total_amount: string;
  paid_amount: string;
  outstanding_balance: string;
  status: "active" | "closed" | "overdue";
}

export const loanApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listLoans: builder.query<PaginatedResponse<Loan>, { status?: string; borrower?: number; search?: string; ordering?: string; page?: number }>({
      query: (params) => ({ url: "loans/", params }),
      providesTags: ["Loan"],
    }),
    createLoan: builder.mutation<Loan, Record<string, unknown>>({
      query: (data) => ({ url: "loans/", method: "POST", data }),
      invalidatesTags: ["Loan", "Dashboard"],
    }),
    updateLoan: builder.mutation<Loan, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `loans/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Loan", "Dashboard"],
    }),
    listOverdue: builder.query<{ results: Loan[] }, void>({
      query: () => ({ url: "loans/overdue/" }),
      providesTags: ["Loan"],
    }),
    getLoan: builder.query<Loan, string>({
      query: (id) => ({ url: `loans/${id}/` }),
      providesTags: ["Loan"],
    }),
    deleteLoan: builder.mutation<void, string>({
      query: (id) => ({ url: `loans/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Loan", "Dashboard"],
    }),
  }),
});

export const { useListLoansQuery, useCreateLoanMutation, useUpdateLoanMutation, useListOverdueQuery, useGetLoanQuery, useDeleteLoanMutation } = loanApi;
