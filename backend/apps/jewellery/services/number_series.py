"""Race-condition-safe number series generator for jewellery vouchers."""

from django.db import transaction

from apps.jewellery.models.master import NumberSeries


def get_next_number(tenant, voucher_type: str, branch_name: str = "") -> str:
    """Return the next formatted voucher number and advance the counter atomically.

    Uses select_for_update() on the NumberSeries row so concurrent requests
    can't pick the same number. Must be called inside a transaction.atomic() block.
    """
    with transaction.atomic():
        try:
            series = (
                NumberSeries.objects
                .select_for_update()
                .get(
                    tenant=tenant,
                    voucher_type=voucher_type,
                    deleted_at__isnull=True,
                )
            )
        except NumberSeries.DoesNotExist:
            # Fallback: create a default series on the fly if none configured
            series = NumberSeries.objects.select_for_update().create(
                tenant=tenant,
                branch_name=branch_name,
                created_by=tenant,
                updated_by=tenant,
                voucher_type=voucher_type,
                prefix=voucher_type[:3].upper(),
                next_number=1,
                padding=5,
            )

        number_str = str(series.next_number).zfill(series.padding)
        voucher_no = f"{series.prefix}{number_str}"

        series.next_number += 1
        series.save(update_fields=["next_number", "updated_at"])

    return voucher_no
