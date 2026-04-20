from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.borrowers.models import Borrower
from apps.loans.models import Loan
from apps.users.models import User


class DueAlertNotificationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            mobile_number="9666600001",
            password="Admin@1234",
            full_name="Notify Admin",
            role="admin",
        )
        self.client.force_authenticate(user=self.admin)

    def _create_due_soon_loan(self):
        borrower = Borrower.objects.create(
            name="Due Soon Borrower",
            mobile_number="9666600011",
            status="active",
            tenant=self.admin,
        )
        loan = Loan.objects.create(
            borrower=borrower,
            principal=Decimal("1000.00"),
            interest_rate=Decimal("10.00"),
            interest_type="flat",
            tenure_days=10,
            start_date=date.today() - timedelta(days=5),
            total_amount=Decimal("1000.00"),
            daily_emi=Decimal("100.00"),
            paid_amount=Decimal("0.00"),
            outstanding_balance=Decimal("1000.00"),
            status="active",
        )
        return borrower, loan

    def _trigger_alert_sync(self):
        # Dashboard/read paths should keep alert notifications in sync.
        self.client.get(reverse("dashboard-summary"))

    def test_creates_due_alert_notification_with_expected_payload(self):
        borrower, loan = self._create_due_soon_loan()
        self._trigger_alert_sync()

        response = self.client.get(reverse("notification-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get("results", [])), 1)

        alerts = [n for n in response.data["results"] if n.get("type") == "loan_due_alert"]
        self.assertGreaterEqual(len(alerts), 1)
        matched = [n for n in alerts if n.get("loan") == loan.id and n.get("borrower") == borrower.id]
        self.assertGreaterEqual(len(matched), 1)

        sample = matched[0]
        for field in ("id", "user", "loan", "borrower", "type", "message", "is_read", "created_at"):
            self.assertIn(field, sample)

    def test_due_alert_is_deduplicated_for_same_loan(self):
        _, loan = self._create_due_soon_loan()
        self._trigger_alert_sync()
        self._trigger_alert_sync()
        self._trigger_alert_sync()

        response = self.client.get(reverse("notification-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        alerts_for_loan = [
            n for n in response.data.get("results", [])
            if n.get("type") == "loan_due_alert" and n.get("loan") == loan.id and n.get("is_active", True)
        ]
        self.assertEqual(len(alerts_for_loan), 1)

    def test_due_alert_gets_resolved_after_loan_closure(self):
        borrower, loan = self._create_due_soon_loan()
        self._trigger_alert_sync()

        create_collection = self.client.post(
            reverse("collection-list"),
            {
                "loan": loan.id,
                "borrower": borrower.id,
                "date": str(date.today()),
                "amount_paid": "1000.00",
                "payment_mode": "cash",
                "reference_id": "FULLPAY-1",
            },
            format="json",
        )
        self.assertEqual(create_collection.status_code, status.HTTP_201_CREATED)

        self._trigger_alert_sync()
        response = self.client.get(reverse("notification-list"), {"is_active": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        active_alerts = [
            n for n in response.data.get("results", [])
            if n.get("type") == "loan_due_alert" and n.get("loan") == loan.id
        ]
        self.assertEqual(active_alerts, [])
