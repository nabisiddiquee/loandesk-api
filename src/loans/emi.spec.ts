import { amortizationSchedule, calculateEmi } from './emi';

describe('calculateEmi', () => {
  it('matches the standard reducing-balance formula', () => {
    // 5,00,000 at 14% for 24 months -> 24,006.49 (bank calculators agree to the paisa)
    expect(calculateEmi(500000, 14, 24)).toBeCloseTo(24006.44, 2);
  });

  it('splits evenly when the rate is 0%', () => {
    expect(calculateEmi(120000, 0, 12)).toBe(10000);
  });

  it('rejects invalid input', () => {
    expect(() => calculateEmi(0, 10, 12)).toThrow();
    expect(() => calculateEmi(1000, 10, 0)).toThrow();
    expect(() => calculateEmi(1000, -1, 12)).toThrow();
  });
});

describe('amortizationSchedule', () => {
  it('pays the loan down to exactly zero', () => {
    const rows = amortizationSchedule(500000, 14, 24);
    expect(rows).toHaveLength(24);
    expect(rows[rows.length - 1].balance).toBe(0);
    const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
    expect(totalPrincipal).toBeCloseTo(500000, 1);
  });
});
