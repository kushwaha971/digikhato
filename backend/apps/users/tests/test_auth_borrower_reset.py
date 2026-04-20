from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Account
from apps.borrowers.models import Borrower
from apps.loans.models import Loan
from apps.users.models import User


class AuthBorrowerResetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            mobile_number="9001000001",
            password="AdminPass123",
            full_name="Tenant Admin",
            role="admin",
            is_active=True,
        )

    def test_borrower_onboarding_creates_login_and_forces_reset(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse("borrower-list"),
            {
                "name": "Rural Borrower",
                "mobile_number": "9001000002",
                "address": "",
                "status": "active",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("temporary_password", response.data)
        self.assertTrue(response.data["temporary_password"])

        borrower = Borrower.objects.get(pk=response.data["id"])
        self.assertIsNotNone(borrower.user)
        self.assertEqual(borrower.user.role, "borrower")
        self.assertEqual(borrower.user.tenant_id, self.admin.id)
        self.assertEqual(borrower.user.created_by_id, self.admin.id)
        self.assertTrue(borrower.user.must_reset_password)

        self.client.force_authenticate(user=None)
        login_response = self.client.post(
            reverse("login"),
            {
                "mobile_number": borrower.user.mobile_number,
                "password": response.data["temporary_password"],
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertTrue(login_response.data["user"]["must_reset_password"])

    def test_reset_password_required_clears_must_reset_flag(self):
        borrower_user = User.objects.create_user(
            mobile_number="9001000003",
            password="TempPass123",
            full_name="Borrower User",
            role="borrower",
            tenant=self.admin,
            created_by=self.admin,
            must_reset_password=True,
        )

        self.client.force_authenticate(user=borrower_user)

        weak = self.client.post(
            reverse("reset-password-required"),
            {
                "current_password": "TempPass123",
                "new_password": "short7",
                "confirm": "short7",
            },
            format="json",
        )
        self.assertEqual(weak.status_code, status.HTTP_400_BAD_REQUEST)

        mismatch = self.client.post(
            reverse("reset-password-required"),
            {
                "current_password": "TempPass123",
                "new_password": "NewPass123",
                "confirm": "NoMatch123",
            },
            format="json",
        )
        self.assertEqual(mismatch.status_code, status.HTTP_400_BAD_REQUEST)

        ok = self.client.post(
            reverse("reset-password-required"),
            {
                "current_password": "TempPass123",
                "new_password": "NewPass123",
                "confirm": "NewPass123",
            },
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK)

        borrower_user.refresh_from_db()
        self.assertFalse(borrower_user.must_reset_password)
        self.assertTrue(borrower_user.check_password("NewPass123"))

    def test_public_signup_cannot_create_super_admin(self):
        response = self.client.post(
            reverse("signup"),
            {
                "full_name": "Invalid Super Admin",
                "mobile_number": "9001000004",
                "password": "SuperPass123",
                "role": "super_admin",
                "branch_name": "Root",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    def test_team_detail_and_toggle_are_tenant_scoped_for_admin(self):
        other_admin = User.objects.create_user(
            mobile_number="9001000005",
            password="AdminPass123",
            full_name="Other Admin",
            role="admin",
        )
        member = User.objects.create_user(
            mobile_number="9001000006",
            password="Collector123",
            full_name="Other Collector",
            role="collector",
            tenant=other_admin,
        )

        self.client.force_authenticate(user=self.admin)

        detail = self.client.get(reverse("team-member-detail", args=[member.id]))
        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)

        toggle = self.client.post(reverse("team-member-toggle", args=[member.id]))
        self.assertEqual(toggle.status_code, status.HTTP_404_NOT_FOUND)

    def test_borrower_cannot_create_loans_collections_or_accounts(self):
        borrower_user = User.objects.create_user(
            mobile_number="9001000007",
            password="Borrower123",
            full_name="Scoped Borrower",
            role="borrower",
            tenant=self.admin,
        )
        borrower = Borrower.objects.create(
            name="Scoped Borrower",
            mobile_number=borrower_user.mobile_number,
            address="",
            tenant=self.admin,
            user=borrower_user,
            status="active",
        )

        loan = Loan.objects.create(
            borrower=borrower,
            principal=Decimal("1000.00"),
            interest_rate=Decimal("5.00"),
            interest_type="flat",
            tenure_days=10,
            start_date=date.today(),
            total_amount=Decimal("1050.00"),
            daily_emi=Decimal("105.00"),
            paid_amount=Decimal("0.00"),
            outstanding_balance=Decimal("1050.00"),
            status="active",
        )
        account = Account.objects.create(
            borrower=borrower,
            amount_given=Decimal("500.00"),
            daily_interest_rate=Decimal("1.00"),
            duration_days=10,
            amount_paid=Decimal("0.00"),
            outstanding_amount=Decimal("500.00"),
            created_by=self.admin,
        )

        self.client.force_authenticate(user=borrower_user)

        loan_create = self.client.post(
            reverse("loan-list"),
            {
                "borrower": borrower.id,
                "principal": "1500.00",
                "interest_rate": "10.00",
                "interest_type": "flat",
                "tenure_days": 12,
                "start_date": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(loan_create.status_code, status.HTTP_403_FORBIDDEN)

        collection_create = self.client.post(
            reverse("collection-list"),
            {
                "loan": loan.id,
                "borrower": borrower.id,
                "date": str(date.today()),
                "amount_paid": "50.00",
                "status": "partial",
            },
            format="json",
        )
        self.assertEqual(collection_create.status_code, status.HTTP_403_FORBIDDEN)

        account_create = self.client.post(
            reverse("account-list"),
            {
                "borrower": borrower.id,
                "amount_given": "600.00",
                "daily_interest_rate": "1.00",
                "duration_days": 12,
            },
            format="json",
        )
        self.assertEqual(account_create.status_code, status.HTTP_403_FORBIDDEN)

        daily_collection_create = self.client.post(
            reverse("daily-collection-list"),
            {
                "account": account.id,
                "date": str(date.today()),
                "payment": "50.00",
            },
            format="json",
        )
        self.assertEqual(daily_collection_create.status_code, status.HTTP_403_FORBIDDEN)
