import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';

describe('Zero-hour effort entry behavior', () => {
  it('zero effort hours produce zero cost', () => {
    const effortHours = new Decimal(0);
    const hourlyRate = new Decimal(150);
    const cost = effortHours.times(hourlyRate);
    expect(cost.toNumber()).toBe(0);
  });

  it('task with all zero effort entries has 0 total', () => {
    const entries = [
      { effortHours: new Decimal(0) },
      { effortHours: new Decimal(0) },
    ];
    const total = entries.reduce((sum, e) => sum.plus(e.effortHours), new Decimal(0));
    expect(total.toNumber()).toBe(0);
  });

  it('mixing zero and non-zero entries sums correctly', () => {
    const entries = [
      { effortHours: new Decimal(0), costEur: new Decimal(0) },
      { effortHours: new Decimal(5), costEur: new Decimal(500) },
      { effortHours: new Decimal(0), costEur: new Decimal(0) },
    ];
    const total = entries.reduce((sum, e) => sum.plus(e.costEur), new Decimal(0));
    expect(total.toNumber()).toBe(500);
  });
});
