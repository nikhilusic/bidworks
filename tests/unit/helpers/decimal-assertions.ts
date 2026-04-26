import { Decimal } from 'decimal.js';
import { expect } from 'vitest';

export function expectDecimalClose(actual: number, expected: number, epsilon = 0.001): void {
  const diff = Math.abs(actual - expected);
  if (diff > epsilon) {
    expect(actual).toBe(expected); // will fail with a useful message
  }
}

export function toDecimal(value: number | string): Decimal {
  return new Decimal(value);
}

export function expectDecimalEqual(a: Decimal, b: Decimal): void {
  expect(a.equals(b)).toBe(true);
}
