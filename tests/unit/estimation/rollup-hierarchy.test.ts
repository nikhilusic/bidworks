import { describe, it, expect } from 'vitest';
import { RollupCalculator } from '../../../src/modules/estimation/domain/services/RollupCalculator.js';
import { Decimal } from 'decimal.js';

function makePhase(id: string, modules: ReturnType<typeof makeModule>[]) {
  return {
    id,
    estimateId: 'est-1',
    name: `Phase ${id}`,
    totalEffortHours: new Decimal(0) as unknown as import('@prisma/client').Prisma.Decimal,
    totalCostEur: new Decimal(0) as unknown as import('@prisma/client').Prisma.Decimal,
    modules,
  };
}

function makeModule(id: string, tasks: ReturnType<typeof makeTask>[]) {
  return {
    id,
    solutionPhaseId: 'phase-1',
    name: `Module ${id}`,
    totalEffortHours: new Decimal(0) as unknown as import('@prisma/client').Prisma.Decimal,
    totalCostEur: new Decimal(0) as unknown as import('@prisma/client').Prisma.Decimal,
    tasks,
  };
}

function makeTask(id: string, hours: number, rate: number, repetition: number, enabled = true) {
  return {
    id,
    moduleId: 'mod-1',
    title: `Task ${id}`,
    description: '',
    repetitionCount: repetition,
    isEnabled: enabled,
    totalEffortHours: new Decimal(0) as unknown as import('@prisma/client').Prisma.Decimal,
    totalCostEur: new Decimal(0) as unknown as import('@prisma/client').Prisma.Decimal,
    effortEntries: [
      {
        id: `entry-${id}`,
        taskId: id,
        roleTypeId: 'role-1',
        effortHours: new Decimal(hours) as unknown as import('@prisma/client').Prisma.Decimal,
        hourlyRateEur: new Decimal(rate) as unknown as import('@prisma/client').Prisma.Decimal,
        costEur: new Decimal(hours * rate) as unknown as import('@prisma/client').Prisma.Decimal,
      },
    ],
  };
}

describe('RollupCalculator', () => {
  const calculator = new RollupCalculator();

  it('sums effort hours and cost across task entries', () => {
    const phases = [makePhase('p1', [makeModule('m1', [makeTask('t1', 8, 100, 1)])])];
    const result = calculator.calculate(phases);
    expect(result.totalEffortHours.toNumber()).toBe(8);
    expect(result.totalCostEur.toNumber()).toBe(800);
  });

  it('applies repetition multiplier to task totals', () => {
    const phases = [makePhase('p1', [makeModule('m1', [makeTask('t1', 4, 100, 3)])])];
    const result = calculator.calculate(phases);
    expect(result.totalEffortHours.toNumber()).toBe(12);
    expect(result.totalCostEur.toNumber()).toBe(1200);
  });

  it('excludes disabled tasks from roll-ups', () => {
    const tasks = [makeTask('t1', 8, 100, 1, true), makeTask('t2', 4, 100, 1, false)];
    const phases = [makePhase('p1', [makeModule('m1', tasks)])];
    const result = calculator.calculate(phases);
    expect(result.totalEffortHours.toNumber()).toBe(8);
    expect(result.totalCostEur.toNumber()).toBe(800);
  });

  it('sums across multiple modules and phases', () => {
    const phases = [
      makePhase('p1', [makeModule('m1', [makeTask('t1', 4, 100, 1)])]),
      makePhase('p2', [makeModule('m2', [makeTask('t2', 6, 200, 2)])]),
    ];
    const result = calculator.calculate(phases);
    // t1: 4*100=400, t2: 6*200*2=2400
    expect(result.totalEffortHours.toNumber()).toBe(4 + 12);
    expect(result.totalCostEur.toNumber()).toBe(400 + 2400);
  });

  it('produces roll-up in strict hierarchy order', () => {
    const phases = [makePhase('p1', [makeModule('m1', [makeTask('t1', 2, 50, 1), makeTask('t2', 3, 50, 1)])])];
    const result = calculator.calculate(phases);
    expect(result.taskRollups).toHaveLength(2);
    expect(result.moduleRollups).toHaveLength(1);
    expect(result.phaseRollups).toHaveLength(1);
    expect(result.moduleRollups[0].totalEffortHours.toNumber()).toBe(5);
    expect(result.phaseRollups[0].totalEffortHours.toNumber()).toBe(5);
  });
});
