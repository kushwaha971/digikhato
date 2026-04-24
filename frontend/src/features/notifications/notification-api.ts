import { api } from "@/store/api";
import { PaginatedResponse } from "@/types/api";

export interface Notification {
  id: number;
  user: number;
  user_id: number;
  role: "super_admin" | "admin" | "collector" | "borrower";
  loan: number | null;
  loan_uuid: string | null;
  loan_code: string | null;
  loan_amount: string | null;
  borrower: number | null;
  borrower_uuid: string | null;
  borrower_name: string | null;
  type:
    | "collection_task"
    | "overdue_loan"
    | "follow_up"
    | "repayment_reminder"
    | "due_alert"
    | "overdue_alert"
    | "system_activity"
    | "escalation"
    | "system_update"
    | "loan_due_alert";
  message: string;
  redirect_target: string;
  due_date: string | null;
  is_read: boolean;
  is_active: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<PaginatedResponse<Notification>, { active?: boolean; unread?: boolean; page?: number; page_size?: number }>({
      query: (params) => ({
        url: "notifications/",
        params: {
          active: params.active !== false ? "true" : "false",
          unread: params.unread ? "true" : "false",
          page: params.page ?? 1,
          page_size: params.page_size ?? 20,
        },
      }),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<Notification, number>({
      query: (id) => ({ url: `notifications/${id}/read/`, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation<{ updated: number }, void>({
      query: () => ({ url: "notifications/mark-all-read/", method: "POST" }),
      invalidatesTags: ["Notification"],
    }),
    refreshNotifications: builder.mutation<{ synced_loans: number }, void>({
      query: () => ({ url: "notifications/refresh/", method: "POST", silent: true }),
      invalidatesTags: ["Notification"],
    }),
    seedTestNotification: builder.mutation<Notification[], { message?: string } | void>({
      query: (payload) => ({ url: "notifications/seed-test/", method: "POST", data: payload ?? {} }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useRefreshNotificationsMutation,
  useSeedTestNotificationMutation,
} = notificationApi;
