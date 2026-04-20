# 09 - PRD/FRD Alignment (Implemented vs Future)

This document maps your PRD/FRD baseline to actual implementation status.

## Environment Reference
- Frontend env file: `frontend/.env.local`
- Backend env file: `backend/.env`
- Compose/root env file: `.env`

## Product-Level Mapping

### Implemented Now (MVP)
- Borrower registration and management
- Loan creation with flat interest calculation
- Daily collection entry (paid/partial/missed)
- Collection correction/edit flow
- Overdue listing (basic)
- Dashboard summaries
- Reports (daily, loan, overdue)
- Role model (`admin`, `collector`) with scoped access
- Dockerized FE + BE + PostgreSQL

### Planned for Future
- Full offline queue conflict resolution UX
- GPS tagging in frontend flow
- Receipt generation (SMS/print)
- Penalty automation
- Automated reminders (SMS/WhatsApp)
- Borrower mobile app
- Multi-branch advanced controls
- Advanced analytics and exports
- UPI / digital payments integration

## FRD Module-by-Module

### Borrower Management (P1)
- Status: Implemented (core)
- Current: add/list/view/edit; optional fields supported in backend model
- Future: stronger KYC capture UX, file upload flows

### Loan Creation (P1)
- Status: Implemented
- Current: principal, flat interest, tenure, start date, total and EMI calculation
- Future: configurable interest modes, richer repayment schedules

### Daily Collection (P1)
- Status: Implemented (online-first with sync placeholders)
- Current: paid/partial/missed, amount, notes, correction with transaction-safe recalculation
- Future: robust offline queue and auto-sync conflict workflows

### Overdue Tracking (Basic P1)
- Status: Implemented (basic)
- Current: overdue list and summary via outstanding + date filters
- Future: penalty computation and automated follow-up

### Dashboard (P1)
- Status: Implemented
- Current: today collection, total outstanding, active loans, overdue count
- Future: deeper collector productivity and trend visuals

### Reports (Basic P1)
- Status: Implemented (functional baseline)
- Current: daily, loan, overdue APIs and frontend rendering
- Future: polished report UI, export, and collector-wise drill-down tables

## Auth Note
Your original product rule in this project is **mobile number + password, no OTP for MVP**.
- Current implementation follows this rule.
- OTP can be added later as optional enhancement.

## Agent Execution Rule from this Baseline
For any new feature request, each agent must classify scope as:
1. Implement now (MVP core)
2. Implement partial now + future flag
3. Future only (documented roadmap)

