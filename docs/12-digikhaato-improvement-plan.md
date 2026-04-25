# DigiKhaato Improvement Plan — Agent Task Tracker

> Last updated: 2026-04-24
> Owner: Akash Kushwaha
> Agent: Claude (Sonnet 4.6)

---

## Project Context

**Codebase**: Next.js 14 App Router + Tailwind CSS + Redux Toolkit + RTK Query + Django backend  
**Brand name**: DigiKhaato (market name) — codebase currently says "DailyBook" in some places  
**Auth**: JWT in localStorage + httpOnly refresh cookie  
**No UI library** — all components are custom-built  
**Domain**: digikhaato.com

---

## Audit Findings (Phase 1 — COMPLETE ✅)

| Area | Finding |
|---|---|
| Framework | Next.js 14.2.15 App Router, React 18, TypeScript |
| Styling | Tailwind CSS 3.4 + CSS custom properties (no component library) |
| State | Redux Toolkit + RTK Query |
| Forms | Formik + Yup |
| Auth | JWT (localStorage) + httpOnly refresh cookie, mobile + password |
| Routing | App Router (`src/app/`), client-side route guard (`RouteGuard.tsx`) |
| Brand conflict | `BrandLogo` says "DailyBook", mobile nav says "Digikhaato" |
| Landing page | Thin hero-only page at `src/app/page.tsx` — needs full rewrite |
| Loan module | Fully built (loans, borrowers, collections, reports, team) |
| Free features | Customer Ledger and Notes — NOT built yet, only planned |
| Public SEO pages | None exist yet — only `/`, `/login`, `/signup` |
| Dashboard | Has stat cards + recent collections — needs module cards added |

---

## Task List

### ✅ DONE

- [x] **Phase 1: Full project audit** — Framework, routing, auth, styling, components, folder structure all documented
- [x] **Task 1: Login/Signup — mobile number only** — Password removed from login + signup (frontend + backend). Django serializer updated to lookup by mobile only and auto-generate password on signup.
- [x] **Task 2: DigiKhaato branding** — BrandLogo updated (text + ₹ SVG icon + tagline). AppShell mobile header fixed. layout.tsx SEO metadata updated.
- [x] **Task 3: Homepage rewrite** — Full 7-section landing page (Navbar, Hero, Features, How It Works, Why DigiKhaato, FAQ, Footer). SEO metadata added.
- [x] **Task 4: 6 SEO feature pages** — All 6 routes created with metadata, H1/H2 structure, FAQs, CTAs, internal links.
- [x] **Task 5: Dashboard module cards** — "Your Modules" section added to dashboard with Free/Trial/Active badges.

---

### 🔄 IN PROGRESS

*(nothing currently in progress)*

---

### 📋 TODO — Ordered by Priority

---

#### TASK 1 — Login: Mobile Number Only (No Password)
**Status**: ✅ DONE  
**Files to change**:
- `frontend/src/app/login/page.tsx` — Remove `PasswordInput`, update form to only show mobile number field
- `frontend/src/validation/auth.validation.ts` — Update `loginValidationSchema` and `loginInitialValues` to drop `password` field
- `frontend/src/features/auth/auth-api.ts` — Update `LoginRequest` interface to remove `password`
- `backend/` — Update Django `auth/login/` endpoint to accept mobile number only (no password check)

**What to do**:
- Login page: Show only mobile number input → "Sign In" button
- Remove `PasswordInput` import and `password` field from form
- Update validation schema: only `mobile_number` required
- Update `LoginRequest` type: remove `password`
- Backend Django view: remove password validation, lookup user by mobile, return JWT
- Remove `/reset-password` link from login page (no password = no reset)
- Signup page: Also remove password field, update similarly

**Note**: No OTP for now. Just mobile number → auto login.

---

#### TASK 2 — BrandLogo: Switch to DigiKhaato Branding
**Status**: ⏳ Todo  
**Files to change**:
- `frontend/src/components/branding/BrandLogo.tsx`

**What to do**:
- Replace "DailyBook" text with "DigiKhaato" (`Digi` normal + `Khaato` in primary color)
- Update SVG icon: ledger book + ₹ symbol in the mark
- Colors: keep existing primary gradient OR add blue-to-green gradient for trust + growth feel
- Update tagline from "Loan Collection Platform" to "Digital Bahi Khata for Every Business"
- Update footer copyright from "DailyBook" to "DigiKhaato" in `page.tsx`
- Update login page subtitle from "DailyBook account" to "DigiKhaato account"
- Update mobile nav header from "Digikhaato" to "DigiKhaato" (consistent casing) in `AppShell.tsx`

---

#### TASK 3 — Public Homepage: Full Rewrite
**Status**: ⏳ Todo  
**Files to change**:
- `frontend/src/app/page.tsx` — Complete rewrite
- `frontend/src/app/layout.tsx` — Add root-level SEO metadata

**Sections to build**:
1. **Sticky Navbar** — Logo | Home | Features | Pricing | Contact | Login | Sign Up Free
2. **Hero** — Headline: "All-in-One Digital Khata, Loan & Library Management Software for Indian Businesses" + subheadline + 2 CTAs
3. **Feature Overview Grid** — 6 cards (3 free + 3 paid) with icons, names, descriptions, badges
4. **Free Tools Section** — Customer Ledger + Notes highlighted as free after login
5. **Paid Modules Section** — Library, Daily Collection, Loan Management
6. **How DigiKhaato Works** — 3-step visual: Sign Up → Add Customers → Track Everything
7. **Why DigiKhaato** — 4 trust points: India-focused, Mobile-first, Secure, Simple
8. **FAQ Section** — 8 questions with JSON-LD schema
9. **Final CTA Banner** — "Start Free Today" → `/signup`
10. **Footer** — Links + copyright DigiKhaato 2026

**SEO requirements**:
- `generateMetadata()` with title, description, Open Graph
- Semantic H1 → H2 → H3 hierarchy
- Target keywords: "digital khata book", "customer ledger app", "khatabook alternative", "loan management software"

---

#### TASK 4 — 6 SEO Feature Pages
**Status**: ⏳ Todo  
**New files to create**:

| Route | File | Title |
|---|---|---|
| `/customer-ledger-app` | `src/app/customer-ledger-app/page.tsx` | Free Customer Ledger App \| Digital Khata Book |
| `/digital-khata-book` | `src/app/digital-khata-book/page.tsx` | Digital Khata Book for Credit and Payment Tracking |
| `/notes-app` | `src/app/notes-app/page.tsx` | Free Online Notes App for Work & Personal Use |
| `/library-seat-management-system` | `src/app/library-seat-management-system/page.tsx` | Library Seat Management System with Shift Booking |
| `/daily-collection-app` | `src/app/daily-collection-app/page.tsx` | Daily Collection App for Installments and Chit Fund |
| `/loan-management-software` | `src/app/loan-management-software/page.tsx` | Loan Management Software for EMI and Borrower Tracking |

**Each page must have**:
- `generateMetadata()` — SEO title + description + OG tags
- H1 main headline
- H2 sections: What it is, Features, How it works, Who it's for, FAQ
- Benefits list
- CTA: "Login to Use Free" (Customer Ledger, Notes) OR "Start Free Trial" (others)
- Internal links to related feature pages
- JSON-LD FAQ schema

**Note**: These are pure marketing/SEO pages. No login required to view.

---

#### TASK 5 — Dashboard Module Cards
**Status**: ⏳ Todo  
**Files to change**:
- `frontend/src/app/dashboard/page.tsx` — Add module cards section

**What to add**:
A new "Your Modules" section on the dashboard with cards:

| Module | Icon | Status Badge | CTA |
|---|---|---|---|
| Customer Ledger | 📒 | Free | Open |
| Notes | 📝 | Free | Open |
| Library Seat Management | 🪑 | Trial | Start Trial |
| Daily Collection | 💵 | Trial | Start Trial |
| Loan Management | 🏦 | Active | Manage |

Each card: icon + name + short description + colored status badge + CTA button  
Reuse existing `Card` component and `Badge` component from UI library.

---

#### TASK 6 — Customer Ledger Feature (Basic UI)
**Status**: ⏳ Todo  
**New files to create**:
- `frontend/src/app/customer-ledger/page.tsx` — Main ledger page (requires login)
- `frontend/src/app/customer-ledger/layout.tsx` — RouteGuard wrapper

**UI to build**:
- Customer list with search bar
- "Add Customer" button → inline form or modal (name + mobile)
- Per customer: credit given, payment received, running balance
- Transaction history list (date | type | amount | balance)
- Empty state when no customers yet
- Mobile-responsive layout using existing `Screen`, `Card`, `Button`, `Modal` components

**Backend needed** (Django):
- `GET/POST /api/customer-ledger/customers/`
- `GET /api/customer-ledger/customers/:id/transactions/`
- `POST /api/customer-ledger/customers/:id/credit/`
- `POST /api/customer-ledger/customers/:id/payment/`

*(If backend not ready, create frontend with mock data and TODO comments)*

---

#### TASK 7 — Notes Feature (Basic UI)
**Status**: ⏳ Todo  
**New files to create**:
- `frontend/src/app/notes/page.tsx` — Notes list (requires login)
- `frontend/src/app/notes/layout.tsx` — RouteGuard wrapper

**UI to build**:
- Notes grid/list (title + snippet + last edited)
- "New Note" button → modal or inline editor
- Edit note (title + body textarea)
- Delete note with ConfirmDialog
- Empty state
- Mobile-responsive using existing components

**Backend needed** (Django):
- `GET/POST /api/notes/`
- `GET/PATCH/DELETE /api/notes/:id/`

*(If backend not ready, create frontend with localStorage-based mock)*

---

#### TASK 8 — Gym Membership Management System
**Status**: ⏳ Todo (build later)  
**Shown as**: "Coming Soon" on homepage already  
**New files to create**:
- `frontend/src/app/gym-membership/page.tsx` — Main gym page (requires login)
- `frontend/src/app/gym-membership/layout.tsx` — RouteGuard wrapper
- `frontend/src/app/gym-management-software/page.tsx` — SEO marketing page

**UI to build**:
- Member list with search (name, phone, plan)
- Add Member form (name + mobile + plan type + start date)
- Plan types: Monthly / Quarterly / Annual
- Fee status per member (paid / due / expired)
- Renewal alerts for expiring memberships
- Attendance tracking (optional)
- Empty state + mobile-responsive layout

**Backend needed** (Django):
- New app `apps/gym/`
- `GET/POST /api/gym/members/`
- `GET/PATCH /api/gym/members/:id/`
- `POST /api/gym/members/:id/renew/`
- `GET /api/gym/members/expiring/` — members expiring in next 7 days

**SEO page** (`/gym-management-software`):
- Target keywords: gym membership management software, gym management system, fitness centre member tracking
- CTA: "Start Free Trial →" → /signup

---

#### TASK 9 — SEO Technical Polish
**Status**: ⏳ Todo  
**Files to change**:
- `frontend/src/app/layout.tsx` — Root metadata, OG tags, canonical
- All public pages — `generateMetadata()` if not already added
- `frontend/public/` — Update manifest, favicon if needed

**What to add**:
- Root-level Open Graph metadata (site name, default image, type)
- JSON-LD Organization schema on homepage
- JSON-LD FAQ schema on homepage + feature pages
- `robots` meta tag on all auth/dashboard pages (`noindex, nofollow`)
- Sitemap consideration (Next.js `app/sitemap.ts`)
- `alt` text on all SVG icons and images

---

#### TASK 9 — Lint + Build Validation
**Status**: ⏳ Todo (last step after all implementation)  
**Commands to run**:
```bash
cd frontend && npm run lint
cd frontend && npm run build
```
**Check**:
- No TypeScript errors
- No ESLint errors
- Existing Loan Management still navigates correctly
- Login flow works with mobile-only

---

## File Change Summary (planned)

| File | Change Type | Task |
|---|---|---|
| `src/app/login/page.tsx` | Update | Task 1 |
| `src/validation/auth.validation.ts` | Update | Task 1 |
| `src/features/auth/auth-api.ts` | Update | Task 1 |
| `backend/...auth views` | Update | Task 1 |
| `src/components/branding/BrandLogo.tsx` | Update | Task 2 |
| `src/components/layout/AppShell.tsx` | Update | Task 2 |
| `src/app/page.tsx` | Full rewrite | Task 3 |
| `src/app/layout.tsx` | Update metadata | Task 3 + 8 |
| `src/app/customer-ledger-app/page.tsx` | New file | Task 4 |
| `src/app/digital-khata-book/page.tsx` | New file | Task 4 |
| `src/app/notes-app/page.tsx` | New file | Task 4 |
| `src/app/library-seat-management-system/page.tsx` | New file | Task 4 |
| `src/app/daily-collection-app/page.tsx` | New file | Task 4 |
| `src/app/loan-management-software/page.tsx` | New file | Task 4 |
| `src/app/dashboard/page.tsx` | Update | Task 5 |
| `src/app/customer-ledger/page.tsx` | New file | Task 6 |
| `src/app/customer-ledger/layout.tsx` | New file | Task 6 |
| `src/app/notes/page.tsx` | New file | Task 7 |
| `src/app/notes/layout.tsx` | New file | Task 7 |

---

## Do Not Touch (Safe Zones)

- `src/app/loans/` — Loan Management (fully working, do not break)
- `src/app/borrowers/` — Borrower Management
- `src/app/collections/` — Collections
- `src/app/reports/` — Reports
- `src/app/team/` — Team management
- `src/app/portal/` — Borrower portal
- `src/app/super-admin/` — Super admin
- `src/store/` — Redux store (except auth-slice minor type update)
- `src/components/ui/` — UI primitives (only consume, don't modify)
- `tailwind.config.ts` — No new colors or tokens needed
- `globals.css` — No changes to CSS variables

---

## Design Rules (must follow in all new UI)

1. Use `app-panel` class for cards/panels (not raw `bg-white`)
2. Use `text-text`, `text-muted` classes (not raw `text-neutral-*`)
3. Use `Button` component with correct variants (`primary`, `outline`, `ghost`, `secondary`)
4. Use `Card` component for all feature cards
5. Use `Badge` component for status labels
6. Use `Screen` layout wrapper for all authenticated pages
7. Use `Modal` + `ConfirmDialog` for confirmations
8. Poppins font is already loaded — no new fonts
9. Primary color token is `--primary` / `primary-500` (crimson/hot-pink `#e03060`)
10. Dark mode is automatic via CSS variables — no manual dark: classes needed for panel backgrounds
