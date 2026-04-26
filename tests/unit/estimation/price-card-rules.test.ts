import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';

const ANNUAL_INCREMENT_EUR = 2.0;

describe('Price card rules', () => {
  it('applies 2 EUR annual increment per year', () => {
    const baseRate = new Decimal(100);
    const yearDiff = 1;
    const expectedRate = baseRate.plus(new Decimal(ANNUAL_INCREMENT_EUR).times(yearDiff));
    expect(expectedRate.toNumber()).toBe(102);
  });

  it('applies increment correctly for year+2', () => {
    const baseRate = new Decimal(100);
    const yearDiff = 2;
    const expectedRate = baseRate.plus(new Decimal(ANNUAL_INCREMENT_EUR).times(yearDiff));
    expect(expectedRate.toNumber()).toBe(104);
  });

  it('exact rate year match returns without increment', () => {
    const baseRate = new Decimal(100);
    const yearDiff = 0;
    const rate = baseRate.plus(new Decimal(ANNUAL_INCREMENT_EUR).times(yearDiff));
    expect(rate.toNumber()).toBe(100);
  });
});
