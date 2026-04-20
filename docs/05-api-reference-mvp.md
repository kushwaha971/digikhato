# 05 - API Reference (MVP)

Base URL: `/api`

## Auth
- `POST /auth/login/`
- `POST /auth/logout/`
- `GET /auth/me/`

## Onboarding
- `GET /onboarding/profile/`
- `PATCH /onboarding/profile/`

## Borrowers
- `GET /borrowers/` (search, filter, pagination)
- `POST /borrowers/`
- `GET /borrowers/{id}/`
- `PATCH /borrowers/{id}/`
- `DELETE /borrowers/{id}/`

## Loans
- `GET /loans/`
- `POST /loans/`
- `GET /loans/{id}/`
- `PATCH /loans/{id}/`
- `DELETE /loans/{id}/`
- `GET /loans/overdue/`

## Collections
- `GET /collections/`
- `POST /collections/`
- `GET /collections/{id}/`
- `PATCH /collections/{id}/`
- `DELETE /collections/{id}/`
- `GET /collections/today-due/`

## Dashboard
- `GET /dashboard/summary/`

## Reports
- `GET /reports/daily/?date=YYYY-MM-DD`
- `GET /reports/loan/`
- `GET /reports/overdue/`

## Permission Notes
- Admin: full access.
- Collector: scoped to assigned borrowers for read/collection flows.
- Collector blocked from creating/updating/deleting borrowers and loans.

