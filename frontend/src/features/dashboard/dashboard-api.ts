import { api } from "@/store/api";

export interface UpcomingDueLoan {
  id: number;
  uuid?: string | null;
  loan_code: string | null;
  borrower_id: number;
  borrower_uuid?: string | null;
  borrower_name: string;
  loan_amount: string;
  outstanding_amount: string;
  due_date: string | null;
  payment_status: "paid" | "partial" | "unpaid";
  alert_active: boolean;
}

export interface DashboardSummary {
  today_collection_total: string;
  total_outstanding: string;
  active_loans: number;
  overdue_count: number;
  upcoming_due_loans: UpcomingDueLoan[];
}

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => ({ url: "dashboard/summary/" }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
