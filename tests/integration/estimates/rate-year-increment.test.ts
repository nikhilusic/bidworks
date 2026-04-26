import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_ID = '90000000-0000-0000-0000-000000000001';

describe('Integration: Rate year increment', () => {
  it('uses 2 EUR per year increment when explicit rate not available', async () => {
    await db.project.create({ data: { id: PROJECT_ID, name: 'Rate Increment Project' } });

    const roleType = await db.roleType.create({ data: { name: 'Dev' } });
    // Only have rate for 2025, not 2026
    await db.priceCardRate.create({
      data: { roleTypeId: roleType.id, rateYear: 2025, hourlyRateEur: 98 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Increment Test', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;
    await db.estimateRoleSelection.create({ data: { estimateId, roleTypeId: roleType.id } });

    const taskRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: 1,
        solutionPhase: 'P1',
        module: 'M1',
        title: 'Increment Task',
        description: '',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: roleType.id, effortHours: 10 }],
        updatedBy: 'user-1',
      })
      .expect(201);

    // 2026 rate = 2025 base (98) + 2 EUR increment = 100 EUR/h
    // 10h * 100 = 1000 EUR
    expect(taskRes.body.totalCostEur).toBe(1000);
  });
});
