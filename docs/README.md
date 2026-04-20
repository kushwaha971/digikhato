# Documentation Index

This folder is the working documentation for the **Daily Collection Loan Management System** MVP.

## Documents
- [01 - Product & MVP Scope](./01-product-mvp-scope.md)
- [02 - Current Implementation Status](./02-current-implementation-status.md)
- [03 - System Architecture](./03-system-architecture.md)
- [04 - Folder Structure Guide](./04-folder-structure-guide.md)
- [05 - API Reference (MVP)](./05-api-reference-mvp.md)
- [06 - Agent Playbook (Current + Future)](./06-agent-playbook.md)
- [07 - Roadmap (Post-MVP)](./07-roadmap-post-mvp.md)
- [08 - Developer Workflow](./08-developer-workflow.md)
- [09 - PRD/FRD Alignment (Implemented vs Future)](./09-prd-frd-alignment.md)
- [10 - System Documentation (APIs, Screens, Flows, Roles)](./10-system-documentation-apis-screens-flows-roles.md)
- [11 - Frontend Form Architecture (Formik + Yup Standard)](./11-frontend-form-architecture.md)

## Quick Start
1. Configure env files:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.local.example frontend/.env.local`
2. Start stack:
   - `cd backend && docker compose up --build -d`
   - `cd ../frontend && docker compose up --build`
3. URLs:
   - FE: `http://localhost:3000`
   - BE: `http://localhost:8001/api`
