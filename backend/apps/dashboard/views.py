from datetime import date
from decimal import Decimal

from django.core.cache import cache
from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account
from apps.collections.models import Collection, DailyCollection
from apps.common.constants import RoleChoices
from apps.loans.alerts import derive_payment_status, overdue_loans_queryset, upcoming_due_loans_queryset
from apps.loans.models import Loan
from apps.users.views import get_effective_tenant

CACHE_TTL = 60  # seconds


def _build_cache_key(user, tenant):
    """Unique key per role+tenant so different collectors don't share a cache entry."""
    tenant_part = tenant.pk if tenant else "none"
    role_part = user.role
    # Collectors have per-agent scoping so include their ID
    agent_part = user.pk if user.role == RoleChoices.COLLECTOR else "all"
    return f"dashboard_summary:{role_part}:{tenant_part}:{agent_part}"


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tenant = get_effective_tenant(user)

        cache_key = _build_cache_key(user, tenant)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        loan_filter = {}
        collection_filter = {"date": date.today()}
        account_filter = {}
        daily_filter = {"date": date.today()}

        if tenant:
            loan_filter["borrower__tenant"] = tenant
            collection_filter["borrower__tenant"] = tenant
            account_filter["borrower__tenant"] = tenant
            daily_filter["account__borrower__tenant"] = tenant

        if user.role == RoleChoices.COLLECTOR:
            loan_filter["borrower__assigned_agent_id"] = user.id
            collection_filter["borrower__assigned_agent_id"] = user.id
            account_filter["borrower__assigned_agent_id"] = user.id
            daily_filter["account__borrower__assigned_agent_id"] = user.id

        elif user.role == RoleChoices.BORROWER:
            borrower_profile = getattr(user, "borrower_profile", None)
            if borrower_profile:
                account_filter["borrower"] = borrower_profile
                daily_filter["account__borrower"] = borrower_profile

        today_collection = (
            Collection.objects.filter(**collection_filter)
            .aggregate(total=Sum("amount_paid"))["total"] or Decimal("0")
        )
        today_daily = (
            DailyCollection.objects.filter(**daily_filter)
            .aggregate(total=Sum("payment"))["total"] or Decimal("0")
        )
        active_loans = Loan.objects.filter(status="active", **loan_filter)
        scoped_loans = Loan.objects.filter(**loan_filter)
        active_accounts = Account.objects.filter(status="active", **account_filter)
        overdue_loans = overdue_loans_queryset(scoped_loans, today=date.today())
        upcoming_due_loans = upcoming_due_loans_queryset(scoped_loans, days=5, today=date.today()).select_related("borrower")[:5]

        data = {
            "today_collection_total": str(today_collection),
            "today_daily_collection_total": str(today_daily),
            "total_outstanding": str(
                active_loans.aggregate(total=Sum("outstanding_balance"))["total"] or Decimal("0")
            ),
            "active_loans": active_loans.count(),
            "overdue_count": overdue_loans.count(),
            "upcoming_due_loans": [
                {
                    "id": loan.id,
                    "uuid": str(loan.uuid) if loan.uuid else None,
                    "loan_code": loan.loan_code,
                    "borrower_id": loan.borrower_id,
                    "borrower_uuid": str(loan.borrower.uuid) if loan.borrower.uuid else None,
                    "borrower_name": loan.borrower.name,
                    "loan_amount": str(loan.total_amount),
                    "outstanding_amount": str(loan.outstanding_balance),
                    "due_date": str(loan.due_date) if loan.due_date else None,
                    "payment_status": derive_payment_status(total_amount=loan.total_amount, paid_amount=loan.paid_amount),
                    "alert_active": loan.alert_active,
                }
                for loan in upcoming_due_loans
            ],
            "active_accounts": active_accounts.count(),
            "total_account_outstanding": str(
                active_accounts.aggregate(total=Sum("outstanding_amount"))["total"] or Decimal("0")
            ),
            "overdue_accounts": Account.objects.filter(status="overdue", **account_filter).count(),
        }

        cache.set(cache_key, data, CACHE_TTL)
        return Response(data)
