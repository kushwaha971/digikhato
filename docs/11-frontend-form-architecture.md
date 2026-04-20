# 11 - Frontend Form Architecture (Formik + Yup Standard)

## Scope
This document defines the enforced form architecture across the frontend app (portal + admin + super-admin).

## 1) Folder Structure

```text
frontend/src/
  constants/
    regex.ts
  validation/
    common.ts
    auth.validation.ts
    borrower.validation.ts
    loan.validation.ts
    collection.validation.ts
    user.validation.ts
    settings.validation.ts
    onboarding.validation.ts
    account.validation.ts
    index.ts
  components/
    forms/
      AccountForm.tsx
      BorrowerForm.tsx
      DailyCollectionForm.tsx
      LoanForm.tsx
      TeamMemberForm.tsx
      index.ts
      system/
        FormPrimitives.tsx
        FormInputs.tsx
        formik.ts
        index.ts
```

## 2) Regex Constants (Centralized)
- File: `frontend/src/constants/regex.ts`
- Contains reusable regex for:
  - mobile
  - email
  - strong password
  - amount
  - name
  - OTP / numeric
  - pin code
  - ISO date

## 3) Shared Validation Helpers
- File: `frontend/src/validation/common.ts`
- Shared helpers include:
  - `requiredMessage`, `minLengthMessage`, `maxLengthMessage`
  - `trimObjectValues`, `normalizeMobile`, `normalizeEmail`
  - reusable Yup fragments (`mobileSchema`, `currencyAmountSchema`, etc.)
  - backend error parsing and mapping:
    - `parseBackendErrors`
    - `mapBackendErrorsToFormik`
    - `focusFirstInvalidField`

## 4) Reusable Form Component System
- Files:
  - `frontend/src/components/forms/system/FormPrimitives.tsx`
  - `frontend/src/components/forms/system/FormInputs.tsx`
- Standardized components:
  - `FormLabel`, `FormErrorText`, `FormHelperText`, `FormSection`, `FormFieldWrapper`, `FormErrorBanner`
  - `TextInput`, `TextArea`, `SelectInput`, `PasswordInput`, `EmailInput`, `MobileNumberInput`, `NumberInput`, `CurrencyInput`, `DateInput`, `Checkbox`, `RadioGroup`
- All field components support:
  - label, name, value, onChange, onBlur
  - touched/error
  - required/disabled/placeholder/helperText
  - `data-testid`
  - prefix/suffix where relevant

## 5) Formik + Yup Pattern
Standard pattern used across forms:
- `initialValues`
- `validationSchema`
- `useFormik`
- touched-based inline errors
- submit-level `FormErrorBanner`
- loading + disabled submit state
- backend error mapping via `mapBackendErrorsToFormik`
- focus first invalid field via `focusFirstInvalidField`

## 6) Refactored Forms
### Auth
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/signup/page.tsx`

### Onboarding
- `frontend/src/app/onboarding/page.tsx`

### Borrower
- `frontend/src/components/forms/BorrowerForm.tsx`
- `frontend/src/app/borrowers/add/page.tsx`
- `frontend/src/app/borrowers/[id]/edit/page.tsx`

### Loan
- `frontend/src/components/forms/LoanForm.tsx`
- `frontend/src/app/loans/create/page.tsx`
- `frontend/src/app/loans/[id]/edit/page.tsx`

### Collection
- `frontend/src/components/business/CollectionEntryForm.tsx`
- `frontend/src/components/forms/DailyCollectionForm.tsx`
- `frontend/src/app/collections/entry/page.tsx`
- `frontend/src/app/collections/[id]/edit/page.tsx`
- `frontend/src/app/borrowers/[id]/accounts/[aid]/collect/page.tsx`

### Team/User
- `frontend/src/components/forms/TeamMemberForm.tsx`
- `frontend/src/app/team/page.tsx`
- `frontend/src/app/super-admin/tenants/create/page.tsx`

### Account
- `frontend/src/components/forms/AccountForm.tsx`
- `frontend/src/app/borrowers/[id]/accounts/create/page.tsx`

### Settings / Password
- `frontend/src/app/settings/page.tsx`

## 7) Error UI Pattern
- Field-level errors:
  - shown only after touched (`touched && error`)
  - red border + red text
- Form-level errors:
  - shown in `FormErrorBanner`
- API errors:
  - mapped to field errors when possible
  - non-field errors shown in form banner
- Global snackbars:
  - backend messages parsed and rendered

## 8) Backend Error Mapping Strategy
- Form-level mapping:
  - `mapBackendErrorsToFormik(error, helpers, knownFields)`
- General parser:
  - `parseBackendErrors(errorPayload)`
- Handles:
  - `detail`
  - `message`
  - `non_field_errors`
  - field arrays `{ field: ["..."] }`
  - nested error structures

## 9) Styling Token Guidance
Use existing global tokens in `frontend/src/app/globals.css`:
- `--border`, `--border-strong`
- `--primary`, `--ring`
- `--danger`, `--text`, `--muted`

Form states standardized in `FormInputs.tsx`:
- normal: border + surface
- hover: stronger border
- focus: primary border + ring
- error: danger border + danger ring
- disabled/read-only styles

## 10) Migration Strategy
1. Build shared form system and validation layer first.
2. Migrate high-traffic auth + onboarding forms.
3. Migrate domain forms (borrower/loan/collection/account).
4. Migrate admin/super-admin management forms.
5. Migrate settings/profile/password forms.
6. Remove legacy form/validation stack (`react-hook-form`, `zod`) once no references remain.
7. Validate with full production build.

## Completed Enforcement
- Form architecture now uses Formik + Yup on active form surfaces.
- Validation is centralized.
- Regex is centralized.
- UI behavior for errors is standardized.
- Backend errors now map into field and form-level feedback.
