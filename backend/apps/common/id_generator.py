from django.db import transaction

from apps.common.models import DocumentSequence

# Sentinel date_part used for tenant-global (non-daily) sequences.
_GLOBAL_DATE_PART = "0000"


def generate_document_code(*, doc_type: str, tenant) -> str:
    """Generate [TYPE]-[SEQ] — e.g. LN-001 — scoped per tenant, globally sequential."""
    normalized_type = doc_type.strip().upper()[:4]

    with transaction.atomic():
        sequence, _ = (
            DocumentSequence.objects.select_for_update()
            .get_or_create(
                tenant=tenant,
                doc_type=normalized_type,
                date_part=_GLOBAL_DATE_PART,
                defaults={"last_seq": 0},
            )
        )
        sequence.last_seq += 1
        sequence.save(update_fields=["last_seq", "updated_at"])

    return f"{normalized_type}-{sequence.last_seq:03d}"


def _tenant_abbr(tenant) -> str:
    raw = (getattr(tenant, "branch_name", None) or getattr(tenant, "full_name", None) or "GEN").strip()
    abbr = "".join(c.upper() for c in raw if c.isalpha())[:3]
    if not abbr:
        abbr = "GEN"
    return abbr.ljust(3, abbr[-1])[:3]


def generate_collection_code(*, tenant, date) -> str:
    """Generate CL-[TENANT]-[DDMM]-[SEQ]. Example: CL-SUR-1904-001. Daily sequence per tenant."""
    abbr = _tenant_abbr(tenant)
    date_part = date.strftime("%d%m") if hasattr(date, "strftime") else "0000"

    with transaction.atomic():
        sequence, _ = (
            DocumentSequence.objects.select_for_update()
            .get_or_create(
                tenant=tenant,
                doc_type="CL",
                date_part=date_part,
                defaults={"last_seq": 0},
            )
        )
        sequence.last_seq += 1
        sequence.save(update_fields=["last_seq", "updated_at"])

    return f"CL-{abbr}-{date_part}-{sequence.last_seq:03d}"
