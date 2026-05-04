from django.core.management.base import BaseCommand, CommandError

from apps.common.constants import RoleChoices
from apps.users.models import User


class Command(BaseCommand):
    help = "Create or update a super admin user."

    def add_arguments(self, parser):
        parser.add_argument("--mobile", required=True, help="Mobile number")
        parser.add_argument("--password", required=True, help="Password")
        parser.add_argument("--full-name", default="Super Admin", help="Full name")

    def handle(self, *args, **options):
        mobile = options["mobile"].strip()
        password = options["password"]
        full_name = options["full_name"].strip()

        if not mobile:
            raise CommandError("Mobile number cannot be empty")
        if not password:
            raise CommandError("Password cannot be empty")

        user, created = User.objects.get_or_create(
            mobile_number=mobile,
            defaults={
                "username": mobile,
                "full_name": full_name,
            },
        )

        user.username = mobile
        user.full_name = full_name or user.full_name or "Super Admin"
        user.role = RoleChoices.SUPER_ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.onboarding_completed = True
        user.set_password(password)
        user.save(update_fields=[
            "username",
            "full_name",
            "role",
            "is_staff",
            "is_superuser",
            "onboarding_completed",
            "password",
            "updated_at",
        ])

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} super admin: {user.mobile_number} (id={user.id})"))
