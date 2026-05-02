# DigiKhaato — Jewellery ERP Documentation

This folder contains all planning and implementation documentation for the Jewellery ERP module.

## Document Index

| File | Description |
|------|-------------|
| `00-overview-and-architecture.md` | System overview, tech stack, module map, security model, integration summary |
| `01-phase-wise-implementation.md` | Phase 1/2/3 task breakdown with checkboxes for backend + frontend |
| `02-database-schema.md` | Django model definitions, field types, indexes, migration strategy |
| `03-api-design.md` | Full API surface (DRF), conventions, error codes |
| `04-ui-ux-mapping.md` | Route structure, screen descriptions, component library, mobile UX |
| `05-integration-points.md` | How jewellery integrates with Auth, Tenants, Loans, Notifications, Docker |
| `06-multi-role-user-system.md` | Multi-app RBAC design, UserModuleRole model, workspace pattern |
| `07-ai-agent-playbook.md` | Agent roles, domain knowledge, formula rules, anti-patterns, phase gates |
| `DigiKhaato-Jewellery-ERP-COMPLETE.md` | Master ERP spec: all 15 modules, DB schema, APIs, formulas, compliance |
| `digikhaato_jewellery_sidebar.html` | Reference sidebar UI (used as design template for React sidebar) |

## Quick Start for Engineers

1. Read `00-overview-and-architecture.md` — understand the structure
2. Read `01-phase-wise-implementation.md` — pick your Phase 1 task
3. Read the formula section in `DigiKhaato-Jewellery-ERP-COMPLETE.md` (Section 7) before touching billing/loans
4. Follow agent checklist in `07-ai-agent-playbook.md` before writing code

## Quick Start for AI Agents

See `07-ai-agent-playbook.md` — mandatory reading list and per-agent responsibilities.

## 15 Sub-Modules

| Phase | Modules |
|-------|---------|
| Phase 1 (MVP) | Jewellery Master, Stock & Inventory, Basic Billing, MCX Rate, Users & Roles, Admin Controls |
| Phase 2 (Full Ops) | Karigar & Orders, Accounts & Ledger, GST & Reports, Party Outstanding, Gold Pledge Loans, Multi-Branch, Notifications |
| Phase 3 (Scale) | Barcode/RFID, Mobile App (offline), Advanced Analytics |
