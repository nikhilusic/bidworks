import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_ID = '80000000-0000-0000-0000-000000000001';

describe('Integration: Recalculation observability', () => {
  it('estimate has correct totals after recalculation (observability is via logs)', async () => {
    await db.project.create({ data: { id: PROJECT_ID, name: 'Observability Project' } });

    const roleType = await db.roleType.create({ data: { name: 'Developer' } });
    await db.priceCardRate.create({
      data: { roleTypeId: roleType.id, rateYear: 2026, hourlyRateEur: 100 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Observability Test', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;
    await db.estimateRoleSelection.create({ data: { estimateId, roleTypeId: roleType.id } });

    await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: 1,
        solutionPhase: 'P1',
        module: 'M1',
        title: 'Observable Task',
        description: '',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: roleType.id, effortHours: 5 }],
        updatedBy: 'user-1',
      })
      .expect(201);

    // Verify totals were correctly persisted (observability through state assertions)
    const estimate = await db.estimate.findUnique({ where: { id: estimateId } });
    expect(parseFloat(estimate!.totalEffortHours.toString())).toBe(5);
    expect(parseFloat(estimate!.totalCostEur.toString())).toBe(500);
  });
});
