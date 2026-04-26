import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_ID = '50000000-0000-0000-0000-000000000001';

describe('Integration: Multi-role and multi-module rollup matrix', () => {
  it('correctly sums totals across multiple roles and modules', async () => {
    await db.project.create({ data: { id: PROJECT_ID, name: 'Matrix Project' } });

    const role1 = await db.roleType.create({ data: { name: 'Dev' } });
    const role2 = await db.roleType.create({ data: { name: 'PM' } });
    await db.priceCardRate.createMany({
      data: [
        { roleTypeId: role1.id, rateYear: 2026, hourlyRateEur: 100 },
        { roleTypeId: role2.id, rateYear: 2026, hourlyRateEur: 80 },
      ],
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Matrix Estimate', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;
    await db.estimateRoleSelection.createMany({
      data: [
        { estimateId, roleTypeId: role1.id },
        { estimateId, roleTypeId: role2.id },
      ],
    });

    // Create task 1 with role1 (4h @100 = 400)
    await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: 1,
        solutionPhase: 'Phase 1',
        module: 'Module A',
        title: 'Task Dev',
        description: '',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: role1.id, effortHours: 4 }],
        updatedBy: 'user-1',
      })
      .expect(201);

    const est1 = await db.estimate.findUnique({ where: { id: estimateId } });

    // Create task 2 with role2 (5h @80 = 400)
    await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: est1!.revision,
        solutionPhase: 'Phase 1',
        module: 'Module B',
        title: 'Task PM',
        description: '',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: role2.id, effortHours: 5 }],
        updatedBy: 'user-1',
      })
      .expect(201);

    const estFinal = await db.estimate.findUnique({ where: { id: estimateId } });
    expect(parseFloat(estFinal!.totalEffortHours.toString())).toBe(9); // 4+5
    expect(parseFloat(estFinal!.totalCostEur.toString())).toBe(800); // 400+400

    // Summary check
    const summaryRes = await supertest(app.server)
      .get(`/projects/${PROJECT_ID}/estimates/${estimateId}/summary`)
      .expect(200);

    expect(summaryRes.body.totalModules).toBe(2);
    expect(summaryRes.body.totalEffortByRoleType).toHaveLength(2);
  });
});
