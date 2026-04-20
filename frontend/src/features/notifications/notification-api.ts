import { api } from "@/store/api";

export interface Notification {
  id: number;
  user: number;
  loan: number | null;
  loan_code: string | null;
  loan_amount: string | null;
  borrower: number | null;
  borrower_name: string | null;
  type: "loan_due_alert";
  message: string;
  due_date: string | null;
  is_read: boolean;
  is_active: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<Notification[], { active?: boolean; unread?: boolean }>({
      query: (params) => ({
        url: "notifications/",
        params: {
          active: params.active !== false ? "true" : "false",
          unread: params.unread ? "true" : "false",
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
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
