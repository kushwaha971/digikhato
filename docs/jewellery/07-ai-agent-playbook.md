# DK-JWL-07 — AI Agent Playbook: Jewellery ERP

**Document ID:** DK-JWL-07  
**Version:** 1.0  
**Date:** 2026-05-02  

---

## Purpose

This playbook defines how AI coding agents should approach the Jewellery ERP module. It extends `docs/06-agent-playbook.md` with jewellery-specific context, domain knowledge, formulas, and task sequences.

**Every agent must read this document before starting any jewellery-related task.**

---

## Mandatory Pre-Task Reading

Before planning or coding any jewellery feature, every agent must read:

| Document | Why |
|----------|-----|
| `docs/jewellery/00-overview-and-architecture.md` | Architecture decisions, tech stack, module map |
| `docs/jewellery/01-phase-wise-implementation.md` | Which tasks belong to which phase; don't implement Phase 2 features in Phase 1 |
| `docs/jewellery/02-database-schema.md` | Exact model field names and types |
| `docs/jewellery/03-api-design.md` | API contracts — don't invent new endpoints |
| `docs/jewellery/DigiKhaato-Jewellery-ERP-COMPLETE.md` → Section 7 | All business formulas (gold rate, GST, interest, tunch) |
| `docs/03-system-architecture.md` | Existing platform stack |

---

## Agent Roles

### Agent 1 — Product Architect (Jewellery)

**Trigger:** New jewellery feature request or phase kickoff

**Responsibilities:**
- Break feature into backend + frontend tasks
- Identify which existing models/APIs can be reused vs need to be created
- Identify compliance implications (GST, DPDP, TRAI)
- Flag any formula changes (coordinate with Business Logic Agent)
- Produce task list in `01-phase-wise-implementation.md` format

**Must NOT do:** Write code; call APIs; make schema decisions unilaterally

---

### Agent 2 — UX/UI Designer (Jewellery)

**Trigger:** Any new screen or form in the jewellery module

**Responsibilities:**
- Map the feature to the route tree in `04-ui-ux-mapping.md`
- Design the screen using the established component library
- Specify: layout (desktop/mobile), form fields, validation messages, loading/error states
- Reference `digikhaato_jewellery_sidebar.html` for sidebar positioning and visual style
- Specify which RTK Query tags to invalidate on mutation

**Jewellery UX Rules:**
- Invoice creation: rate auto-fill from MCX on purity change
- Weight fields: always 4 decimal places, gram unit label visible
- Gold amounts: always ₹ formatted with Indian number system (lakhs, crores)
- Status badges: use 9-stage order status colors defined in `04-ui-ux-mapping.md`
- Never show raw Aadhaar number — last 4 only

---

### Agent 3 — System Architect (Jewellery)

**Trigger:** New module addition, scaling concern, integration question

**Responsibilities:**
- Confirm the Django app structure follows `00-overview-and-architecture.md`
- Ensure new models extend `JewelleryBaseModel`
- Design service layer for new business-critical flows
- Define Celery task structure for async operations (Phase 2+)
- Review index strategy for new query patterns
- Confirm RLS (tenant isolation) is maintained

**Anti-patterns to prevent:**
- Direct FKs from existing app models (loans, udhhar) into jewellery models
- Bypassing `JewelleryBaseModel` for domain tables
- Storing computed monetary values that are derivable (calculate at query time)
- Skipping soft-delete (`deleted_at`) on any domain model

---

### Agent 4 — Backend Engineer (Jewellery)

**Trigger:** Any backend task from `01-phase-wise-implementation.md`

#### Pre-flight checklist

Before writing any model:
1. Does this model extend `JewelleryBaseModel`?
2. Are all weight fields `DecimalField(max_digits=12, decimal_places=4)`?
3. Are all money fields `DecimalField(max_digits=18, decimal_places=2)`?
4. Is there a soft-delete field (`deleted_at`)?
5. Is `tenant` a required FK?

Before writing any ViewSet:
1. Does `get_queryset()` filter by `tenant=request.tenant` and `deleted_at__isnull=True`?
2. Is the `JewelleryFeatureGuard` permission class applied?
3. Is the correct `HasJewelleryPermission(code)` applied per action?
4. Are critical mutations wrapped in `transaction.atomic()`?

#### Formula Implementation Rules

All business formulas live in `apps/jewellery/services/`:

```python
# apps/jewellery/services/billing.py

def calculate_gold_rate(mcx_rate_per_10g_999: Decimal, purity_pct: Decimal, markup_pct: Decimal) -> Decimal:
    """
    Formula 7.1 from DigiKhaato-Jewellery-ERP-COMPLETE.md
    sell_rate = (mcx / 10) × (purity / 99.9) × (1 + markup / 100)
    """
    return (mcx_rate_per_10g_999 / 10) * (purity_pct / Decimal('99.9')) * (1 + markup_pct / 100)

def calculate_line_gst(metal_part: Decimal, hallmark_fee: Decimal, place_of_supply: str, branch_state: str) -> dict:
    """
    Formula 7.6 — intra-state: CGST 1.5% + SGST 1.5%; inter-state: IGST 3%
    """
    is_intra = place_of_supply == branch_state
    gst_on_metal = metal_part * Decimal('0.03')
    gst_on_hallmark = hallmark_fee * Decimal('0.18')
    if is_intra:
        return {'cgst': gst_on_metal / 2, 'sgst': gst_on_metal / 2, 'igst': 0, 'hallmark_gst': gst_on_hallmark}
    return {'cgst': 0, 'sgst': 0, 'igst': gst_on_metal, 'hallmark_gst': gst_on_hallmark}
```

**Every formula function must have a unit test.** Example:

```python
# apps/jewellery/tests/test_billing_formulas.py
def test_gold_rate_derivation():
    rate = calculate_gold_rate(mcx_rate_per_10g_999=Decimal('68500'), purity_pct=Decimal('91.6'), markup_pct=Decimal('1.5'))
    assert rate == Decimal('6373.28')  # from master spec example
```

#### Audit Log Pattern

Every state-changing action must write an audit log entry:

```python
from apps.core.services import write_audit_log

def cancel_invoice(invoice, user, reason, request_ip):
    before = InvoiceSerializer(invoice).data
    with transaction.atomic():
        invoice.status = 'CANCELLED'
        invoice.save()
        write_audit_log(
            tenant=invoice.tenant,
            user=user,
            entity='jewellery.SalesInvoice',
            entity_id=invoice.id,
            action='CANCEL',
            before_json=before,
            after_json={'status': 'CANCELLED', 'cancel_reason': reason},
            ip=request_ip,
        )
```

---

### Agent 5 — Frontend Engineer (Jewellery)

**Trigger:** Any frontend task from `01-phase-wise-implementation.md`

#### Pre-flight checklist

Before writing any component:
1. Is this component in the right directory? (`modules/jewellery/components/<module>/`)
2. Does it use the shared `jewelleryApi` RTK slice?
3. Weight inputs: `inputMode="decimal"`, step="0.0001", label="g"
4. Amount inputs: ₹ prefix, Indian locale formatting (`toLocaleString('en-IN')`)
5. Are loading and error states handled for all API calls?

#### RTK Query Tag Invalidation Map

| Mutation | Invalidates |
|----------|------------|
| Issue invoice | `['Invoice', 'Item']` |
| Cancel invoice | `['Invoice']` |
| Add item to stock | `['Item']` |
| Karigar receipt | `['Item', 'Order']` |
| Loan repayment | `['PledgeLoan']` |
| Rate override | `['Rate']` |

#### Formula Mirror (TypeScript)

The billing service formulas must have TypeScript mirrors for real-time preview:

```ts
// src/modules/jewellery/utils/formulas.ts

export function calculateGoldRate(
  mcxRate: number,     // per 10g 999
  purityPct: number,   // e.g. 91.6 for 22K
  markupPct: number,
): number {
  return (mcxRate / 10) * (purityPct / 99.9) * (1 + markupPct / 100)
}

export function calculateLineTotals(line: InvoiceLine, state: BillingState) {
  const metalValue = line.netWt * calculateGoldRate(state.mcxRate, line.purityPct, state.markupPct)
  const makingCharge = metalValue * (line.makingChargePct / 100)
  const wastageAmt = line.netWt * (line.wastagePct / 100) * calculateGoldRate(state.mcxRate, line.purityPct, state.markupPct)
  const metalPart = metalValue + makingCharge + wastageAmt
  const gst = metalPart * 0.03
  return { metalValue, makingCharge, wastageAmt, metalPart, gst, lineTotal: metalPart + gst + line.stoneValue + line.hallmarkingFee * 1.18 }
}
```

The `POST /api/jwl/v1/sales/invoices/calculate/` endpoint is the source of truth for final numbers. Frontend formulas are for real-time UX preview only; final numbers always come from the server on issue.

---

### Agent 6 — QA / Reviewer (Jewellery)

**Trigger:** Before any phase milestone is marked done

#### Test Checklist

**Formula correctness:**
- [ ] Gold rate derivation (formula 7.1) — matches master spec example exactly
- [ ] GST split: intra-state (CGST+SGST) and inter-state (IGST)
- [ ] Simple interest, compound interest, daily interest, flat interest
- [ ] LTV calculation
- [ ] Tunch reconciliation
- [ ] Old gold deduction line

**Multi-tenant isolation:**
- [ ] Tenant A cannot read Tenant B's items, invoices, loans, karigars
- [ ] Soft-deleted items don't appear in list endpoints

**Permission enforcement:**
- [ ] Cashier cannot cancel invoice (403)
- [ ] Pledge Officer cannot post accounting vouchers (403)
- [ ] Large disbursal requires 2FA (403 without 2FA token)

**Business rules:**
- [ ] Cannot issue invoice for an item with status ≠ IN_STOCK
- [ ] Cannot disburse loan beyond LTV max
- [ ] Cannot backdate invoice into locked financial period
- [ ] Number series increments atomically (no gaps under concurrent load)

**Compliance:**
- [ ] Aadhaar number is masked (last 4 only) in all API responses
- [ ] PAN not returned in list endpoints, only in detail with audit log
- [ ] Audit log entry created for: invoice cancel, write-off, loan disbursal, voucher post

---

## Domain Knowledge for Agents

### Jewellery-Specific Terms

| Term | Agent must know |
|------|----------------|
| Tunch | Purity percentage (e.g., 91.6 = 22K). In karigar reconciliation, tunch determines pure metal issued vs received |
| Wastage | Notional metal loss charged to customer during making. NOT actual physical loss — it's a margin |
| Karigar | Artisan/goldsmith. Has a metal-and-amount dual ledger |
| HUID | 6-char BIS hallmark ID. Unique per article. Must be on invoice line and item tag |
| Bhav cut | Converting a metal outstanding balance to amount at an agreed rate |
| LTV | Loan-to-Value ratio for pledge loans. Determines max loan amount |
| Charge weight | Weight used for billing calculations (may differ from net weight) |
| Gross weight | Total weight including stones, clips, findings |
| Net weight | Gross minus stone weight |

### GST Rules (India, Jewellery)

| Item | GST Rate |
|------|---------|
| Gold/silver jewellery + making charge | 3% (1.5% CGST + 1.5% SGST intra-state) |
| Repair labour (no metal) | 5% |
| Hallmarking fee | 18% |
| Diamond (unset) | 0.25% |
| Imitation jewellery | 3% |

**Never apply 18% to jewellery making charges. Never apply 3% to repair-only labour.**

### Weight Precision

- All weights stored to 4 decimal places (grams)
- Display to 3 decimal places in UI (e.g., 10.250g)
- Calculations done with full precision; round only for display

---

## Common Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| Storing derived fields (e.g., total_interest) | Compute at query time or in service layer; persist only inputs |
| Hard-coding tax rates (3%, 18%) | Read from `TaxSlab` master with effective-date logic |
| Coupling jewellery to loans app models directly | Use optional FK (`loan_borrower`) or keep independent |
| Skipping `transaction.atomic()` on multi-table writes | Always use atomic blocks for invoice issue, loan disbursal, karigar receipt |
| Using Django `auto_now` for `updated_at` only | Also update `updated_by` manually in service layer |
| Showing full Aadhaar in any API response | Masked to last 4 digits in serializer; full value in encrypted DB column only |
| Modifying number series counter outside the locking service | Always use `select_for_update()` on number series row |

---

## Escalation Signals

An agent should pause and ask for human review when:

- A formula result doesn't match the master spec example by more than ₹1
- A migration would ALTER an existing column in `core.User`, `core.Tenant`, or `core.Branch`
- A GST compliance question arises that isn't answered in Section 8 of the master spec
- A feature requires real money movement (e.g., live UPI disbursement integration)
- RFID hardware protocol decisions are needed (Phase 3)
- The GSP (e-invoice) integration requires a live API key from IRP/GSTN

---

## Phase Gates (Agent Handoff Conditions)

| Gate | Condition to proceed to next phase |
|------|-----------------------------------|
| Phase 1 → Phase 2 | All Phase 1 items checked off in `01-phase-wise-implementation.md`; formula unit tests pass; multi-tenant isolation verified |
| Phase 2 → Phase 3 | GST report generation verified by CA review; Gold pledge loan interest calculations match manual test cases; Celery workers stable in staging |
| Phase 3 → Production | Load test (1k concurrent users); DR failover drill passed; RFID hardware compatibility confirmed |
