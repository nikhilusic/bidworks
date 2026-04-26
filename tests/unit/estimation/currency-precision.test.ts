import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import { toDecimal } from '../../unit/helpers/decimal-assertions.js';

describe('Currency precision (EUR)', () => {
  it('performs addition without floating point drift', () => {
    const a = toDecimal('0.1');
    const b = toDecimal('0.2');
    const result = a.plus(b);
    expect(result.toFixed(1)).toBe('0.3');
  });

  it('maintains determinism across identical calculations', () => {
    const rate = new Decimal('87.50');
    const hours = new Decimal('3.25');
    const calc1 = rate.times(hours).toDecimalPlaces(2);
    const calc2 = rate.times(hours).toDecimalPlaces(2);
    expect(calc1.equals(calc2)).toBe(true);
    expect(calc1.toString()).toBe('284.38');
  });

  it('rounds half-up for EUR amounts', () => {
    const d = new Decimal('2.345');
    expect(d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()).toBe('2.35');
  });

  it('handles large sums without precision loss', () => {
    const rate = new Decimal('150.00');
    const hours = new Decimal('2000');
    const reps = new Decimal('20');
    const total = rate.times(hours).times(reps);
    expect(total.toNumber()).toBe(6_000_000);
  });
});
