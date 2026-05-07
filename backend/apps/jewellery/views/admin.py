from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.constants import P_ADMIN_MANAGE
from apps.jewellery.permissions import HasJewelleryPermission, JewelleryFeatureGuard
from apps.jewellery.serializers.admin import FeatureFlagsPatchSerializer, LockPeriodSerializer
from apps.jewellery.services.admin import (
    get_admin_control,
    list_trash,
    patch_feature_flags,
    restore_from_trash,
    set_lock_period,
)
from apps.users.views import get_effective_tenant


def _current_branch_name(request) -> str:
    return (request.headers.get("X-Branch-Name") or request.user.branch_name or "").strip()


class AdminFeatureFlagsView(APIView):
    """GET/PATCH /api/jwl/v1/admin/feature-flags/"""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard, HasJewelleryPermission(P_ADMIN_MANAGE)]

    def get(self, request):
        tenant = get_effective_tenant(request.user)
        branch_name = _current_branch_name(request)
        control = get_admin_control(tenant, branch_name)
        return Response(
            {
                "branch_name": branch_name,
                "feature_flags": dict((control.feature_flags if control else {}) or {}),
                "updated_at": control.updated_at if control else None,
            }
        )

    def patch(self, request):
        tenant = get_effective_tenant(request.user)
        branch_name = _current_branch_name(request)
        serializer = FeatureFlagsPatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        control = patch_feature_flags(
            tenant=tenant,
            branch_name=branch_name,
            patch=serializer.validated_data["feature_flags"],
            actor=request.user,
        )
        return Response(
            {
                "branch_name": control.branch_name,
                "feature_flags": control.feature_flags,
                "updated_at": control.updated_at,
            },
            status=status.HTTP_200_OK,
        )


class AdminTrashView(APIView):
    """GET /api/jwl/v1/admin/trash/"""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard, HasJewelleryPermission(P_ADMIN_MANAGE)]

    def get(self, request):
        tenant = get_effective_tenant(request.user)
        entity = (request.query_params.get("entity") or "").strip() or None
        limit = request.query_params.get("limit") or "100"
        try:
            rows = list_trash(tenant=tenant, entity=entity, limit=int(limit))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"count": len(rows), "results": rows}, status=status.HTTP_200_OK)


class AdminTrashRestoreView(APIView):
    """POST /api/jwl/v1/admin/trash/{entity}/{id}/restore/"""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard, HasJewelleryPermission(P_ADMIN_MANAGE)]

    def post(self, request, entity: str, object_id):
        tenant = get_effective_tenant(request.user)
        try:
            restored = restore_from_trash(
                tenant=tenant,
                entity=entity,
                object_id=object_id,
                restored_by=request.user,
            )
        except LookupError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "entity": entity,
                "id": str(restored.id),
                "restored_at": timezone.now(),
            },
            status=status.HTTP_200_OK,
        )


class AdminLockPeriodView(APIView):
    """POST /api/jwl/v1/admin/lock-period/"""

    permission_classes = [IsAuthenticated, JewelleryFeatureGuard, HasJewelleryPermission(P_ADMIN_MANAGE)]

    def post(self, request):
        tenant = get_effective_tenant(request.user)
        branch_name = _current_branch_name(request)
        serializer = LockPeriodSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lock_period_end = serializer.validated_data.get("lock_period_end")
        reason = serializer.validated_data.get("reason", "")
        if lock_period_end and not reason.strip():
            return Response(
                {"reason": "Reason is required when setting a lock period."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        control = set_lock_period(
            tenant=tenant,
            branch_name=branch_name,
            lock_period_end=lock_period_end,
            reason=reason.strip(),
            actor=request.user,
        )
        return Response(
            {
                "branch_name": control.branch_name,
                "lock_period_end": control.lock_period_end,
                "lock_period_reason": control.lock_period_reason,
                "updated_at": control.updated_at,
            },
            status=status.HTTP_200_OK,
        )
