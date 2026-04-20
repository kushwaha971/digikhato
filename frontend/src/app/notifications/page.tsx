"use client";

import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/features/notifications/notification-api";
import { formatDateDMY } from "@/lib/format";

function NotificationCard({
  id,
  borrower_name,
  borrower,
  loan_code,
  loan_amount,
  due_date,
  message,
  is_read,
}: {
  id: number;
  borrower_name: string | null;
  borrower: number | null;
  loan_code: string | null;
  loan_amount: string | null;
  due_date: string | null;
  message: string;
  is_read: boolean;
}) {
  const [markRead] = useMarkNotificationReadMutation();

  const href = borrower ? `/borrowers/${borrower}` : "/borrowers";

  return (
    <div
      className={`app-panel p-4 border-l-4 ${is_read ? "border-l-transparent opacity-70" : "border-l-danger-500"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!is_read && (
              <span className="inline-block w-2 h-2 rounded-full bg-danger-500 flex-shrink-0" />
            )}
            <p className="font-semibold text-text text-sm truncate">{borrower_name ?? "Unknown borrower"}</p>
          </div>
          <p className="text-xs text-danger-600 dark:text-danger-400 font-medium mb-1">{message}</p>
          <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
            {loan_code && <span>Loan: {loan_code}</span>}
            {loan_amount && <span>Amount: ₹{Number(loan_amount).toLocaleString("en-IN")}</span>}
            {due_date && <span>Due: {formatDateDMY(due_date)}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Link href={href} onClick={() => { if (!is_read) markRead(id); }}>
            <Button size="sm" variant="outline" fullWidth={false}>View</Button>
          </Link>
          {!is_read && (
            <button
              onClick={() => markRead(id)}
              className="text-xs text-muted hover:text-text transition-colors"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useListNotificationsQuery({ active: true });
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <Screen
      title="Notifications"
      actions={
        unreadCount > 0 ? (
          <Button
            size="sm"
            variant="outline"
            fullWidth={false}
            onClick={() => markAllRead()}
            disabled={markingAll}
          >
            Mark all read
          </Button>
        ) : undefined
      }
    >
      {isLoading && <SkeletonList count={4} />}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <EmptyState
          title="No notifications"
          description="You're all caught up. Loan due alerts will appear here."
        />
      )}

      {!isLoading && notifications && notifications.length > 0 && (
        <div className="space-y-3">
          {unreadCount > 0 && (
            <p className="text-xs text-muted">{unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}</p>
          )}
          {notifications.map((n) => (
            <NotificationCard key={n.id} {...n} />
          ))}
        </div>
      )}
    </Screen>
  );
}
