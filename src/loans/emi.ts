/**
 * Monthly EMI using the standard reducing-balance formula:
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1),  r = annualRate / 12 / 100
 * Returns the value rounded to 2 decimals. A 0% rate is a simple split.
 */
export function calculateEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (principal <= 0) throw new Error('Principal must be greater than 0');
  if (tenureMonths <= 0 || !Number.isInteger(tenureMonths)) throw new Error('Tenure must be a positive whole number of months');
  if (annualRatePercent < 0) throw new Error('Rate cannot be negative');

  const r = annualRatePercent / 12 / 100;
  const emi = r === 0 ? principal / tenureMonths : (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

export interface ScheduleRow {
  month: number;
  emi: number;
  interest: number;
  principal: number;
  balance: number;
}

/** Month-by-month amortization schedule. The last row absorbs rounding so the balance ends at 0. */
export function amortizationSchedule(principal: number, annualRatePercent: number, tenureMonths: number): ScheduleRow[] {
  const emi = calculateEmi(principal, annualRatePercent, tenureMonths);
  const r = annualRatePercent / 12 / 100;
  const rows: ScheduleRow[] = [];
  let balance = principal;
  for (let month = 1; month <= tenureMonths; month++) {
    const interest = Math.round(balance * r * 100) / 100;
    let principalPart = Math.round((emi - interest) * 100) / 100;
    if (month === tenureMonths) principalPart = Math.round(balance * 100) / 100;
    balance = Math.round((balance - principalPart) * 100) / 100;
    rows.push({ month, emi: Math.round((principalPart + interest) * 100) / 100, interest, principal: principalPart, balance });
  }
  return rows;
}
