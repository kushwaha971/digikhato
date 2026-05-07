from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import AccountViewSet
from apps.customer_ledger.views import LedgerCustomerViewSet
from apps.notes.views import NoteViewSet
from apps.borrowers.views import BorrowerViewSet
from apps.locations.views import LocationViewSet
from apps.collections.views import CollectionViewSet, DailyCollectionViewSet, TodayDueListView
from apps.dashboard.views import DashboardSummaryView
from apps.loans.views import LoanViewSet, OverdueLoanListView
from apps.onboarding.views import BusinessProfileView
from apps.reports.views import DailyReportView, LoanReportView, OverdueReportView
from apps.notifications.views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationRefreshView,
    NotificationReadView,
    NotificationSeedTestView,
)
from apps.common.permissions import IsAuthenticatedNonBorrowerWrite
from apps.users.views import (
    ChangePasswordView,
    CookieTokenRefreshView,
    LoginView,
    LogoutView,
    MeView,
    ModuleAccessRequestApproveView,
    ModuleAccessRequestListView,
    ModuleAccessRequestRejectView,
    ModuleRequestAccessView,
    ModuleSelfActivateView,
    ModuleTeamRoleDetailView,
    ModuleTeamRoleView,
    ResetPasswordRequiredView,
    SignupView,
    TeamMemberDetailView,
    TeamView,
    TenantModuleAccessView,
    ToggleTeamMemberStatusView,
    UserModuleRoleDetailView,
    UserModuleRoleView,
)


class GuardedLoanViewSet(LoanViewSet):
    permission_classes = [IsAuthenticatedNonBorrowerWrite]


class GuardedCollectionViewSet(CollectionViewSet):
    permission_classes = [IsAuthenticatedNonBorrowerWrite]


class GuardedAccountViewSet(AccountViewSet):
    permission_classes = [IsAuthenticatedNonBorrowerWrite]


class GuardedDailyCollectionViewSet(DailyCollectionViewSet):
    permission_classes = [IsAuthenticatedNonBorrowerWrite]


router = DefaultRouter()
router.register("borrowers", BorrowerViewSet, basename="borrower")
router.register("loans", GuardedLoanViewSet, basename="loan")
router.register("collections", GuardedCollectionViewSet, basename="collection")
router.register("accounts", GuardedAccountViewSet, basename="account")
router.register("daily-collections", GuardedDailyCollectionViewSet, basename="daily-collection")
router.register("ledger/customers", LedgerCustomerViewSet, basename="ledger-customer")
router.register("notes", NoteViewSet, basename="note")
router.register("locations", LocationViewSet, basename="location")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/signup/", SignupView.as_view(), name="signup"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("api/auth/reset-password-required/", ResetPasswordRequiredView.as_view(), name="reset-password-required"),
    path("api/onboarding/profile/", BusinessProfileView.as_view(), name="onboarding-profile"),
    path("api/dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("api/loans/overdue/", OverdueLoanListView.as_view(), name="overdue-loans"),
    path("api/collections/today-due/", TodayDueListView.as_view(), name="today-due"),
    path("api/reports/daily/", DailyReportView.as_view(), name="daily-report"),
    path("api/reports/loan/", LoanReportView.as_view(), name="loan-report"),
    path("api/reports/overdue/", OverdueReportView.as_view(), name="overdue-report"),
    path("api/users/team/", TeamView.as_view(), name="team"),
    path("api/users/team/<int:pk>/", TeamMemberDetailView.as_view(), name="team-member-detail"),
    path("api/users/team/<int:pk>/toggle-status/", ToggleTeamMemberStatusView.as_view(), name="team-member-toggle"),
    path("api/users/team/<int:pk>/module-roles/", UserModuleRoleView.as_view(), name="team-member-module-roles"),
    path("api/users/team/<int:pk>/module-roles/<int:role_id>/", UserModuleRoleDetailView.as_view(), name="team-member-module-role-detail"),
    path("api/users/<int:pk>/module-roles/", UserModuleRoleView.as_view(), name="user-module-roles"),
    path("api/users/<int:pk>/module-roles/<int:role_id>/", UserModuleRoleDetailView.as_view(), name="user-module-role-detail"),
    path("api/users/modules/activate/", ModuleSelfActivateView.as_view(), name="user-module-self-activate"),
    path("api/users/modules/request-access/", ModuleRequestAccessView.as_view(), name="user-module-request-access"),
    path("api/users/modules/<str:module>/team-roles/", ModuleTeamRoleView.as_view(), name="module-team-roles"),
    path("api/users/modules/<str:module>/team-roles/<int:role_id>/", ModuleTeamRoleDetailView.as_view(), name="module-team-role-detail"),
    path("api/users/modules/access-requests/", ModuleAccessRequestListView.as_view(), name="module-access-request-list"),
    path("api/users/modules/access-requests/<int:pk>/approve/", ModuleAccessRequestApproveView.as_view(), name="module-access-request-approve"),
    path("api/users/modules/access-requests/<int:pk>/reject/", ModuleAccessRequestRejectView.as_view(), name="module-access-request-reject"),
    path("api/super-admin/tenants/<int:tenant_id>/modules/", TenantModuleAccessView.as_view(), name="tenant-module-access"),
    path("api/notifications/", NotificationListView.as_view(), name="notification-list"),
    path("api/notifications/<int:pk>/read/", NotificationReadView.as_view(), name="notification-read"),
    path("api/notifications/mark-all-read/", NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"),
    path("api/notifications/refresh/", NotificationRefreshView.as_view(), name="notification-refresh"),
    path("api/notifications/seed-test/", NotificationSeedTestView.as_view(), name="notification-seed-test"),
    path("api/jwl/v1/", include("apps.jewellery.urls")),
    path("api/", include(router.urls)),
]
