from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from apps.common.constants import RoleChoices
from apps.users.models import User


class Command(BaseCommand):
    help = "Create or update an admin tenant user and optionally seed jewellery defaults."

    def add_arguments(self, parser):
        parser.add_argument("--mobile", required=True, help="Mobile number")
        parser.add_argument("--password", required=True, help="Password")
        parser.add_argument("--full-name", required=True, help="Full name")
        parser.add_argument(
            "--seed-jewellery",
            action="store_true",
            help="Run seed_jewellery_defaults for this admin tenant",
        )

    def handle(self, *args, **options):
        mobile = options["mobile"].strip()
        password = options["password"]
        full_name = options["full_name"].strip()
        seed_jewellery = options["seed_jewellery"]

        if not mobile:
            raise CommandError("Mobile number cannot be empty")
        if not password:
            raise CommandError("Password cannot be empty")
        if not full_name:
            raise CommandError("Full name cannot be empty")

        user, created = User.objects.get_or_create(
            mobile_number=mobile,
            defaults={
                "username": mobile,
                "full_name": full_name,
            },
        )

        user.username = mobile
        user.full_name = full_name
        user.role = RoleChoices.ADMIN
        user.is_staff = True
        user.is_superuser = False
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
        self.stdout.write(self.style.SUCCESS(f"{action} admin tenant: {user.mobile_number} (id={user.id})"))

        if seed_jewellery:
            call_command("seed_jewellery_defaults", tenant_id=user.id)
