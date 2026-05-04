from django.conf import settings
from django.db.models.deletion import ProtectedError
from django.db.models import Q
from rest_framework import generics, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from apps.common.audit import log_action
from apps.common.constants import JWL_ROLE_PERMISSIONS, JwlRoleCode, ModuleCode, RoleChoices
from apps.onboarding.models import BusinessProfile
from apps.users.models import User, UserModuleRole
from apps.users.serializers import (
    MobileTokenObtainSerializer,
    PasswordChangeSerializer,
    UserModuleRoleCreateSerializer,
    UserModuleRoleSerializer,
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


def _is_valid_module(module: str) -> bool:
    return module in ModuleCode.values


def _module_self_onboard_allowed(user, module: str) -> bool:
    if not _is_valid_module(module):
        return False
    return user.role in (RoleChoices.ADMIN, RoleChoices.COLLECTOR)


def _module_admin_flags(user, module: str) -> dict[str, bool]:
    if user.role == RoleChoices.SUPER_ADMIN:
        return {
            "can_manage_users": True,
            "can_assign_roles": True,
            "can_self_onboard": False,
        }

    can_manage = False
    if module == ModuleCode.LOANS:
        can_manage = user.role == RoleChoices.ADMIN
    elif module == ModuleCode.JEWELLERY:
        active_roles = UserModuleRole.objects.filter(
            user=user,
            module=ModuleCode.JEWELLERY,
            is_active=True,
        )
        for role in active_roles:
            if "jwl.admin.manage" in JWL_ROLE_PERMISSIONS.get(role.role_code, []):
                can_manage = True
                break

    return {
        "can_manage_users": can_manage,
        "can_assign_roles": can_manage,
        "can_self_onboard": _module_self_onboard_allowed(user, module),
    }


def _activate_module_for_user(*, actor, target_user, module: str) -> dict:
    tenant = get_effective_tenant(target_user) or target_user
    profile, _ = BusinessProfile.objects.get_or_create(owner=tenant)
    feature_flags = dict(profile.feature_flags or {})
    feature_flags[module] = True
    profile.feature_flags = feature_flags
    profile.save(update_fields=["feature_flags"])

    module_role_data = None
    if module == ModuleCode.JEWELLERY:
        granted_by = actor if actor and actor.is_authenticated else target_user
        role, created = UserModuleRole.objects.get_or_create(
            user=target_user,
            module=ModuleCode.JEWELLERY,
            role_code=JwlRoleCode.ADMIN,
            branch_name="",
            defaults={"granted_by": granted_by, "is_active": True},
        )
        if not created and not role.is_active:
            role.is_active = True
            role.save(update_fields=["is_active"])
        module_role_data = UserModuleRoleSerializer(role).data

    return {
        "module": module,
        "feature_enabled": True,
        "module_role": module_role_data,
    }


def _tenant_scoped_users(user):
    tenant = get_effective_tenant(user)
    if not tenant:
        return User.objects.none(), None
    qs = User.objects.filter(Q(pk=tenant.pk) | Q(tenant=tenant))
    return qs, tenant


def _serialize_module_role_with_user(role: UserModuleRole) -> dict:
    data = UserModuleRoleSerializer(role).data
    data["user"] = {
        "id": role.user_id,
        "full_name": role.user.full_name,
        "mobile_number": role.user.mobile_number,
        "role": role.user.role,
        "is_active": role.user.is_active,
    }
    return data


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


class UserModuleRoleView(APIView):
    """List and assign module roles for a team member.

    GET  /api/users/team/<pk>/module-roles/   → list active module roles
    POST /api/users/team/<pk>/module-roles/   → assign a new module role
    """
    permission_classes = [IsAuthenticated]

    def _require_admin(self, request):
        if request.user.role not in ("admin", "super_admin"):
            raise PermissionDenied("Only admins can manage module roles.")

    def _get_member(self, request, pk):
        if request.user.role == "super_admin":
            return User.objects.filter(pk=pk).first()
        return User.objects.filter(pk=pk, tenant=request.user).first()

    def get(self, request, pk):
        self._require_admin(request)
        member = self._get_member(request, pk)
        if not member:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)
        roles = UserModuleRole.objects.filter(user=member, is_active=True)
        return Response(UserModuleRoleSerializer(roles, many=True).data)

    def post(self, request, pk):
        self._require_admin(request)
        member = self._get_member(request, pk)
        if not member:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)

        serializer = UserModuleRoleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = UserModuleRole.objects.create(
            user=member,
            granted_by=request.user,
            **serializer.validated_data,
        )
        log_action(request, "assign_module_role", model_name="UserModuleRole",
                   object_id=role.pk,
                   detail=f"Assigned {role.module}:{role.role_code} to {member.mobile_number}")
        return Response(UserModuleRoleSerializer(role).data, status=status.HTTP_201_CREATED)


class UserModuleRoleDetailView(APIView):
    """Deactivate (soft-remove) a specific module role assignment.

    DELETE /api/users/team/<pk>/module-roles/<role_id>/
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, role_id):
        if request.user.role not in ("admin", "super_admin"):
            raise PermissionDenied("Only admins can manage module roles.")

        if request.user.role == "super_admin":
            role = UserModuleRole.objects.filter(pk=role_id, user_id=pk).first()
        else:
            role = UserModuleRole.objects.filter(pk=role_id, user_id=pk, user__tenant=request.user).first()

        if not role:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)

        role.is_active = False
        role.save(update_fields=["is_active"])
        log_action(request, "revoke_module_role", model_name="UserModuleRole",
                   object_id=role.pk,
                   detail=f"Revoked {role.module}:{role.role_code} from user {pk}")
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleSelfActivateView(APIView):
    """Activate a module for the current user's tenant and self-assign owner role when applicable.

    POST /api/users/modules/activate/
      body: { "module": "loans" | "jewellery" | ... }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in (RoleChoices.ADMIN, RoleChoices.COLLECTOR):
            raise PermissionDenied("Only admin or collector users can activate modules.")

        module = str(request.data.get("module", "")).strip()
        if not _is_valid_module(module):
            return Response(
                {"module": f"Invalid module. Choices: {ModuleCode.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = _activate_module_for_user(actor=request.user, target_user=request.user, module=module)
        tenant = get_effective_tenant(request.user) or request.user

        log_action(
            request,
            "activate_module",
            model_name="User",
            object_id=request.user.pk,
            detail=f"Activated module {module} for tenant {tenant.pk}",
        )

        return Response(payload, status=status.HTTP_200_OK)


class ModuleRequestAccessView(APIView):
    """
    POST /api/users/modules/request-access/
      body: { "module": "loans" | "udhaar" | "jewellery" }

    If self-onboarding is allowed for the requester and module, the module is
    activated immediately. Otherwise returns a pending approval response.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        module = str(request.data.get("module", "")).strip()
        action = str(request.data.get("action") or request.data.get("mode") or "request").strip().lower()
        if not _is_valid_module(module):
            return Response(
                {"module": f"Invalid module. Choices: {ModuleCode.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action not in ("request", "self_onboard"):
            return Response(
                {"action": "Invalid action. Use 'request' or 'self_onboard'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "self_onboard" and _module_self_onboard_allowed(request.user, module):
            payload = _activate_module_for_user(actor=request.user, target_user=request.user, module=module)
            payload["status"] = "activated"
            log_action(
                request,
                "request_module_access_auto_approved",
                model_name="User",
                object_id=request.user.pk,
                detail=f"Auto-activated module {module}",
            )
            return Response(payload, status=status.HTTP_200_OK)
        if action == "self_onboard":
            return Response(
                {
                    "module": module,
                    "status": "not_allowed",
                    "feature_enabled": False,
                    "detail": "Self onboarding is not allowed for this user or module.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        log_action(
            request,
            "request_module_access_pending",
            model_name="User",
            object_id=request.user.pk,
            detail=f"Requested module access for {module}",
        )
        return Response(
            {
                "module": module,
                "status": "pending_approval",
                "feature_enabled": False,
                "detail": "Access request submitted and awaiting module admin approval.",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class ModuleTeamRoleView(APIView):
    """
    Module-scoped role management for tenant users.

    GET  /api/users/modules/<module>/team-roles/
    POST /api/users/modules/<module>/team-roles/
      body: { "user_id": int, "role_code": str, "branch_name": str? }
    """

    permission_classes = [IsAuthenticated]

    @staticmethod
    def _assert_supported_module(module: str):
        if not _is_valid_module(module):
            raise serializers.ValidationError({"module": f"Invalid module. Choices: {ModuleCode.values}"})
        if module != ModuleCode.JEWELLERY:
            raise serializers.ValidationError(
                {"module": "Module role management is currently supported only for jewellery."}
            )

    def _assert_manage_access(self, request, module: str):
        flags = _module_admin_flags(request.user, module)
        if not flags["can_manage_users"]:
            raise PermissionDenied("You do not have module admin access for this module.")

    def get(self, request, module):
        self._assert_supported_module(module)
        self._assert_manage_access(request, module)

        tenant_users, _ = _tenant_scoped_users(request.user)
        if not tenant_users.exists():
            return Response([], status=status.HTTP_200_OK)

        roles = UserModuleRole.objects.filter(
            module=module,
            user__in=tenant_users,
            is_active=True,
        ).select_related("user", "granted_by")
        payload = [_serialize_module_role_with_user(role) for role in roles]
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request, module):
        self._assert_supported_module(module)
        self._assert_manage_access(request, module)

        tenant_users, _ = _tenant_scoped_users(request.user)
        if not tenant_users.exists():
            raise PermissionDenied("No tenant scope found for this user.")

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"user_id": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        member = tenant_users.filter(pk=user_id).first()
        if not member:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)

        payload = {
            "module": module,
            "role_code": request.data.get("role_code"),
            "branch_name": request.data.get("branch_name", ""),
        }
        serializer = UserModuleRoleCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        role, created = UserModuleRole.objects.get_or_create(
            user=member,
            module=module,
            role_code=validated["role_code"],
            branch_name=validated["branch_name"],
            defaults={"granted_by": request.user, "is_active": True},
        )
        if not created and not role.is_active:
            role.is_active = True
            role.granted_by = request.user
            role.save(update_fields=["is_active", "granted_by"])

        action = "assign_module_role" if created else "reactivate_module_role"
        log_action(
            request,
            action,
            model_name="UserModuleRole",
            object_id=role.pk,
            detail=f"Module {module}: assigned {role.role_code} to user {member.pk}",
        )
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        role = UserModuleRole.objects.select_related("user", "granted_by").get(pk=role.pk)
        return Response(_serialize_module_role_with_user(role), status=status_code)


class ModuleTeamRoleDetailView(APIView):
    """
    DELETE /api/users/modules/<module>/team-roles/<role_id>/
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, module, role_id):
        if not _is_valid_module(module):
            return Response(
                {"module": f"Invalid module. Choices: {ModuleCode.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if module != ModuleCode.JEWELLERY:
            return Response(
                {"module": "Module role management is currently supported only for jewellery."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        flags = _module_admin_flags(request.user, module)
        if not flags["can_assign_roles"]:
            raise PermissionDenied("You do not have module admin access for this module.")

        tenant_users, _ = _tenant_scoped_users(request.user)
        if not tenant_users.exists():
            raise PermissionDenied("No tenant scope found for this user.")

        role = UserModuleRole.objects.filter(
            pk=role_id,
            module=module,
            user__in=tenant_users,
            is_active=True,
        ).first()
        if not role:
            return Response(NOT_FOUND, status=status.HTTP_404_NOT_FOUND)

        role.is_active = False
        role.save(update_fields=["is_active"])
        log_action(
            request,
            "revoke_module_role",
            model_name="UserModuleRole",
            object_id=role.pk,
            detail=f"Module {module}: revoked {role.role_code} from user {role.user_id}",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
