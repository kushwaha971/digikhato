"""Gold pledge loan services — formulas 7.11–7.16."""
from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from django.db import transaction
from django.utils import timezone

TWO = Decimal("0.01")
FOUR = Decimal("0.0001")

# ─── Formula 7.11 — Simple Interest ──────────────────────────────────────────

def calc_simple_interest(principal: Decimal, rate_pct_per_month: Decimal, months: Decimal) -> dict:
    """
    interest = principal × (rate/100) × months
    Example: 50000 × 0.02 × 6 = 6000
    """
    interest = principal * (rate_pct_per_month / Decimal("100")) * months
    return {"interest": interest.quantize(TWO), "total_due": (principal + interest).quantize(TWO)}

# ─── Formula 7.12 — Compound Interest (Monthly) ──────────────────────────────

def calc_compound_interest(principal: Decimal, rate_pct_per_month: Decimal, months: Decimal) -> dict:
    """
    total_due = principal × (1 + rate/100)^months
    Example: 50000 × 1.02^6 = 56308.12
    """
    factor = (Decimal("1") + rate_pct_per_month / Decimal("100")) ** int(months)
    total_due = (principal * factor).quantize(TWO)
    return {"interest": (total_due - principal).quantize(TWO), "total_due": total_due}

# ─── Formula 7.13 — Daily Simple Interest ────────────────────────────────────

def calc_daily_interest(principal: Decimal, rate_pct_per_month: Decimal, days: int) -> dict:
    """
    interest = principal × (rate/100) × (days/30)
    Example: 50000 × 0.02 × (47/30) = 1566.67
    """
    interest = principal * (rate_pct_per_month / Decimal("100")) * (Decimal(days) / Decimal("30"))
    return {"interest": interest.quantize(TWO), "total_due": (principal + interest).quantize(TWO)}

# ─── Formula 7.14 — Flat Fixed Interest ──────────────────────────────────────

def calc_flat_interest(principal: Decimal, flat_rate_pct: Decimal) -> dict:
    """
    interest = principal × flat_rate_pct / 100
    """
    interest = (principal * flat_rate_pct / Decimal("100")).quantize(TWO)
    return {"interest": interest, "total_due": (principal + interest).quantize(TWO)}

# ─── Dispatch to correct formula ─────────────────────────────────────────────

def calc_interest(principal: Decimal, rate_pct: Decimal, method: str, months: Decimal = None, days: int = None) -> dict:
    if method == "SIMPLE":
        return calc_simple_interest(principal, rate_pct, months or Decimal("1"))
    elif method == "COMPOUND":
        return calc_compound_interest(principal, rate_pct, months or Decimal("1"))
    elif method == "DAILY":
        return calc_daily_interest(principal, rate_pct, days or 30)
    elif method == "FLAT":
        return calc_flat_interest(principal, rate_pct)
    raise ValueError(f"Unknown interest method: {method}")

# ─── Formula 7.15 — LTV ──────────────────────────────────────────────────────

def calc_ltv(pledge_items: list, buy_rate_per_gram: Decimal, ltv_pct: Decimal) -> dict:
    """
    pledge_value = sum(net_wt_pure × buy_rate)
    max_loan = pledge_value × ltv_pct / 100
    Each pledge item contributes net_wt (in grams, adjusted for purity).
    """
    pledge_value = sum(
        Decimal(str(item["net_wt"])) * buy_rate_per_gram
        for item in pledge_items
    )
    max_loan = pledge_value * (ltv_pct / Decimal("100"))
    return {
        "pledge_value": pledge_value.quantize(TWO),
        "max_loan": max_loan.quantize(TWO),
        "ltv_pct": ltv_pct,
    }

# ─── Formula 7.16 — Foreclosure Rebate ───────────────────────────────────────

def calc_foreclosure(
    principal: Decimal,
    rate_pct: Decimal,
    method: str,
    tenure_months: int,
    days_elapsed: int,
    rebate_factor: Decimal = Decimal("1"),
) -> dict:
    """
    contracted = interest over full tenure
    accrued    = interest using days_elapsed
    rebate     = max(0, contracted - accrued) × rebate_factor
    amount_due = principal + accrued - rebate
    """
    contracted = calc_interest(principal, rate_pct, method, months=Decimal(tenure_months))["interest"]
    months_elapsed = Decimal(days_elapsed) / Decimal("30")
    accrued = calc_interest(principal, rate_pct, method, months=months_elapsed, days=days_elapsed)["interest"]
    rebate = max(Decimal("0"), contracted - accrued) * rebate_factor
    amount_due = (principal + accrued - rebate).quantize(TWO)
    return {
        "contracted_interest": contracted.quantize(TWO),
        "accrued_interest": accrued.quantize(TWO),
        "rebate": rebate.quantize(TWO),
        "amount_due": amount_due,
    }

# ─── Transactional loan creation ─────────────────────────────────────────────

@transaction.atomic
def create_loan(tenant, branch_name, customer, scheme, data, pledge_items_data, created_by):
    """Create GoldPledgeLoan + PledgeItem rows atomically."""
    from apps.jewellery.models.pledge import GoldPledgeLoan, PledgeItem
    from apps.jewellery.services.number_series import get_next_number
    from datetime import timedelta

    loan_no = get_next_number(tenant=tenant, branch_name=branch_name, voucher_type="PLEDGE_LOAN")
    loan_date = data.get("loan_date") or timezone.localdate()
    maturity = loan_date + timedelta(days=30 * data["tenure_months"])

    loan = GoldPledgeLoan.objects.create(
        tenant=tenant,
        branch_name=branch_name,
        loan_no=loan_no,
        loan_date=loan_date,
        customer=customer,
        scheme=scheme,
        principal=data["principal"],
        interest_rate_pct=scheme.interest_rate_pct,
        interest_method=scheme.interest_method,
        tenure_months=data["tenure_months"],
        ltv_pct=scheme.ltv_pct,
        maturity_date=maturity,
        created_by=created_by,
        updated_by=created_by,
    )

    for idx, item_data in enumerate(pledge_items_data, start=1):
        val_amount = (
            Decimal(str(item_data["net_wt"])) * Decimal(str(item_data["valuation_rate"]))
        ).quantize(Decimal("0.01"))
        PledgeItem.objects.create(
            loan=loan,
            line_no=idx,
            description=item_data.get("description", ""),
            metal_id=item_data["metal"],
            purity_id=item_data["purity"],
            gross_wt=item_data["gross_wt"],
            net_wt=item_data["net_wt"],
            stone_wt=item_data.get("stone_wt", 0),
            valuation_rate=item_data["valuation_rate"],
            valuation_amount=val_amount,
        )

    return loan

@transaction.atomic
def record_repayment(loan, data, created_by):
    """Record a loan repayment and update balance."""
    from apps.jewellery.models.pledge import LoanRepayment
    from django.utils.timezone import localdate

    months_elapsed = Decimal(str(data.get("months_elapsed", 1)))
    days_elapsed = int(data.get("days_elapsed", 30))
    interest_result = calc_interest(
        principal=loan.principal,
        rate_pct=loan.interest_rate_pct,
        method=loan.interest_method,
        months=months_elapsed,
        days=days_elapsed,
    )
    total_due = interest_result["total_due"]
    total_paid = Decimal(str(data["principal_paid"])) + Decimal(str(data["interest_paid"]))
    balance_after = (total_due - total_paid).quantize(Decimal("0.01"))

    repayment = LoanRepayment.objects.create(
        tenant=loan.tenant,
        branch_name=loan.branch_name,
        loan=loan,
        date=data.get("date") or localdate(),
        principal_paid=data["principal_paid"],
        interest_paid=data["interest_paid"],
        mode=data["mode"],
        reference=data.get("reference", ""),
        items_released=data.get("items_released", []),
        balance_after=balance_after,
        created_by=created_by,
        updated_by=created_by,
    )

    if balance_after <= Decimal("0"):
        loan.status = "CLOSED"
        loan.save(update_fields=["status", "updated_at"])

    return repayment, balance_after
