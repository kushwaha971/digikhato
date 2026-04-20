# 02 - Current Implementation Status

## Summary
MVP baseline is implemented and buildable with Docker. Core modules exist end-to-end.

## Backend Status
### Implemented
- Django + DRF modular apps
- JWT login/logout/me endpoints
- Custom user model with role (`admin`, `collector`)
- Borrower model + CRUD API
- Loan model + CRUD API
- Collection model + CRUD API
- Transaction-safe collection create/update and loan balance recalculation
- Onboarding profile API
- Dashboard summary API
- Reports APIs (daily, loan, overdue)
- Pagination/filter/search support in list endpoints
- Role guardrails:
  - Collector limited by assignment scope
  - Collector blocked from borrower/loan mutation

### Current Limitations
- Logout currently returns success only (no refresh-token blacklist)
- Overdue model status is primarily computed/listed via filters; no scheduled status transition job
- No rate limiting / throttling yet
- No background worker integration yet

## Frontend Status
### Implemented
- Next.js app routes for required MVP screens
- Redux Toolkit store
- RTK Query with Axios base query
- Auth state and token bootstrap from localStorage
- Custom hooks (`useAuth`, `useRoleAccess`, `useOnlineStatus`, etc.)
- Reusable UI components (`Button`, `Input`, `Select`, `Card`, layout wrappers)
- Reusable business components (`BorrowerCard`, `LoanSummaryCard`, `DueBorrowerList`, `CollectionEntryForm`, `OverdueCard`, `ReportFilterBar`)
- React Hook Form + Zod used in core create/edit flows
- PWA manifest and service worker generation (`next-pwa`)

### Current Limitations
- Some forms are ID-based (loan/borrower selection by numeric ID) instead of full picker UX
- Reports page currently renders raw JSON blocks (functional but basic)
- Settings contains branch-info placeholder
- Offline queue and retry sync are not fully implemented yet

## Infra / Runtime Status
- Dockerized FE + BE + PostgreSQL
- Env-driven configuration for DB and app settings
- `cd backend && docker compose config` validates
- Frontend production build passes
- Backend Django checks pass
