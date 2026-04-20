from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase

from apps.borrowers.models import Borrower
from apps.collections.models import Collection
from apps.loans.models import Loan
from apps.users.models import User


class APIEndToEndTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            mobile_number="9794620535",
            password="Akash@1511",
            full_name="Akash Kushwaha",
            role="admin",
            is_staff=True,
            is_superuser=True,
        )
        self.collector = User.objects.create_user(
            mobile_number="9000000002",
            password="Collector@123",
            full_name="Collector User",
            role="collector",
        )

    def _create_borrower(self, assigned_agent=None):
        return Borrower.objects.create(
            name="Test Borrower",
            mobile_number="9111111111",
            address="Village Road",
            assigned_agent=assigned_agent,
            status="active",
        )

    def _create_loan(self, borrower):
        return Loan.objects.create(
            borrower=borrower,
            principal=Decimal("1000.00"),
            interest_rate=Decimal("10.00"),
            interest_type="flat",
            tenure_days=10,
            start_date=date.today() - timedelta(days=2),
            total_amount=Decimal("1100.00"),
            daily_emi=Decimal("110.00"),
            paid_amount=Decimal("0.00"),
            outstanding_balance=Decimal("1100.00"),
            status="active",
        )

    def _admin_auth(self):
        self.client.force_authenticate(user=self.admin)

    def _collector_auth(self):
        self.client.force_authenticate(user=self.collector)

    def _create_collection(self, *, loan, borrower, amount, payment_mode="cash", reference_id=""):
        return self.client.post(
            reverse("collection-list"),
            {
                "loan": loan.id,
                "borrower": borrower.id,
                "date": str(date.today()),
                "amount_paid": str(amount),
                "payment_mode": payment_mode,
                "reference_id": reference_id,
                "notes": "test-payment",
            },
            format="json",
        )

    def test_auth_signup_login_me_logout(self):
        signup_res = self.client.post(
            reverse("signup"),
            {
                "full_name": "New User",
                "mobile_number": "9000000003",
                "password": "NewPass@123",
                "role": "collector",
                "branch_name": "Test",
            },
            format="json",
        )
        self.assertEqual(signup_res.status_code, status.HTTP_201_CREATED)

        login_res = self.client.post(
            reverse("login"),
            {"mobile_number": "9000000003", "password": "NewPass@123"},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        token = login_res.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me_res = self.client.get(reverse("me"))
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["mobile_number"], "9000000003")

        logout_res = self.client.post(reverse("logout"))
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

    def test_onboarding_profile_upsert(self):
        self._admin_auth()
        url = reverse("onboarding-profile")

        get_res = self.client.get(url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)

        patch_res = self.client.patch(
            url,
            {
                "business_name": "Money Lend Co",
                "area_name": "Basti",
                "currency": "INR",
                "is_onboarded": True,
            },
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["business_name"], "Money Lend Co")

    def test_borrower_crud_admin_and_restriction_for_collector(self):
        self._admin_auth()
        list_url = reverse("borrower-list")
        create_res = self.client.post(
            list_url,
            {
                "name": "Borrower A",
                "mobile_number": "9222222222",
                "address": "Near market",
                "status": "active",
                "assigned_agent": self.collector.id,
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        borrower_id = create_res.data["id"]

        list_res = self.client.get(list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

        detail_url = reverse("borrower-detail", args=[borrower_id])
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        patch_res = self.client.patch(detail_url, {"name": "Borrower A1"}, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

        self._collector_auth()
        denied_create = self.client.post(
            list_url,
            {
                "name": "Borrower B",
                "mobile_number": "9333333333",
                "address": "Denied",
                "status": "active",
            },
            format="json",
        )
        self.assertEqual(denied_create.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        delete_res = self.client.delete(detail_url)
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_loan_crud_and_overdue(self):
        self._admin_auth()
        borrower = self._create_borrower(assigned_agent=self.collector)
        list_url = reverse("loan-list")

        create_res = self.client.post(
            list_url,
            {
                "borrower": borrower.id,
                "principal": "1200.00",
                "interest_rate": "10.00",
                "interest_type": "flat",
                "tenure_days": 12,
                "start_date": str(date.today() - timedelta(days=2)),
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        loan_id = create_res.data["id"]

        detail_url = reverse("loan-detail", args=[loan_id])
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        patch_res = self.client.patch(detail_url, {"principal": "1400.00"}, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

        overdue_res = self.client.get(reverse("overdue-loans"))
        self.assertEqual(overdue_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(overdue_res.data["results"]), 1)

        delete_res = self.client.delete(detail_url)
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_collections_create_update_today_due_and_history(self):
        self._admin_auth()
        borrower = self._create_borrower(assigned_agent=self.collector)
        loan = self._create_loan(borrower)
        list_url = reverse("collection-list")

        create_res = self.client.post(
            list_url,
            {
                "loan": loan.id,
                "borrower": borrower.id,
                "date": str(date.today()),
                "amount_paid": "100.00",
                "payment_mode": "cash",
                "reference_id": "COLL-TEST-100",
                "notes": "first",
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data.get("payment_mode"), "cash")
        collection_id = create_res.data["id"]

        detail_url = reverse("collection-detail", args=[collection_id])
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        patch_res = self.client.patch(
            detail_url,
            {
                "amount_paid": "110.00",
                "payment_mode": "gpay",
                "reference_id": "UPI-110",
            },
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data.get("payment_mode"), "gpay")
        self.assertEqual(patch_res.data.get("reference_id"), "UPI-110")

        today_due = self.client.get(reverse("today-due"))
        self.assertEqual(today_due.status_code, status.HTTP_200_OK)

        history = self.client.get(list_url)
        self.assertEqual(history.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(history.data["results"]), 1)

        delete_res = self.client.delete(detail_url)
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_collector_can_collect_only_assigned_borrower(self):
        assigned = self._create_borrower(assigned_agent=self.collector)
        unassigned = self._create_borrower(assigned_agent=None)
        assigned.mobile_number = "9444444444"
        assigned.save(update_fields=["mobile_number"])
        loan_assigned = self._create_loan(assigned)
        loan_unassigned = self._create_loan(unassigned)

        self._collector_auth()
        list_url = reverse("collection-list")

        ok_res = self.client.post(
            list_url,
            {
                "loan": loan_assigned.id,
                "borrower": assigned.id,
                "date": str(date.today()),
                "amount_paid": "80.00",
                "payment_mode": "cash",
            },
            format="json",
        )
        self.assertEqual(ok_res.status_code, status.HTTP_201_CREATED)

        denied_res = self.client.post(
            list_url,
            {
                "loan": loan_unassigned.id,
                "borrower": unassigned.id,
                "date": str(date.today()),
                "amount_paid": "50.00",
                "payment_mode": "cash",
            },
            format="json",
        )
        self.assertEqual(denied_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dashboard_and_reports(self):
        self._admin_auth()
        borrower = self._create_borrower(assigned_agent=self.collector)
        loan = self._create_loan(borrower)
        Collection.objects.create(
            loan=loan,
            borrower=borrower,
            date=date.today(),
            amount_paid=Decimal("100.00"),
            status="paid",
            notes="report",
            collected_by=self.admin,
            sync_status="pending",
        )

        dashboard = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(dashboard.status_code, status.HTTP_200_OK)
        self.assertIn("today_collection_total", dashboard.data)

        daily = self.client.get(reverse("daily-report"), {"date": str(date.today())})
        self.assertEqual(daily.status_code, status.HTTP_200_OK)

        loan_report = self.client.get(reverse("loan-report"))
        self.assertEqual(loan_report.status_code, status.HTTP_200_OK)

        overdue_report = self.client.get(reverse("overdue-report"))
        self.assertEqual(overdue_report.status_code, status.HTTP_200_OK)

    def test_password_policy_requires_minimum_8_characters(self):
        short_res = self.client.post(
            reverse("signup"),
            {
                "full_name": "Short Password",
                "mobile_number": "9000000100",
                "password": "short77",
                "role": "collector",
            },
            format="json",
        )
        self.assertEqual(short_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", short_res.data)

        min8_res = self.client.post(
            reverse("signup"),
            {
                "full_name": "Min Eight",
                "mobile_number": "9000000101",
                "password": "abcdefgh",
                "role": "collector",
            },
            format="json",
        )
        self.assertEqual(min8_res.status_code, status.HTTP_201_CREATED)

    def test_borrower_onboarding_creates_login_and_forces_first_reset(self):
        self._admin_auth()
        borrower_mobile = "9555555501"
        create_res = self.client.post(
            reverse("borrower-list"),
            {
                "name": "Borrower Login User",
                "mobile_number": borrower_mobile,
                "address": "",
                "status": "active",
                "create_login": True,
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", create_res.data)
        self.assertTrue(create_res.data.get("must_reset_password"))
        temp_password = create_res.data.get("temporary_password")
        self.assertIsNotNone(temp_password)

        login_client = APIClient()
        login_res = login_client.post(
            reverse("login"),
            {"mobile_number": borrower_mobile, "password": temp_password},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertTrue(login_res.data["user"].get("must_reset_password"))

    def test_notifications_due_alert_endpoint_and_payload_shape(self):
        self._admin_auth()
        notifications_url = reverse("notification-list")
        res = self.client.get(notifications_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("results", res.data)
        if res.data["results"]:
            sample = res.data["results"][0]
            for key in ("id", "type", "message", "is_read", "created_at"):
                self.assertIn(key, sample)

    def test_loan_and_collection_codes_are_tenant_specific_and_readable(self):
        self._admin_auth()
        borrower = self.client.post(
            reverse("borrower-list"),
            {
                "name": "Readable Code Borrower",
                "mobile_number": "9555555512",
                "status": "active",
            },
            format="json",
        ).data

        loan_res = self.client.post(
            reverse("loan-list"),
            {
                "borrower": borrower["id"],
                "principal": "1000.00",
                "interest_rate": "10.00",
                "interest_type": "flat",
                "tenure_days": 10,
                "start_date": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(loan_res.status_code, status.HTTP_201_CREATED)
        self.assertRegex(loan_res.data.get("loan_code", ""), r"^LN-[A-Z0-9]{3}-\d{4}-\d{3}$")
        self.assertNotIn("#", loan_res.data.get("loan_code", ""))

        coll_res = self._create_collection(
            loan=Loan.objects.get(pk=loan_res.data["id"]),
            borrower=Borrower.objects.get(pk=borrower["id"]),
            amount="150.00",
            payment_mode="phonepe",
            reference_id="PP-12345",
        )
        self.assertEqual(coll_res.status_code, status.HTTP_201_CREATED)
        self.assertRegex(coll_res.data.get("collection_code", ""), r"^CL-[A-Z0-9]{3}-\d{4}-\d{3}$")
        self.assertNotIn("#", coll_res.data.get("collection_code", ""))
