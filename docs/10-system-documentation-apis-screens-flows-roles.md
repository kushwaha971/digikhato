# 10 - System Documentation (APIs, Screens, Flows, Roles)

Last updated: 2026-04-18  
Source of truth: current `backend/` and `frontend/` implementation in this repository.

## 1. System At A Glance

- Frontend: Next.js App Router + RTK Query + Axios (`/api` base).
- Backend: Django + DRF + JWT (access token + httpOnly refresh cookie).
- Core business objects:
  - `User` (roles: `super_admin`, `admin`, `collector`, `borrower`)
  - `Borrower`
  - `Loan` + `Collection` (loan-level collections)
  - `Account` + `DailyCollection` (account-level collections)
- Pagination default: DRF page number, `page_size=20`.

## 2. API Documentation

## 2.1 Global API Conventions

- Base path: `/api/*`
- Auth header: `Authorization: Bearer <access_token>`
- Refresh flow:
  - Frontend auto-calls `POST /api/auth/token/refresh/` on `401`.
  - Refresh token is read from httpOnly cookie (`refresh_token`).
- Paginated list response shape:
  - `{ count, next, previous, results: [...] }`

## 2.2 API Catalog (By Module)

### A) Authentication & Profile

| API | Purpose | Request (key fields) | Response (key fields) | Used By Screens/Modules | Backend Access |
|---|---|---|---|---|---|
| `POST /auth/login/` | Sign in and issue access token + refresh cookie | `mobile_number`, `password` | `access`, `user` | `/login` | Public |
| `POST /auth/signup/` | Create user | `full_name`, `mobile_number`, `password`, `role`, `branch_name?` | user object | `/signup`, Team create, Super Admin tenant create | Public |
| `POST /auth/logout/` | Logout and blacklist refresh token | none | `detail` | `/settings` | Authenticated |
| `POST /auth/token/refresh/` | Refresh access token from cookie | cookie-only | `access` | RTK base query re-auth flow | Public (cookie required) |
| `GET /auth/me/` | Current user profile | none | user object | `useAuth` hook (currently not mounted globally) | Authenticated |
| `PATCH /auth/me/` | Update profile/preferences | `full_name`, `mobile_number`, `branch_name`, `theme_preference`, `onboarding_completed` | updated user | `/settings`, `/onboarding` | Authenticated |
| `POST /auth/change-password/` | Change password | `old_password`, `new_password` | `detail` | `/settings` | Authenticated |

### B) Onboarding

| API | Purpose | Request | Response | Used By | Backend Access |
|---|---|---|---|---|---|
| `GET /onboarding/profile/` | Fetch/create business profile | none | `id`, `business_name`, `area_name`, `currency`, `is_onboarded` | `/onboarding` | Authenticated |
| `PATCH /onboarding/profile/` | Save business profile | `business_name`, `area_name`, `currency`, `is_onboarded` | updated profile | `/onboarding` | Authenticated |

### C) Team / Tenant User Management

| API | Purpose | Request | Response | Used By | Backend Access |
|---|---|---|---|---|---|
| `GET /users/team/?role=` | List team users | optional query `role` | list of users | `/team`, `/super-admin/dashboard`, `/super-admin/tenants` | Authenticated (`super_admin` sees admins, `admin` sees tenant users, others empty) |
| `POST /users/team/` | Create team member | signup payload | created user | `/team`, `/super-admin/tenants/create` | `admin`, `super_admin` |
| `GET /users/team/{id}/` | Get member detail | path id | user | not directly wired in UI | Authenticated |
| `PATCH /users/team/{id}/` | Update member profile | profile fields | user | not directly wired in UI | `admin`, `super_admin` |
| `DELETE /users/team/{id}/` | Delete member | path id | 204 | `/team` | `admin` (`super_admin` blocked; should deactivate instead) |
| `POST /users/team/{id}/toggle-status/` | Activate/deactivate member | none | user | `/team`, `/super-admin/dashboard`, `/super-admin/tenants` | `admin`, `super_admin` |

### D) Borrowers

| API | Purpose | Request | Response | Used By | Backend Access |
|---|---|---|---|---|---|
| `GET /borrowers/` | List/search/filter borrowers | `search`, `status`, `assigned_agent`, `ordering`, `page` | paginated borrower list | `/dashboard` search, `/borrowers`, global top search | `admin`, `collector` |
| `POST /borrowers/` | Create borrower | borrower fields | borrower object | `/borrowers/add` | `admin` (collector blocked) |
| `GET /borrowers/{id}/` | Borrower detail | path id | borrower object | `/borrowers/[id]`, edit page preload | `admin`, `collector` |
| `PATCH /borrowers/{id}/` | Update borrower / toggle status | partial borrower fields | borrower object | `/borrowers/[id]`, `/borrowers/[id]/edit` | `admin` (collector blocked) |
| `DELETE /borrowers/{id}/` | Delete borrower | path id | 204 | `/borrowers/[id]` | `admin` (collector blocked) |

### E) Loans (Loan Ledger)

| API | Purpose | Request | Response | Used By | Backend Access |
|---|---|---|---|---|---|
| `GET /loans/` | List loans | `status`, `borrower`, `search`, `ordering`, `page` | paginated loan list | `/loans`, `/borrowers/[id]`, `/portal` | Authenticated (scoped by role) |
| `POST /loans/` | Create loan and compute amounts | `borrower`, `principal`, `interest_rate`, `interest_type`, `tenure_days`, `start_date` | loan with computed `total_amount`, `daily_emi`, `outstanding_balance` | `/loans/create`, `LoanDrawer` | `admin`, `borrower`, `super_admin` (collector blocked) |
| `GET /loans/{id}/` | Loan detail | path id | loan object | `/loans/[id]`, `/loans/[id]/edit` | Authenticated |
| `PATCH /loans/{id}/` | Update loan and recompute amounts | partial loan fields | updated loan | `/loans/[id]/edit` | `admin`, `borrower`, `super_admin` (collector blocked) |
| `DELETE /loans/{id}/` | Delete loan | path id | 204 | (not wired in UI button) | `admin`, `borrower`, `super_admin` (collector blocked) |
| `GET /loans/overdue/` | Overdue loan list | none | paginated loan list | `/overdue` | Authenticated (role-scoped) |

### F) Collections (Loan Collection Ledger)

| API | Purpose | Request | Response | Used By | Backend Access |
|---|---|---|---|---|---|
| `GET /collections/` | List collection entries | `status`, `date`, `loan`, `borrower`, `sync_status`, `ordering`, `page` | paginated collection list | `/collections` history tab, `/collections/history` | Authenticated |
| `POST /collections/` | Add loan collection and recalc loan balances | `loan`, `borrower`, `date`, `amount_paid`, `status`, `notes`, optional GPS/sync | collection object | hook exists (`useCreateCollectionMutation`), currently not primary UI path | Authenticated (collector limited to assigned borrower) |
| `GET /collections/{id}/` | Collection detail | path id | collection object | legacy/history views | Authenticated |
| `PATCH /collections/{id}/` | Correct collection and recalc loan balances | partial collection fields | updated collection | hook exists (`useUpdateCollectionMutation`) | Authenticated |
| `DELETE /collections/{id}/` | Delete collection entry | path id | 204 | not wired in UI | Authenticated |
| `GET /collections/today-due/` | Today due list from active loans | none | paginated loans due | `/collections` today tab, `/collections/today` | Authenticated |

### G) Accounts (Account Ledger) + Daily Collections

| API | Purpose | Request | Response | Used By | Backend Access |
|---|---|---|---|---|---|
| `GET /accounts/` | List accounts | `status`, `borrower`, `search`, `ordering`, `page` | paginated account list | not primary list screen yet | Authenticated (role-scoped) |
| `POST /accounts/` | Create account | `borrower`, `amount_given`, `daily_interest_rate`, `duration_days` | account object | not wired (placeholder account-create screen) | Authenticated |
| `GET /accounts/{id}/` | Account detail | path id | account object | `/portal/accounts/[id]` | Authenticated (role-scoped) |
| `PATCH /accounts/{id}/` | Update account | partial account fields | account object | not wired | `admin` (object-level) |
| `DELETE /accounts/{id}/` | Delete account | path id | 204 | not wired | `admin` (object-level) |
| `GET /accounts/overdue/` | Overdue accounts | none | account list | not wired | Authenticated |
| `GET /accounts/summary/` | Account totals | none | totals + status counts | not wired | Authenticated |
| `GET /daily-collections/` | List account daily collections | `account`, `date`, `page` | paginated daily collection list | `/portal/accounts/[id]`, `/collections/[id]/edit` preload | Authenticated (role-scoped) |
| `POST /daily-collections/` | Record payment against account | `account`, `payment`, `date` | daily collection object | `/collections/entry`, `CollectionDrawer` | Authenticated |
| `GET /daily-collections/{id}/` | Daily collection detail | path id | daily collection object | not directly wired | Authenticated |
| `PATCH /daily-collections/{id}/` | Update daily collection | partial fields | daily collection object | `/collections/[id]/edit` | Authenticated |
| `DELETE /daily-collections/{id}/` | Delete daily collection | path id | 204 | not wired | Authenticated |
| `GET /daily-collections/today/` | Today daily collections | none | daily collection list | hook exists, no dedicated page | Authenticated |

### H) Dashboard & Reports

| API | Purpose | Request | Response | Used By | Backend Access |
|---|---|---|---|---|---|
| `GET /dashboard/summary/` | Dashboard KPIs | none | `today_collection_total`, `today_daily_collection_total`, `total_outstanding`, `active_loans`, `overdue_count`, `active_accounts`, `total_account_outstanding`, `overdue_accounts` | `/dashboard` | Authenticated |
| `GET /reports/daily/?date=` | Daily collection report | optional `date` | `date`, `total_collected`, `collections_count`, `collections[]` | `/reports` (Daily tab) | Authenticated |
| `GET /reports/loan/` | Account summary report | none | totals + `accounts[]` | `/reports` (Account Summary tab) | Authenticated |
| `GET /reports/overdue/` | Overdue account report | none | `overdue_count`, `total_overdue_amount`, `accounts[]` | `/reports` (Overdue tab) | Authenticated |

## 2.3 API Interconnection (How APIs Connect In Flow)

- Loan collection path:
  - `POST /collections/` and `PATCH /collections/{id}/` call service methods that recalculate `Loan.paid_amount` and `Loan.outstanding_balance` transactionally.
- Account collection path:
  - `POST /daily-collections/` updates `Account.amount_paid`, `Account.outstanding_amount`, and auto-closes account when balance reaches zero.
- Dashboard dependency:
  - Aggregates both loan collection (`collections`) and account collection (`daily_collections`) plus active loans/accounts.
  - Cache invalidated after collection writes.
- Reports dependency:
  - Reports are account/daily-collection based (`Account`, `DailyCollection`), not loan-collection based.

## 3. Screen-Level Documentation

## 3.1 Public/Auth Screens

| Route | Purpose | Key Components | User Actions | APIs Triggered |
|---|---|---|---|---|
| `/` | Marketing/landing | Hero, CTA buttons, feature cards | Go to login/signup | None |
| `/login` | Sign in | Login form, mobile/password inputs | Login | `POST /auth/login/` |
| `/signup` | Create admin account | Signup form | Register | `POST /auth/signup/` |

## 3.2 Operational Screens

| Route | Purpose | Key Components | User Actions | APIs Triggered | Intended Roles |
|---|---|---|---|---|---|
| `/onboarding` | Setup workspace | Onboarding form, completion card | Save business details | `GET/PATCH /onboarding/profile/`, `PATCH /auth/me/` | Admin (primarily) |
| `/dashboard` | KPIs + quick actions | KPI cards, sticky search, quick action tiles | Search borrowers, jump to modules | `GET /dashboard/summary/`, `GET /borrowers/`(search) | Admin, Collector |
| `/borrowers` | Borrower directory | Search bar, status filters, cards, pagination | View borrower, filter/search, add borrower | `GET /borrowers/` | Admin, Collector |
| `/borrowers/add` | Create borrower | Borrower form | Submit new borrower | `POST /borrowers/` | Admin |
| `/borrowers/[id]` | Borrower profile + loan hub | Borrower card, active/past loan cards, drawers | Edit/toggle/delete borrower, add loan, collect payment | `GET /borrowers/{id}/`, `GET /loans/`, `PATCH/DELETE /borrowers/{id}/`, `POST /loans/`, `POST /daily-collections/` | Admin, Collector (limited actions) |
| `/borrowers/[id]/edit` | Edit borrower | Borrower form | Save changes | `GET /borrowers/{id}/`, `PATCH /borrowers/{id}/` | Admin |
| `/loans` | Loan list | Search, filters, amount range, pagination | Open loan, create loan | `GET /loans/` | Admin, Collector |
| `/loans/create` | Create loan | Loan form | Submit loan | `POST /loans/` | Admin (UI may show to Collector, backend blocks collector) |
| `/loans/[id]` | Loan details | Loan summary card | Navigate to edit | `GET /loans/{id}/` | Admin, Collector |
| `/loans/[id]/edit` | Edit loan | Loan edit form | Save edits | `GET /loans/{id}/`, `PATCH /loans/{id}/` | Admin |
| `/collections` | Unified collections workspace | Today/History tabs, filters, due list, history cards | Collect from due list, view/correct entries | `GET /collections/today-due/`, `GET /collections/` | Admin, Collector |
| `/collections/today` | Today due-only screen | Search + due list | Start collection | `GET /collections/today-due/` | Admin, Collector |
| `/collections/entry` | Add account payment | Collection entry form | Submit payment | `POST /daily-collections/` | Admin, Collector |
| `/collections/[id]/edit` | Edit account payment | Entry form (prefilled) | Correct payment | `GET /daily-collections/`, `PATCH /daily-collections/{id}/` | Admin, Collector |
| `/collections/history` | Legacy collection history | Search + history cards | Open edit | `GET /collections/` | Admin, Collector |
| `/overdue` | Overdue loan list | Overdue cards | View overdue borrowers | `GET /loans/overdue/` | Admin, Collector |
| `/reports` | Reports console | Tabbed reports (daily, account summary, overdue) | Change tab/date, view summaries | `GET /reports/daily/`, `GET /reports/loan/`, `GET /reports/overdue/` | Admin |
| `/team` | Team management | Member cards, add modal, delete modal | Add/deactivate/delete members | `GET/POST /users/team/`, `POST /users/team/{id}/toggle-status/`, `DELETE /users/team/{id}/` | Admin |
| `/settings` | Profile, security, preferences | Profile form, password form, theme toggle | Update profile, change password, logout | `PATCH /auth/me/`, `POST /auth/change-password/`, `POST /auth/logout/` | All authenticated roles |

## 3.3 Borrower Portal Screens

| Route | Purpose | Key Components | User Actions | APIs Triggered | Intended Roles |
|---|---|---|---|---|---|
| `/portal` | Borrower home (my loans) | Welcome card, status filters, loan cards | View own loans, open account detail | `GET /loans/` | Borrower |
| `/portal/accounts/[id]` | Borrower account detail | Amount cards, payment history list | View payment history | `GET /accounts/{id}/`, `GET /daily-collections/` | Borrower |

## 3.4 Super Admin Screens

| Route | Purpose | Key Components | User Actions | APIs Triggered | Roles |
|---|---|---|---|---|---|
| `/super-admin/dashboard` | Platform KPIs (tenant-level) | KPI cards, tenant list, quick actions | Activate/deactivate tenant admins | `GET /users/team/`, `POST /users/team/{id}/toggle-status/` | Super Admin |
| `/super-admin/tenants` | Tenant admin directory | Search, tenant cards, status/edit actions | Search, edit, activate/deactivate | `GET /users/team/`, `PATCH /users/team/{id}/`, `POST /users/team/{id}/toggle-status/` | Super Admin |
| `/super-admin/tenants/create` | Create tenant admin | Form | Create admin tenant | `POST /users/team/` | Super Admin |

## 3.5 Placeholder / Partially Wired Screens

| Route | Status | Notes |
|---|---|---|
| `/borrowers/[id]/accounts/create` | Placeholder | UI exists but no API call wired |
| `/borrowers/[id]/accounts/[aid]` | Placeholder | Static summary, no account fetch wired |
| `/borrowers/[id]/accounts/[aid]/collect` | Placeholder | TODO mentions pending mutation wiring |

## 4. Flow & Interconnection

## 4.1 End-to-End Core Flow (Admin/Collector)

1. Signup/Login  
   APIs: `POST /auth/signup/`, `POST /auth/login/`.
2. Onboarding (first setup)  
   APIs: `GET/PATCH /onboarding/profile/`, `PATCH /auth/me/`.
3. Borrower onboarding  
   APIs: `POST /borrowers/`, `GET /borrowers/`.
4. Loan creation  
   APIs: `POST /loans/` (auto-calculates total and EMI).
5. Daily field collection  
   APIs used in current primary UI: `POST /daily-collections/`.
6. Review and corrections  
   APIs: `GET /collections/`, `PATCH /daily-collections/{id}/`.
7. Monitoring and reports  
   APIs: `GET /dashboard/summary/`, `GET /reports/*`.

## 4.2 Borrower Self-Service Flow

1. Borrower logs in.
2. Opens `/portal` to see loans.
3. Opens `/portal/accounts/[id]` for payment history.
4. Uses `/settings` for profile/password/theme.

## 4.3 Super Admin Flow

1. Super admin logs in.
2. Opens platform dashboard.
3. Creates tenant admin.
4. Activates/deactivates tenant admin accounts.
5. Manages tenant admin lifecycle from tenants list.

## 4.4 Module Dependencies

- `Borrower` is upstream dependency for `Loan` and `Account`.
- `Loan` is upstream for loan `Collection`.
- `Account` is upstream for `DailyCollection`.
- Dashboard depends on `Loan`, `Collection`, `Account`, `DailyCollection`.
- Reports depend on `Account` and `DailyCollection`.
- Team management (`users/team`) drives role setup and tenant structure.

## 5. Role-Based Behavior (Very Important)

## 5.1 Permission Principle

- Frontend permission model explicitly makes **Admin a superset of Collector**:
  - `admin` permissions include all `collector` permissions plus management capabilities.
- Backend also keeps core intent:
  - Collector is restricted for borrower and loan modification.
  - Admin can perform collector collection operations plus management actions.

## 5.2 Role Matrix

| Role | What They Can Do | Main Screens/Modules | API Access Pattern | Data Visibility |
|---|---|---|---|---|
| `super_admin` | Manage tenant admin accounts, activate/deactivate tenant admins | Super Admin dashboard, tenants, tenant create, settings | Uses team list/create/update/toggle APIs; delete is intentionally blocked | Intended: tenant admin accounts only (no tenant financial dashboard by UI) |
| `admin/owner` | Full operational control: borrowers, loans, collections, reports, team, settings | Dashboard, Borrowers, Loans, Collections, Reports, Team, Settings | Full use of operational APIs + team APIs | Tenant-wide business data |
| `collector` | Field operations: view assigned borrowers, collect payments, see dashboard/lists | Dashboard, Borrowers (assigned), Collections, Loans (view), Settings | Read + collection APIs; blocked from borrower/loan edits server-side | Assigned borrower subset only (for most operational endpoints) |
| `borrower` | View own portal data and manage own settings | Portal, Portal Account Detail, Settings | Borrower-facing reads and profile/security updates | Own borrower/account/payment history (intended) |

## 5.3 Role-Specific Details

### Super Admin

- Actions:
  - Create tenant admins.
  - Activate/deactivate tenant admins.
  - Edit tenant admin profile fields.
- Visible modules:
  - `Platform`, `Tenants`, `Settings` (sidebar/bottom nav).
- Data:
  - Tenant admin account data.
  - No financial tenant dashboards shown in super-admin UI.

### Admin / Owner

- Actions:
  - Everything collector can do.
  - Plus create/edit/delete borrowers and loans.
  - Manage team members and reports.
- Visible modules:
  - `Dashboard`, `Borrowers`, `Collections`, `Reports`, `Team`, `Settings`.
- Data:
  - Full tenant operational data.

### Collector

- Actions:
  - View assigned borrowers and due lists.
  - Enter/correct collections.
  - Access dashboard summaries.
- Visible modules:
  - `Dashboard`, `Borrowers`, `Collections`, `Settings`.
- Data:
  - Assigned borrower subset (backend scope on borrower/loan/collection queries).

### Borrower

- Actions:
  - View own loans/accounts/payments in portal.
  - Update profile/password/theme in settings.
- Visible modules:
  - `My Loans (Portal)`, `Settings`.
- Data:
  - Personal loan/account/payment context in portal flow.

## 6. Post-Login Experience By Role

Note: current login page redirects all roles to `/dashboard`.

| Role | Immediate Post-Login Destination (Current) | Expected Home In UX | Menus Available | Highlighted Actions |
|---|---|---|---|---|
| Super Admin | `/dashboard` (current hardcoded behavior) | `/super-admin/dashboard` | Platform, Tenants, Settings | Create tenant, activate/deactivate tenants |
| Admin | `/dashboard` | `/dashboard` | Dashboard, Borrowers, Collections, Reports, Team, Settings | Add borrower, add loan, collect payments, run reports |
| Collector | `/dashboard` | `/dashboard` | Dashboard, Borrowers, Collections, Settings | Today due collections, borrower lookup |
| Borrower | `/dashboard` (current hardcoded behavior) | `/portal` | My Loans, Settings | View loan status, payment history |

## 7. UX / Product Perspective (Practical, Field-Friendly)

- Keep primary daily path to 3 taps:
  - `Dashboard -> Today Dues -> Collection Entry`.
- Minimize typing for field teams:
  - Keep borrower search visible.
  - Pre-fill date/amount where possible.
- Prioritize low-friction corrections:
  - “Correct Entry” links in collection history are important for real-world cash mismatch situations.
- For rural/offline-prone usage:
  - Keep status visibility simple (`paid/partial/missed`).
  - Keep critical actions available from mobile bottom navigation.
- Role-focused home:
  - Borrower and super-admin should land on role-specific home immediately after login.

## 8. Important Current-State Notes (Implementation Reality)

1. Login redirect is currently hardcoded to `/dashboard` for all roles.
2. There are two parallel collection models in use:
   - Loan-based: `Collection` (`/collections/*`)
   - Account-based: `DailyCollection` (`/daily-collections/*`)
3. Primary collection entry screen uses `DailyCollection`, while due list uses loan APIs.
4. Some screens are placeholders and not API-wired yet (`/borrowers/[id]/accounts/*` paths).
5. Collector UI currently exposes “Create Loan” in some places, but backend rejects collector loan creation.
