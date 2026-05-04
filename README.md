# Daily Collection Loan Management System

Mobile-first PWA MVP for small lenders and collectors to manage borrowers, loans, daily collection, overdue tracking, and reports.

## Stack
- Frontend: Next.js, TypeScript, Tailwind, Redux Toolkit, RTK Query (Axios base), React Hook Form, Zod
- Backend: Django, DRF, JWT auth
- Database: PostgreSQL
- Runtime: Docker Compose (separate `backend/` and `frontend/`)

## Run with Docker
```bash
# Start backend + db
cd backend && docker compose up --build -d

# Start frontend
cd ../frontend && docker compose up --build
```

## Deploy on Railway (Monorepo)
- Create 2 Railway services from the same repo:
  - Frontend service root directory: `/frontend`
  - Backend service root directory: `/backend`
- In each service, set **Config as Code path**:
  - Frontend: `/frontend/railway.json`
  - Backend: `/backend/railway.json`
- Required env vars:
  - Backend: `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
  - Frontend: `NEXT_PUBLIC_API_BASE_URL`

## Environment
- Backend variables: create [`backend/.env`](/Users/akashkushwaha/Projects/money-mgmt/backend/.env) from [`backend/.env.example`](/Users/akashkushwaha/Projects/money-mgmt/backend/.env.example)
- Frontend variables: create [`frontend/.env.local`](/Users/akashkushwaha/Projects/money-mgmt/frontend/.env.local) from [`frontend/.env.local.example`](/Users/akashkushwaha/Projects/money-mgmt/frontend/.env.local.example)

## App URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- Django Admin: http://localhost:8001/admin

## Backend modules
- `apps/users`: mobile+password auth (JWT), role model
- `apps/onboarding`: business profile onboarding
- `apps/borrowers`: borrower CRUD + assignment
- `apps/loans`: loan CRUD + EMI/total/outstanding logic
- `apps/collections`: daily collections + correction flow with transaction-safe recalculation
- `apps/dashboard`: summary metrics
- `apps/reports`: daily/loan/overdue reports

## Frontend routes (MVP screens)
- `/` splash
- `/login`
- `/onboarding`
- `/dashboard`
- `/borrowers`, `/borrowers/add`, `/borrowers/[id]`, `/borrowers/[id]/edit`
- `/loans`, `/loans/create`, `/loans/[id]`, `/loans/[id]/edit`
- `/collections/today`, `/collections/entry`, `/collections/[id]/edit`, `/collections/history`
- `/overdue`
- `/reports`
- `/settings`

## Notes
- Optimized for lean MVP architecture with modular apps and feature-based frontend folders.
- Role model: `admin`, `collector` (admin can perform collection actions).
- API calls are handled via RTK Query + shared Axios client.

## Project Documentation
- Full docs index: [`docs/README.md`](/Users/akashkushwaha/Projects/money-mgmt/docs/README.md)
