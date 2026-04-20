import { api } from "@/store/api";

export interface DailyCollectionItem {
  id: number;
  collection_code?: string;
  borrower_name: string;
  loan_id: number;
  payment: string;
  status: "paid" | "partial" | "missed";
  payment_mode?: string | null;
  reference_id?: string | null;
  date: string;
}

export interface DailyReportData {
  date: string;
  total_collected: string;
  collections_count: number;
  collections: DailyCollectionItem[];
}

export interface AccountSummaryItem {
  id: number;
  loan_code?: string;
  borrower_name: string;
  amount_given: string;
  amount_paid: string;
  outstanding_amount: string;
  status: "active" | "closed" | "overdue";
  start_date: string;
}

export interface AccountSummaryData {
  total_given: string;
  total_paid: string;
  total_outstanding: string;
  active_count: number;
  closed_count: number;
  overdue_count: number;
  accounts: AccountSummaryItem[];
}

export interface OverdueAccountItem {
  id: number;
  loan_code?: string;
  borrower_name: string;
  amount_given: string;
  outstanding_amount: string;
  daily_interest_rate: string;
  start_date: string;
}

export interface OverdueReportData {
  overdue_count: number;
  total_overdue_amount: string;
  accounts: OverdueAccountItem[];
}

export const reportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDailyReport: builder.query<DailyReportData, { date?: string }>({
      query: ({ date }) => ({ url: "reports/daily/", params: { date } }),
      providesTags: ["Report"],
    }),
    getLoanReport: builder.query<AccountSummaryData, void>({
      query: () => ({ url: "reports/loan/" }),
      providesTags: ["Report"],
    }),
    getOverdueReport: builder.query<OverdueReportData, void>({
      query: () => ({ url: "reports/overdue/" }),
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetDailyReportQuery, useGetLoanReportQuery, useGetOverdueReportQuery } = reportApi;
