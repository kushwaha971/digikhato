# 04 - Folder Structure Guide

## Root
- `backend/` Django API
- `frontend/` Next.js app
- `docs/` product + engineering docs
- `backend/docker-compose.yml` backend + DB stack
- `frontend/docker-compose.yml` frontend stack

## Backend Structure
- `backend/config/`
  - `settings/base.py`, `local.py`, `production.py`
  - `urls.py`
- `backend/apps/`
  - `users/` auth + role model + auth APIs
  - `onboarding/` business profile setup
  - `borrowers/` borrower domain
  - `loans/` loan domain + EMI calculations
  - `collections/` repayments + correction service
  - `dashboard/` summary APIs
  - `reports/` report APIs
  - `common/` shared models/pagination/permissions/constants

### Backend Coding Rules
- Keep business rules in `services.py` for critical flows.
- Keep serializers focused on validation + shape.
- Keep views/viewsets focused on orchestration + permissions.
- Add DB indexes in model `Meta.indexes` for common filters.

## Frontend Structure
- `frontend/src/app/` route-based screens
- `frontend/src/features/` RTK Query APIs per domain
- `frontend/src/store/` Redux store, auth slice, API base
- `frontend/src/components/`
  - `ui/` primitive reusable UI
  - `layout/` shell/navigation wrappers
  - `business/` domain-specific reusable blocks
- `frontend/src/hooks/` reusable behavior hooks
- `frontend/src/validators/` Zod schemas
- `frontend/src/lib/` shared library adapters (Axios)

### Frontend Coding Rules
- Use RTK Query for server state only.
- Keep forms in RHF + Zod.
- Keep reusable UI in `components/ui`.
- Keep domain reusable widgets in `components/business`.
- Avoid business logic in page rendering components.
