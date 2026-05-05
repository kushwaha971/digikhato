export type MakingMode = "PER_GRAM" | "PCT_METAL" | "PER_PIECE";

const asNumber = (value: string | number | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const toMoney = (value: number): number => round(value, 2);

export function calcGoldRatePerGram(
  mcxRatePer10gm: string | number,
  purityPct: string | number,
  markupPct: string | number,
): number {
  const base24k = asNumber(mcxRatePer10gm) / 10;
  const purityFactor = asNumber(purityPct) / 100;
  const markupFactor = 1 + asNumber(markupPct) / 100;
  return toMoney(base24k * purityFactor * markupFactor);
}

export function calcMakingCharge(
  makingMode: MakingMode,
  makingRate: string | number,
  netWt: string | number,
  metalValue: string | number,
  pieces = 1,
): number {
  const rate = asNumber(makingRate);
  if (makingMode === "PER_GRAM") {
    return toMoney(rate * asNumber(netWt));
  }
  if (makingMode === "PCT_METAL") {
    return toMoney((asNumber(metalValue) * rate) / 100);
  }
  return toMoney(rate * Math.max(1, pieces));
}

export function calcWastageAmount(
  metalValue: string | number,
  wastagePct: string | number,
): number {
  return toMoney((asNumber(metalValue) * asNumber(wastagePct)) / 100);
}

export function calcHallmarkGst(hallmarkingFee: string | number): number {
  return toMoney(asNumber(hallmarkingFee) * 0.18);
}

export function calcLineGst(lineMetalPart: string | number, gstRatePct: string | number): number {
  return toMoney((asNumber(lineMetalPart) * asNumber(gstRatePct)) / 100);
}

export function splitGst(
  gstAmount: string | number,
  isInterState: boolean,
): { cgst: number; sgst: number; igst: number } {
  const gst = asNumber(gstAmount);
  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: toMoney(gst) };
  }
  const half = toMoney(gst / 2);
  return { cgst: half, sgst: half, igst: 0 };
}

export function calcOldGoldDeduction(
  grossWt: string | number,
  testedPurityPct: string | number,
  buyRatePerGram: string | number,
): { pureGrams: number; deductionValue: number } {
  const pureGrams = round(asNumber(grossWt) * (asNumber(testedPurityPct) / 100), 4);
  const deductionValue = toMoney(pureGrams * asNumber(buyRatePerGram));
  return { pureGrams, deductionValue };
}

export function allocateDiscountProportionally(
  lineSubtotals: Array<string | number>,
  discountAmount: string | number,
): number[] {
  const subtotals = lineSubtotals.map(asNumber);
  const total = subtotals.reduce((sum, n) => sum + n, 0);
  const discount = asNumber(discountAmount);
  if (total <= 0 || discount <= 0) return subtotals.map(() => 0);

  const allocations = subtotals.map((subtotal) => toMoney((subtotal / total) * discount));
  const allocated = allocations.reduce((sum, n) => sum + n, 0);
  const remainder = toMoney(discount - allocated);

  if (Math.abs(remainder) > 0 && allocations.length > 0) {
    allocations[allocations.length - 1] = toMoney(allocations[allocations.length - 1] + remainder);
  }

  return allocations;
}

export function calcRoundOff(total: string | number): number {
  const original = asNumber(total);
  const rounded = Math.round(original);
  return toMoney(rounded - original);
}

export function formatINRCurrency(value: string | number | null | undefined): string {
  const n = asNumber(value);
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
