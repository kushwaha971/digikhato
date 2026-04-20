# 07 - Roadmap (Post-MVP)

## Phase A - Hardening (Short Term)
- Add refresh-token rotation/blacklist.
- Add DRF throttling and structured error codes.
- Add environment secret management guidance.
- Add seeded demo data and admin bootstrap script.

## Phase B - Field Usability (Near Term)
- Borrower and loan pickers with search (no manual ID entry).
- Faster collection wizard with one-tap actions.
- Better reports UI with tables and export CSV.
- Branch setup and user management in settings.

## Phase C - Offline and Sync (Core Next)
- Local queue for collection submissions.
- Sync retries with backoff.
- Conflict detection/resolution UI.
- Sync audit logs.

## Phase D - Scale & Ops
- Redis cache layer.
- Background jobs for reminders and overdue status processing.
- Alerting and monitoring dashboard.
- Database partitioning strategy for collections if high volume.

## Phase E - Product Expansion
- Penalty/late fee engine.
- Collector performance and route analytics.
- Multi-branch and hierarchy controls.
- Multi-language support.

