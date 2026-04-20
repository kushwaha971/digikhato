from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.borrowers.models import Borrower
from apps.loans.models import Loan
from apps.users.models import User


class CollectionRecalculationIntegrityTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            mobile_number="9777700011",
            password="Admin@1234",
            full_name="Collection Admin",
            role="admin",
        )
        self.client.force_authenticate(user=self.admin)

        self.borrower = Borrower.objects.create(
            name="Collection Borrower",
            mobile_number="9777700012",
            status="active",
            tenant=self.admin,
        )
        self.loan = Loan.objects.create(
            borrower=self.borrower,
            principal=Decimal("1000.00"),
            interest_rate=Decimal("10.00"),
            interest_type="flat",
            tenure_days=10,
            start_date=date.today(),
            total_amount=Decimal("1000.00"),
            daily_emi=Decimal("100.00"),
            paid_amount=Decimal("0.00"),
            outstanding_balance=Decimal("1000.00"),
            status="active",
        )

    def _create_collection(self, amount: str, mode: str, ref: str = ""):
        return self.client.post(
            reverse("collection-list"),
            {
                "loan": self.loan.id,
                "borrower": self.borrower.id,
                "date": str(date.today()),
                "amount_paid": amount,
                "payment_mode": mode,
                "reference_id": ref,
            },
            format="json",
        )

    def _loan_detail(self):
        return self.client.get(reverse("loan-detail", args=[self.loan.id]))

    def test_create_update_delete_recalculates_paid_and_outstanding_totals(self):
        first = self._create_collection("200.00", "cash", "CASH-200")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        loan_after_first = self._loan_detail()
        self.assertEqual(loan_after_first.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(loan_after_first.data["paid_amount"]), Decimal("200.00"))
        self.assertEqual(Decimal(loan_after_first.data["outstanding_balance"]), Decimal("800.00"))
        self.assertEqual(loan_after_first.data.get("payment_status"), "partial")

        patch = self.client.patch(
            reverse("collection-detail", args=[first.data["id"]]),
            {"amount_paid": "350.00", "payment_mode": "gpay", "reference_id": "UPI-350"},
            format="json",
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)

        loan_after_update = self._loan_detail()
        self.assertEqual(Decimal(loan_after_update.data["paid_amount"]), Decimal("350.00"))
        self.assertEqual(Decimal(loan_after_update.data["outstanding_balance"]), Decimal("650.00"))
        self.assertEqual(loan_after_update.data.get("payment_status"), "partial")

        second = self._create_collection("650.00", "paytm", "PTM-650")
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)

        loan_after_full = self._loan_detail()
        self.assertEqual(Decimal(loan_after_full.data["paid_amount"]), Decimal("1000.00"))
        self.assertEqual(Decimal(loan_after_full.data["outstanding_balance"]), Decimal("0.00"))
        self.assertEqual(loan_after_full.data.get("payment_status"), "paid")
        self.assertEqual(loan_after_full.data["status"], "closed")

        delete_first = self.client.delete(reverse("collection-detail", args=[first.data["id"]]))
        self.assertEqual(delete_first.status_code, status.HTTP_204_NO_CONTENT)

        loan_after_delete = self._loan_detail()
        self.assertEqual(Decimal(loan_after_delete.data["paid_amount"]), Decimal("650.00"))
        self.assertEqual(Decimal(loan_after_delete.data["outstanding_balance"]), Decimal("350.00"))
        self.assertEqual(loan_after_delete.data.get("payment_status"), "partial")
        self.assertEqual(loan_after_delete.data["status"], "active")

    def test_payment_mode_required_and_reference_optional(self):
        missing_mode = self.client.post(
            reverse("collection-list"),
            {
                "loan": self.loan.id,
                "borrower": self.borrower.id,
                "date": str(date.today()),
                "amount_paid": "100.00",
            },
            format="json",
        )
        self.assertEqual(missing_mode.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("payment_mode", missing_mode.data)

        without_ref = self._create_collection("100.00", "other_upi")
        self.assertEqual(without_ref.status_code, status.HTTP_201_CREATED)
        self.assertEqual(without_ref.data.get("payment_mode"), "other_upi")
        self.assertIn("reference_id", without_ref.data)
