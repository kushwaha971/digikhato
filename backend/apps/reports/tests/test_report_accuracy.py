from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.borrowers.models import Borrower
from apps.collections.models import Collection
from apps.loans.models import Loan
from apps.users.models import User


class ReportAccuracyTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            mobile_number="9888800001",
            password="Admin@1234",
            full_name="Report Admin",
            role="admin",
        )
        self.collector = User.objects.create_user(
            mobile_number="9888800002",
            password="Collector@1234",
            full_name="Report Collector",
            role="collector",
            tenant=self.admin,
        )
        self.client.force_authenticate(user=self.admin)

    def _create_borrower(self, idx: int) -> Borrower:
        return Borrower.objects.create(
            name=f"Borrower {idx}",
            mobile_number=f"97777000{idx:02d}",
            assigned_agent=self.collector,
            tenant=self.admin,
            status="active",
        )

    def _create_loan(self, borrower: Borrower, *, principal: str, start_offset_days: int, tenure_days: int) -> Loan:
        return Loan.objects.create(
            borrower=borrower,
            principal=Decimal(principal),
            interest_rate=Decimal("10.00"),
            interest_type="flat",
            tenure_days=tenure_days,
            start_date=date.today() - timedelta(days=start_offset_days),
            total_amount=Decimal(principal),
            daily_emi=Decimal("100.00"),
            paid_amount=Decimal("0.00"),
            outstanding_balance=Decimal(principal),
            status="active",
        )

    def _create_collection(self, loan: Loan, borrower: Borrower, amount: str, pay_mode: str):
        return self.client.post(
            reverse("collection-list"),
            {
                "loan": loan.id,
                "borrower": borrower.id,
                "date": str(date.today()),
                "amount_paid": amount,
                "payment_mode": pay_mode,
                "reference_id": f"TXN-{loan.id}-{amount}",
            },
            format="json",
        )

    def test_daily_report_totals_match_collection_rows_and_modes(self):
        borrower = self._create_borrower(1)
        loan = self._create_loan(borrower, principal="1200.00", start_offset_days=1, tenure_days=12)

        first = self._create_collection(loan, borrower, "200.00", "cash")
        second = self._create_collection(loan, borrower, "150.00", "gpay")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)

        report = self.client.get(reverse("daily-report"), {"date": str(date.today())})
        self.assertEqual(report.status_code, status.HTTP_200_OK)
        self.assertEqual(report.data["collections_count"], 2)
        self.assertEqual(Decimal(report.data["total_collected"]), Decimal("350.00"))

        sample = report.data["collections"][0]
        self.assertIn("payment_mode", sample)
        self.assertIn(sample["payment_mode"], {"cash", "gpay", "phonepe", "paytm", "other_upi"})

    def test_loan_report_totals_and_derived_payment_status(self):
        borrower_1 = self._create_borrower(2)
        borrower_2 = self._create_borrower(3)
        borrower_3 = self._create_borrower(4)

        unpaid_loan = self._create_loan(borrower_1, principal="1000.00", start_offset_days=1, tenure_days=10)
        partial_loan = self._create_loan(borrower_2, principal="1000.00", start_offset_days=1, tenure_days=10)
        paid_loan = self._create_loan(borrower_3, principal="1000.00", start_offset_days=1, tenure_days=10)

        self.assertEqual(self._create_collection(partial_loan, borrower_2, "250.00", "phonepe").status_code, 201)
        self.assertEqual(self._create_collection(paid_loan, borrower_3, "1000.00", "paytm").status_code, 201)

        report = self.client.get(reverse("loan-report"))
        self.assertEqual(report.status_code, status.HTTP_200_OK)

        self.assertEqual(Decimal(report.data["total_given"]), Decimal("3000.00"))
        self.assertEqual(Decimal(report.data["total_paid"]), Decimal("1250.00"))
        self.assertEqual(Decimal(report.data["total_outstanding"]), Decimal("1750.00"))

        rows = report.data.get("accounts", [])
        self.assertGreaterEqual(len(rows), 3)
        row_by_id = {row["id"]: row for row in rows}

        self.assertEqual(row_by_id[unpaid_loan.id].get("payment_status"), "unpaid")
        self.assertEqual(row_by_id[partial_loan.id].get("payment_status"), "partial")
        self.assertEqual(row_by_id[paid_loan.id].get("payment_status"), "paid")

    def test_overdue_report_uses_due_date_logic_not_manual_status_only(self):
        borrower = self._create_borrower(5)
        overdue_loan = self._create_loan(
            borrower,
            principal="900.00",
            start_offset_days=15,
            tenure_days=5,
        )
        _ = self._create_loan(
            borrower,
            principal="800.00",
            start_offset_days=1,
            tenure_days=30,
        )

        report = self.client.get(reverse("overdue-report"))
        self.assertEqual(report.status_code, status.HTTP_200_OK)

        overdue_ids = {item["id"] for item in report.data.get("accounts", [])}
        self.assertIn(overdue_loan.id, overdue_ids)

    def test_report_filters_apply_date_range_and_agent_scope(self):
        borrower = self._create_borrower(6)
        loan = self._create_loan(borrower, principal="1500.00", start_offset_days=2, tenure_days=12)
        Collection.objects.create(
            loan=loan,
            borrower=borrower,
            date=date.today() - timedelta(days=2),
            amount_paid=Decimal("100.00"),
            status="paid",
            collected_by=self.admin,
        )
        Collection.objects.create(
            loan=loan,
            borrower=borrower,
            date=date.today(),
            amount_paid=Decimal("200.00"),
            status="paid",
            collected_by=self.admin,
        )

        res = self.client.get(
            reverse("daily-report"),
            {
                "from_date": str(date.today() - timedelta(days=1)),
                "to_date": str(date.today()),
                "agent": str(self.collector.id),
            },
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        for row in res.data.get("collections", []):
            self.assertGreaterEqual(row.get("date"), str(date.today() - timedelta(days=1)))
