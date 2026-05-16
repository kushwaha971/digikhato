"use client";

import { useMemo } from "react";
import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useRefreshNotificationsMutation,
  type Notification,
} from "@/features/notifications/notification-api";
import { ROUTES } from "@/lib/routes";
import { formatDateDMY } from "@/lib/format";

function resolveNotificationHref(notification: Notification) {
  if (notification.redirect_target?.startsWith("/")) return notification.redirect_target;
  return ROUTES.app.jewellery.dashboard;
}

export default function JewelleryNotificationsPage() {
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useListNotificationsQuery({ active: true, page: 1, page_size: 20 });
  const [refreshNotifications, refreshState] = useRefreshNotificationsMutation();
  const [markRead] = useMarkNotificationReadMutation();

  const notifications = data?.results ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const handleRefresh = async () => {
    try {
      await refreshNotifications().unwrap();
    } catch {
      // Keep refresh best-effort; still fetch latest records from API.
    }
    await refetch();
  };

  const handleOpen = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markRead(notification.id).unwrap();
      } catch {
        // Navigation should remain available even if mark-read fails.
      }
    }
  };

  return (
    <Screen
      title="Notifications"
      subtitle="Manual-refresh inbox for jewellery workflow alerts."
      backHref={ROUTES.app.jewellery.dashboard}
      actions={(
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          loading={refreshState.isLoading || isFetching}
          data-testid="jwl-notifications-refresh"
        >
          Refresh
        </Button>
      )}
    >
      {isLoading ? <SkeletonList count={4} /> : null}

      {!isLoading && notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="No active jewellery notifications found. Click Refresh to fetch latest records."
        />
      ) : null}

      {!isLoading && notifications.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={resolveNotificationHref(notification)}
              onClick={() => void handleOpen(notification)}
              className={[
                "app-panel block p-4 transition-colors",
                notification.is_read
                  ? "border-l-4 border-l-transparent"
                  : "border-l-4 border-l-danger-500 bg-danger-50/40 dark:bg-danger-900/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text truncate">
                  {notification.borrower_name || "System notification"}
                </p>
                {!notification.is_read ? (
                  <span className="inline-block h-2 w-2 rounded-full bg-danger-500" />
                ) : null}
              </div>
              <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatDateDMY(notification.created_at)}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </Screen>
  );
}
