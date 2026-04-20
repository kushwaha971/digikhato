from datetime import date

from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reports.serializers import ReportFilterSerializer
from apps.reports.services import (
    apply_collection_filters,
    apply_loan_filters,
    decimal_or_zero,
    get_overdue_loans,
    get_scoped_querysets,
    serialize_collection_row,
    serialize_loan_row,
)


class BaseReportView(APIView):
    permission_classes = [IsAuthenticated]

    def _validated_params(self, request):
        serializer = ReportFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def _scope(self, request):
        return get_scoped_querysets(request.user)


class DailyReportView(BaseReportView):
    def get(self, request):
        _, collections_qs = self._scope(request)
        params = self._validated_params(request)
        target_date = params.get("date") or date.today()

        params_with_date = {**params, "date": target_date}
        qs = apply_collection_filters(collections_qs, params=params_with_date).order_by("-date", "-updated_at")

        agg = qs.aggregate(total=Sum("amount_paid"))
        collections_data = [serialize_collection_row(c) for c in qs]

        return Response(
            {
                "date": str(target_date),
                "total_collected": str(decimal_or_zero(agg["total"])),
                "collections_count": qs.count(),
                "collections": collections_data,
            }
        )


class LoanReportView(BaseReportView):
    def get(self, request):
        loans_qs, _ = self._scope(request)
        params = self._validated_params(request)

        loans_qs = apply_loan_filters(loans_qs, params=params).order_by("-updated_at")
        overdue_qs = get_overdue_loans(loans_qs, today=date.today())

        agg = loans_qs.aggregate(
            total_given=Sum("principal"),
            total_paid=Sum("paid_amount"),
            total_outstanding=Sum("outstanding_balance"),
        )

        loans_data = [serialize_loan_row(loan) for loan in loans_qs]

        payload = {
            "total_given": str(decimal_or_zero(agg["total_given"])),
            "total_paid": str(decimal_or_zero(agg["total_paid"])),
            "total_outstanding": str(decimal_or_zero(agg["total_outstanding"])),
            "active_count": loans_qs.filter(status="active").count(),
            "closed_count": loans_qs.filter(status="closed").count(),
            "overdue_count": overdue_qs.count(),
            "loans": loans_data,
            # Backward compatibility for existing UI mapping
            "accounts": loans_data,
        }
        return Response(payload)


class OverdueReportView(BaseReportView):
    def get(self, request):
        loans_qs, _ = self._scope(request)
        params = self._validated_params(request)

        overdue_qs = get_overdue_loans(apply_loan_filters(loans_qs, params=params), today=date.today()).order_by("-due_date", "-updated_at")
        agg = overdue_qs.aggregate(total=Sum("outstanding_balance"))

        overdue_rows = [serialize_loan_row(loan) for loan in overdue_qs]
        payload = {
            "overdue_count": overdue_qs.count(),
            "total_overdue_amount": str(decimal_or_zero(agg["total"])),
            "loans": overdue_rows,
            # Backward compatibility for existing UI mapping
            "accounts": overdue_rows,
        }
        return Response(payload)
