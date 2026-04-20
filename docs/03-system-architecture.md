# 03 - System Architecture

## High-Level
- Frontend: Next.js + TypeScript + Tailwind + Redux Toolkit + RTK Query + Axios
- Backend: Django + DRF + SimpleJWT
- Database: PostgreSQL
- Runtime: Docker Compose split by app (`backend/docker-compose.yml`, `frontend/docker-compose.yml`)

## Request Flow
1. UI action triggers RTK Query endpoint.
2. RTK Query uses Axios base query (`Authorization: Bearer <token>`).
3. DRF endpoint validates input and permissions.
4. Services layer handles transaction-critical logic (collections/loan balances).
5. Response updates RTK Query cache and UI.

## Auth Architecture
- Login with mobile+password via `/api/auth/login/`.
- JWT access token stored in localStorage and Redux.
- `AuthBootstrap` restores token to Redux on app load.
- `getMe` endpoint hydrates current user.

## Data & Consistency
- `Loan` stores denormalized computed fields (`total_amount`, `daily_emi`, `paid_amount`, `outstanding_balance`).
- `Collection` service locks loan row (`select_for_update`) and recalculates balances atomically.
- Collection update path also recalculates balances atomically.

## Performance Patterns
- DB indexes on high-read dimensions (status, date, borrower/loan references).
- DRF queryset optimization with `select_related` where applicable.
- Paginated list endpoints in DRF global settings.
- RTK Query caching and invalidation tags reduce repeated requests.

## Security Patterns
- Password hashing via Django user model.
- JWT auth enforced by DRF defaults.
- Role-based restrictions for collector actions.
- Serializer-level cross-entity validation (loan-borrower integrity).

## Scaling-Ready Design
- Modular backend app boundaries.
- Service layer for business-critical logic.
- Report/dashboard APIs separated from transaction APIs.
- Future-ready for Redis queue/cache without major rewrites.
