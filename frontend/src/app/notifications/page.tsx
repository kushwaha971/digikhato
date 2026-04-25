"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  type Notification,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useRefreshNotificationsMutation,
} from "@/features/notifications/notification-api";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatDateDMY } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

function resolveNotificationHref(notification: Notification) {
  if (notification.redirect_target?.startsWith("/")) {
    return notification.redirect_target;
  }
  if (notification.borrower_uuid) {
    return ROUTES.app.loans.borrower(notification.borrower_uuid);
  }
  if (notification.loan_uuid) {
    return `${ROUTES.app.loans.root}/${notification.loan_uuid}`;
  }
  return ROUTES.app.loans.dashboard;
}

function NotificationCard({ notification, onOpen }: { notification: Notification; onOpen: (notification: Notification) => void }) {
  const unread = !notification.is_read;
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`app-panel w-full p-4 text-left transition-colors ${
        unread
          ? "border-l-4 border-l-danger-500 bg-danger-50/40 dark:bg-danger-900/10"
          : "border-l-4 border-l-transparent opacity-80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {unread && <span className="inline-block w-2 h-2 rounded-full bg-danger-500 flex-shrink-0" />}
            <p className="font-semibold text-text text-sm truncate">{notification.borrower_name ?? "Notification"}</p>
          </div>
          <p className="text-xs text-danger-600 dark:text-danger-400 font-medium mb-1">{notification.message}</p>
          <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
            {notification.loan_code && <span>Loan: {notification.loan_code}</span>}
            {notification.loan_amount && <span>Amount: ₹{Number(notification.loan_amount).toLocaleString("en-IN")}</span>}
            {notification.due_date && <span>Due: {formatDateDMY(notification.due_date)}</span>}
            <span>{formatDateDMY(notification.created_at)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { role } = useRoleAccess();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Notification[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isFetching, refetch } = useListNotificationsQuery({ active: true, page, page_size: 20 });
  const [markRead] = useMarkNotificationReadMutation();
  const [refreshNotifications, { isLoading: isRefreshingNotifications }] = useRefreshNotificationsMutation();

  useEffect(() => {
    if (!data?.results) return;
    setItems((prev) => {
      const base = page === 1 ? [] : prev;
      const seen = new Set(base.map((item) => item.id));
      const next = [...base];
      for (const row of data.results) {
        if (seen.has(row.id)) continue;
        next.push(row);
        seen.add(row.id);
      }
      return next;
    });
  }, [data, page]);

  const hasMore = Boolean(data?.next);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPage((prev) => prev + 1);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const unreadCount = items.filter((n) => !n.is_read).length;
  const backHref = useMemo(() => {
    if (role === "borrower") return ROUTES.app.portal;
    if (role === "super_admin") return ROUTES.app.superAdmin.dashboard;
    return ROUTES.app.loans.dashboard;
  }, [role]);

  const handleRefresh = async () => {
    try {
      await refreshNotifications().unwrap();
    } catch {
      // If sync fails, still reload what is already available.
    }
    setItems([]);
    if (page !== 1) {
      setPage(1);
      return;
    }
    await refetch();
  };

  const handleOpenNotification = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markRead(notification.id).unwrap();
        setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
      } catch {
        // Best-effort read status; still allow navigation.
      }
    }
    router.push(resolveNotificationHref(notification));
  };

  return (
    <Screen
      title="Notifications"
      backHref={backHref}
      actions={
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching || isRefreshingNotifications}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-colors disabled:opacity-60"
          aria-label="Refresh notifications"
          title="Refresh notifications"
        >
          <svg className={`w-4 h-4 ${isFetching || isRefreshingNotifications ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      }
    >
      {isLoading && page === 1 && <SkeletonList count={4} />}

      {!isLoading && items.length === 0 && (
        <EmptyState
          title="No notifications"
          description="You're all caught up. Alerts will appear here."
        />
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-3">
          {unreadCount > 0 && (
            <p className="text-xs text-muted">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
          )}
          {items.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onOpen={handleOpenNotification}
            />
          ))}
          {hasMore && <div ref={sentinelRef} className="h-1" />}
          {isFetching && page > 1 && (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
