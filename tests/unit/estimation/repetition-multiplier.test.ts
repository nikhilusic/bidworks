import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';

describe('Repetition multiplier', () => {
  it('multiplies effort by repetition count', () => {
    const baseHours = new Decimal(5);
    const repetitions = 3;
    const result = baseHours.times(repetitions);
    expect(result.toNumber()).toBe(15);
  });

  it('repetition of 1 returns base hours unchanged', () => {
    const baseHours = new Decimal(8);
    const result = baseHours.times(1);
    expect(result.toNumber()).toBe(8);
  });

  it('applies multiplier to cost calculation', () => {
    const effortHours = new Decimal(4);
    const hourlyRate = new Decimal(100);
    const repetitions = new Decimal(3);
    const taskCost = effortHours.times(hourlyRate).times(repetitions);
    expect(taskCost.toNumber()).toBe(1200);
  });
});
