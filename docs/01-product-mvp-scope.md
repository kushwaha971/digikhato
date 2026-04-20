# 01 - Product & MVP Scope

## Product Goal
Build a lean, secure, scalable, mobile-first PWA for rural loan collection operations.

## Primary Users
- Admin / Lender
- Collector / Field Agent
- Admin can execute collector actions

## MVP Boundaries (In Scope)
- Mobile number + password login (no OTP)
- Onboarding (business profile)
- Borrower CRUD
- Loan CRUD with EMI and total payable calculation
- Daily collections with paid/partial/missed status
- Collection edit/correction flow
- Overdue list and summary
- Dashboard summary metrics
- Reports (daily / loan / overdue)
- Settings with logout and sync status

## Out of Scope for MVP (Planned Later)
- OTP authentication
- Advanced branch hierarchy and maker-checker workflows
- Full offline queue conflict resolution UI
- Penalty engine and legal notices
- Advanced analytics and exports
- Background workers, alerts, reminders

## Core Business Rules
- `total_amount = principal + interest`
- `daily_emi = total_amount / tenure_days`
- `outstanding_balance` decreases on each collection
- Partial payments allowed
- Collection create/update recalculates loan balances transaction-safely

## Required Screens (MVP)
Implemented route set includes:
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

