#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.test_sqlite}"
export DJANGO_SETTINGS_MODULE="$SETTINGS_MODULE"

echo "Using DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"
python3 manage.py check
python3 manage.py test \
  apps.jewellery.tests.test_system_api \
  apps.jewellery.tests.test_master \
  apps.jewellery.tests.test_inventory \
  apps.jewellery.tests.test_rates \
  apps.jewellery.tests.test_billing \
  apps.jewellery.tests.test_admin_controls \
  apps.users.tests.test_auth_borrower_reset
