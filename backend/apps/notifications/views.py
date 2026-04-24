from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification, NotificationType
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.services import (
    mark_all_notifications_read,
    mark_notification_read,
    sync_due_alert_notifications_for_user,
)


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        qs = Notification.objects.select_related("borrower", "loan").filter(
            user=self.request.user,
            role=self.request.user.role,
        )
        active_only = self.request.query_params.get("active", "true").lower() != "false"
        unread_only = self.request.query_params.get("unread", "false").lower() == "true"

        if active_only:
            qs = qs.filter(is_active=True)
        if unread_only:
            qs = qs.filter(is_read=False)

        return qs.order_by("-created_at", "-id")


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk: int):
        notification = Notification.objects.filter(pk=pk, user=request.user).first()
        if not notification:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        serialized = NotificationSerializer(mark_notification_read(notification=notification))
        return Response(serialized.data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = mark_all_notifications_read(user=request.user)
        return Response({"updated": updated})


class NotificationRefreshView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        synced_loans = sync_due_alert_notifications_for_user(user=request.user)
        return Response({"synced_loans": synced_loans}, status=status.HTTP_200_OK)


class NotificationSeedTestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        today = timezone.localdate()

        if user.role == "collector":
            samples = [
                (NotificationType.COLLECTION_TASK, "Collection task assigned for today.", "/collections/today"),
                (NotificationType.OVERDUE_LOAN, "Overdue loan needs immediate follow-up.", "/overdue"),
                (NotificationType.FOLLOW_UP, "Follow up with borrower before due date.", "/borrowers"),
            ]
        elif user.role == "borrower":
            samples = [
                (NotificationType.REPAYMENT_REMINDER, "Repayment reminder for upcoming due.", "/portal"),
                (NotificationType.DUE_ALERT, "Your repayment is due today.", "/portal"),
                (NotificationType.OVERDUE_ALERT, "Your repayment is overdue.", "/portal"),
            ]
        else:
            samples = [
                (NotificationType.SYSTEM_ACTIVITY, "System activity: new collection posted.", "/dashboard"),
                (NotificationType.ESCALATION, "Escalation: overdue portfolio requires attention.", "/overdue"),
                (NotificationType.SYSTEM_UPDATE, "Overall update available for today.", "/reports"),
            ]

        created_ids = []
        for notif_type, message, redirect_target in samples:
            notification = Notification.objects.create(
                user=user,
                role=user.role,
                type=notif_type,
                message=message,
                redirect_target=redirect_target,
                due_date=today,
                is_read=False,
                is_active=True,
                external_key=f"seed:{user.id}:{notif_type}:{timezone.now().isoformat()}",
            )
            created_ids.append(notification.id)

        notifications = Notification.objects.filter(id__in=created_ids).order_by("-created_at")
        return Response(NotificationSerializer(notifications, many=True).data, status=status.HTTP_201_CREATED)
