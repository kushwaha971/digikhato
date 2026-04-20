from django.conf import settings
from django.db.models.deletion import ProtectedError
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from apps.common.audit import log_action
from apps.users.models import User
from apps.users.serializers import (
    MobileTokenObtainSerializer,
    PasswordChangeSerializer,
    ResetPasswordRequiredSerializer,
    SignupSerializer,
    UserPreferenceSerializer,
    UserSerializer,
)

NOT_FOUND = {"detail": "Not found."}
REFRESH_COOKIE = "refresh_token"
COOKIE_PATH = "/api/auth/"


def get_effective_tenant(user):
    """Returns the admin User who is the root tenant for this user."""
    if user.role == "admin":
        return user
    if user.role in ("collector", "borrower") and user.tenant:
        return user.tenant
    return None


def _set_refresh_cookie(response, token_value):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token_value,
        httponly=True,
        secure=not settings.DEBUG,   # HTTPS-only in production
        samesite="Lax",
        max_age=7 * 24 * 60 * 60,   # 7 days, matches SIMPLE_JWT setting
        path=COOKIE_PATH,
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(REFRESH_COOKIE, path=COOKIE_PATH)


def _build_auth_response(user, *, response_status=status.HTTP_200_OK):
    refresh = MobileTokenObtainSerializer.get_token(user)
    access = refresh.access_token
    response = Response(
        {
            "access": str(access),
            "user": UserSerializer(user).data,
        },
        status=response_status,
    )
    _set_refresh_cookie(response, str(refresh))
    return response


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MobileTokenObtainSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        response = _build_auth_response(serializer.user)

        log_action(request, "login", model_name="User",
                   object_id=serializer.user.pk,
                   detail=f"Login: {serializer.user.mobile_number}")
        return response


class CookieTokenRefreshView(APIView):
    """
    Reads the refresh token from the httpOnly cookie, issues a new access token.
    If ROTATE_REFRESH_TOKENS is True, also rotates the cookie.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            resp = Response(
                {"detail": "Session expired. Please log in again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            _clear_refresh_cookie(resp)
            return resp

        response = Response({"access": serializer.validated_data["access"]})

        # If rotation is enabled SimpleJWT returns a new refresh token
        if "refresh" in serializer.validated_data:
            _set_refresh_cookie(response, serializer.validated_data["refresh"])

        return response


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response = _build_auth_response(user, response_status=status.HTTP_201_CREATED)
        log_action(request, "signup", model_name="User",
                   object_id=user.pk, detail=f"Signup: {user.mobile_number}")
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Already expired or invalid — still log out cleanly

        log_action(request, "logout", model_name="User",
                   object_id=request.user.pk,
                   detail=f"Logout: {request.user.mobile_number}")

        response = Response({"detail": "Logged out."})
        _clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserPreferenceSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request, "update_profile", model_name="User",
                   object_id=request.user.pk, detail="Profile updated")
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.must_reset_password = False
        request.user.save(update_fields=["password", "must_reset_password"])
        log_action(request, "change_password", model_name="User",
                   object_id=request.user.pk, detail="Password changed")
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


class ResetPasswordRequiredView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResetPasswordRequiredSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.must_reset_password = False
        request.user.save(update_fields=["password", "must_reset_password"])

        log_action(
            request,
            "required_password_reset",
            model_name="User",
            object_id=request.user.pk,
            detail="Completed first-login password reset",
        )
        return Response({"detail": "Password reset successfully."}, status=status.HTTP_200_OK)


class TeamView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            qs = User.objects.filter(role="admin").order_by("full_name")
        elif user.role == "admin":
            qs = User.objects.filter(tenant=user).order_by("role", "full_name")
        else:
            return User.objects.none()

        role_filter = self.request.query_params.get("role")
        if role_filter:
            qs = qs.filter(role=role_filter)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role not in ("admin", "super_admin"):
            raise PermissionDenied("Only admins can create team members.")
        signup_serializer = SignupSerializer(data=request.data, context={"request": request})
        signup_serializer.is_valid(raise_exception=True)
        user = signup_serializer.save()

        if request.user.role == "admin":
            user.tenant = request.user

        user.created_by = request.user
        user.must_reset_password = True
        user.save(update_fields=["tenant", "created_by", "must_reset_password"])

        # Borrower login path: ensure a Borrower profile exists and is linked to this user.
        if user.role == "borrower":
            from apps.borrowers.models import Borrower

            tenant = user.tenant or get_effective_tenant(request.user)
            existing = Borrower.objects.filter(
                mobile_number=user.mobile_number,
                tenant=tenant,
            ).order_by("-updated_at").first()

            if existing:
                if existing.user_id is None:
                    existing.user = user
                    existing.save(update_fields=["user"])
            else:
                Borrower.objects.create(
                    name=user.full_name,
                    mobile_number=user.mobile_number,
                    address="",
                    user=user,
                    tenant=tenant,
                    status="active",
                )

        log_action(request, "create_team_member", model_name="User",
                   object_id=user.pk, detail=f"Created {user.role}: {user.mobile_number}")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class TeamMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _require_admin(self, request):
        if request.user.role not in ("admin", "super_admin"):
            raise PermissionDenied("Only admins can manage team members.")

    def _get_member(self, request, pk):
        if request.user.role == "super_admin":
            return User.objects.filter(pk=pk, role="admin").first()
        if request.user.role == "admin":
            return User.objects.filter(pk=pk, tenant=request.user).first()
        return None

    def get(self, request, pk):
        self._require_admin(request)
        member = self._get_member(request, pk)
        if not member:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(member).data)

    def patch(self, request, pk):
        self._require_admin(request)
        member = self._get_member(request, pk)
        if not member:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)
        serializer = UserPreferenceSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request, "update_team_member", model_name="User",
                   object_id=member.pk, detail=f"Updated: {member.mobile_number}")
        return Response(UserSerializer(member).data)

    def delete(self, request, pk):
        self._require_admin(request)
        if request.user.role == "super_admin":
            return Response(
                {"detail": "Super admin cannot delete tenant admins. Deactivate instead."},
                status=status.HTTP_403_FORBIDDEN,
            )
        member = self._get_member(request, pk)
        if not member:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)
        if member.id == request.user.id:
            return Response({"detail": "Cannot delete yourself."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Cannot delete this user because linked business records exist "
                        "(for example borrowers/loans/collections/accounts). "
                        "Deactivate the user instead."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        log_action(
            request,
            "delete_team_member",
            model_name="User",
            object_id=member.pk,
            detail=f"Deleted: {member.mobile_number}",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ToggleTeamMemberStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ("admin", "super_admin"):
            raise PermissionDenied("Only admins can change team member status.")

        if request.user.role == "super_admin":
            member = User.objects.filter(pk=pk, role="admin").first()
        else:
            member = User.objects.filter(pk=pk, tenant=request.user).first()

        if not member:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)
        if member.id == request.user.id:
            return Response({"detail": "Cannot deactivate yourself."}, status=status.HTTP_400_BAD_REQUEST)

        new_status = not member.is_active
        member.is_active = new_status
        member.save(update_fields=["is_active"])

        # SaaS cascade: deactivating an admin disables their whole tenant
        if member.role == "admin":
            User.objects.filter(tenant=member).update(is_active=new_status)

        action = "activate_member" if new_status else "deactivate_member"
        log_action(request, action, model_name="User",
                   object_id=member.pk,
                   detail=f"{'Activated' if new_status else 'Deactivated'}: {member.mobile_number}")
        return Response(UserSerializer(member).data)
