# Figma Design Descriptions (Phase 1 + Phase 2)

## Objective
Define design-level behavior for each module/feature/sub-feature so implementation and QA align with expected UX.

## Global UX Standards
- All create/edit actions in list workflows should open in Drawer where feasible.
- Do not display raw UUIDs in user-visible labels, dropdowns, cards, or tables.
- Use consistent status badges, skeleton loaders, and empty states.
- Respect role-aware visibility for destructive/approval actions.
- Mobile responsiveness is mandatory for all primary workflows.

## Screen Specifications

### 1. Dashboard
- Cards: sales today, outstanding snapshot, inventory health, alerts.
- Actions: quick links to billing, inventory, customers, reports.
- Behavior: tenant-scoped data; branch-aware filters where applicable.

### 2. Billing and Sales
- List page: filter pills, view switchers (tax invoice, estimate, credit note, messages, e-invoice).
- Detail page: primary actions + overflow menu, role-aware cancel, convert estimate action.
- Form experience: drawer/open form sections, line builder, old-gold, split payment.
- Compliance states: IRN warning banners and action disclaimers.

### 3. Inventory
- Main grid: SKU, metal/purity, HUID/barcode, status, branch.
- Purity/HUID views: summary cards, trace panels, search validation.
- Stock movement history and transfer statuses must be visible.

### 4. Customers
- Search-first list with quick add/edit.
- Detail: profile + purchase/outstanding summary.
- Behavior: concise insights for counter staff, expandable detail for manager/admin.

### 5. Karigar
- List cards and edit drawer with active/inactive controls.
- Warning dialog on inactivation with open issues.
- Performance summary section (issued, returned, wastage, open jobs).

### 6. Outstanding
- Bucket cards (0-30, 31-60, etc.), movement drawer.
- Manual adjustment flow with strict validation and notes requirement.

### 7. Gold Pledge
- Form with clear valuation and LTV feedback.
- Detail timeline for loan state transitions and repayments.

### 8. Admin and Governance Screens
- Admin controls: feature flags, lock period, trash restore.
- Users and roles: assignment/revoke with confirmation.
- Multi-branch: transfer summary and status filtering.

### 9. Form Settings (Brandhub-style Metadata Cards)
- Screen: `Admin > Form Settings`
- Layout: card grid/list where each card represents a jewellery metadata domain (for example Billing Form, Pledge Form, Inventory Form, Branch Defaults).
- Card actions:
  - `View fields`
  - `Add metadata`
  - `Edit metadata`
  - `Disable/Archive metadata`
- Detail panel/drawer: field-level configuration (label, type, required, placeholder, validations, default, options source, ordering).
- Governance UI states:
  - permission denied state for non-admins
  - audit marker/last-updated-by
  - validation and conflict messages
- UX rule: metadata management must be UI-first; script/edit-based metadata is hidden from normal admin workflow.

## Figma Handoff Metadata Template
For each frame/component:
- `Module`
- `Feature`
- `Sub-feature`
- `Intent`
- `Primary Actor`
- `Entry Point`
- `Success State`
- `Error/Validation States`
- `Permission Rules`
- `API Dependencies`
- `Test Case IDs`

## Pending Design Work Before Phase 3
- Job-card lifecycle visuals (karigar deep flow).
- Full pledge lifecycle screens (closure/forfeit/settlement).
- External notification delivery status UX.
- Advanced analytics dashboards.
- Finalized Form Settings metadata card interactions (Jewellery module only).
