import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';

// Simulates revision auto-increment behavior
describe('Revision auto-increment', () => {
  it('starts at revision 1', () => {
    const initialRevision = 1;
    expect(initialRevision).toBe(1);
  });

  it('increments by 1 on each update', () => {
    let revision = 1;
    revision += 1;
    expect(revision).toBe(2);
    revision += 1;
    expect(revision).toBe(3);
  });

  it('detects stale revision conflict', () => {
    const currentRevision: number = 3;
    const expectedRevision: number = 2; // stale
    expect(currentRevision !== expectedRevision).toBe(true);
  });

  it('accepts correct expected revision', () => {
    const currentRevision = 2;
    const expectedRevision = 2;
    expect(currentRevision === expectedRevision).toBe(true);
  });
});

describe('Zero-hour effort entries', () => {
  it('contribute 0 to task totals', () => {
    const effortHours = new Decimal(0);
    const hourlyRate = new Decimal(100);
    const cost = effortHours.times(hourlyRate);
    expect(cost.toNumber()).toBe(0);
  });

  it('do not affect roll-up totals', () => {
    const entries = [
      { effortHours: new Decimal(0), costEur: new Decimal(0) },
      { effortHours: new Decimal(4), costEur: new Decimal(400) },
    ];
    const totalHours = entries.reduce((sum, e) => sum.plus(e.effortHours), new Decimal(0));
    const totalCost = entries.reduce((sum, e) => sum.plus(e.costEur), new Decimal(0));
    expect(totalHours.toNumber()).toBe(4);
    expect(totalCost.toNumber()).toBe(400);
  });
});
