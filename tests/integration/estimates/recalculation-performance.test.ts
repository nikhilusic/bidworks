import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_ID = '70000000-0000-0000-0000-000000000001';

describe('Integration: Recalculation performance', () => {
  it('recalculates estimate within 2 seconds for moderate load', async () => {
    await db.project.create({ data: { id: PROJECT_ID, name: 'Perf Project' } });

    const roleType = await db.roleType.create({ data: { name: 'Developer' } });
    await db.priceCardRate.create({
      data: { roleTypeId: roleType.id, rateYear: 2026, hourlyRateEur: 100 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Perf Estimate', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;
    await db.estimateRoleSelection.create({ data: { estimateId, roleTypeId: roleType.id } });

    let currentRevision = 1;
    const start = Date.now();

    // Create 10 tasks to simulate recalculation load
    for (let i = 0; i < 10; i++) {
      const res = await supertest(app.server)
        .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
        .send({
          revision: currentRevision,
          solutionPhase: `Phase ${i % 2}`,
          module: `Module ${i % 3}`,
          title: `Task ${i}`,
          description: '',
          repetitionCount: 1,
          effortEntries: [{ roleTypeId: roleType.id, effortHours: 2 }],
          updatedBy: 'user-1',
        })
        .expect(201);

      const updatedEst = await db.estimate.findUnique({ where: { id: estimateId } });
      currentRevision = updatedEst!.revision;
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(20000); // 20s for 10 tasks (generous for CI)

    const estimate = await db.estimate.findUnique({ where: { id: estimateId } });
    expect(parseFloat(estimate!.totalEffortHours.toString())).toBe(20);
  }, 30000);
});
