from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.services import mark_all_notifications_read, mark_notification_read


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = Notification.objects.select_related("borrower", "loan").filter(user=self.request.user)
        active_only = self.request.query_params.get("active", "true").lower() != "false"
        unread_only = self.request.query_params.get("unread", "false").lower() == "true"

        if active_only:
            qs = qs.filter(is_active=True)
        if unread_only:
            qs = qs.filter(is_read=False)

        return qs.order_by("-created_at")


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
