#!/usr/bin/env sh
set -eu

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.production}"
PORT="${PORT:-8000}"
WORKERS="${GUNICORN_WORKERS:-2}"
TIMEOUT="${GUNICORN_TIMEOUT:-120}"

python manage.py migrate --noinput

if [ "${AUTO_BOOTSTRAP_SUPERADMIN:-0}" = "1" ]; then
  if [ -z "${SUPERADMIN_MOBILE:-}" ] || [ -z "${SUPERADMIN_PASSWORD:-}" ]; then
    echo "AUTO_BOOTSTRAP_SUPERADMIN=1 requires SUPERADMIN_MOBILE and SUPERADMIN_PASSWORD"
    exit 1
  fi
  python manage.py bootstrap_superadmin \
    --mobile "${SUPERADMIN_MOBILE}" \
    --password "${SUPERADMIN_PASSWORD}" \
    --full-name "${SUPERADMIN_FULL_NAME:-Super Admin}"
fi

if [ "${AUTO_BOOTSTRAP_ADMIN_TENANT:-0}" = "1" ]; then
  if [ -z "${ADMIN_TENANT_MOBILE:-}" ] || [ -z "${ADMIN_TENANT_PASSWORD:-}" ] || [ -z "${ADMIN_TENANT_FULL_NAME:-}" ]; then
    echo "AUTO_BOOTSTRAP_ADMIN_TENANT=1 requires ADMIN_TENANT_MOBILE, ADMIN_TENANT_PASSWORD, ADMIN_TENANT_FULL_NAME"
    exit 1
  fi
  if [ "${AUTO_SEED_JEWELLERY_DEFAULTS:-0}" = "1" ]; then
    python manage.py bootstrap_admin_tenant \
      --mobile "${ADMIN_TENANT_MOBILE}" \
      --password "${ADMIN_TENANT_PASSWORD}" \
      --full-name "${ADMIN_TENANT_FULL_NAME}" \
      --seed-jewellery
  else
    python manage.py bootstrap_admin_tenant \
      --mobile "${ADMIN_TENANT_MOBILE}" \
      --password "${ADMIN_TENANT_PASSWORD}" \
      --full-name "${ADMIN_TENANT_FULL_NAME}"
  fi
fi

exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT}" --workers "${WORKERS}" --timeout "${TIMEOUT}"
