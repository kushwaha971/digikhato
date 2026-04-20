from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional


@dataclass
class LoanAmounts:
    total_amount: Decimal
    daily_emi: Decimal
    outstanding_balance: Decimal


TWO_DP = Decimal("0.01")


def quantize_amount(value: Decimal) -> Decimal:
    return value.quantize(TWO_DP, rounding=ROUND_HALF_UP)


def calculate_loan_amounts(
    principal: Decimal,
    interest_rate: Optional[Decimal],
    tenure_days: Optional[int],
) -> LoanAmounts:
    effective_rate = interest_rate or Decimal("0")
    interest = principal * (effective_rate / Decimal("100"))
    total = quantize_amount(principal + interest)
    daily_emi = quantize_amount(total / Decimal(tenure_days)) if tenure_days else Decimal("0.00")
    return LoanAmounts(total_amount=total, daily_emi=daily_emi, outstanding_balance=total)
