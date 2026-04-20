from apps.common.models import AuditLog


def _get_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(request, action, model_name="", object_id="", detail=""):
    """
    Call this after any significant write to produce an immutable audit trail.
    Safe to call even when request.user is anonymous (login failures etc).
    """
    user = getattr(request, "user", None)
    actor = user if (user and user.is_authenticated) else None

    tenant_id = None
    tenant_name = ""
    if actor:
        from apps.users.views import get_effective_tenant
        tenant = get_effective_tenant(actor)
        if tenant:
            tenant_id = tenant.pk
            tenant_name = tenant.full_name

    AuditLog.objects.create(
        actor=actor,
        tenant_id_snapshot=tenant_id,
        tenant_name_snapshot=tenant_name,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id else "",
        detail=detail,
        ip_address=_get_ip(request),
    )
