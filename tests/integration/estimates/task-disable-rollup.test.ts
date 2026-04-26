import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_ID = '30000000-0000-0000-0000-000000000001';

describe('Integration: Task disable exclusion from roll-ups', () => {
  it('disabled task contributes 0 effort and 0 cost', async () => {
    await db.project.create({ data: { id: PROJECT_ID, name: 'Disable Rollup Project' } });

    const roleType = await db.roleType.create({ data: { name: 'Developer' } });
    await db.priceCardRate.create({
      data: { roleTypeId: roleType.id, rateYear: 2026, hourlyRateEur: 100 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Disable Test', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;
    await db.estimateRoleSelection.create({ data: { estimateId, roleTypeId: roleType.id } });

    const taskRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: 1,
        solutionPhase: 'Phase 1',
        module: 'Module 1',
        title: 'Task to Disable',
        description: '',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: roleType.id, effortHours: 10 }],
        updatedBy: 'user-1',
      })
      .expect(201);

    const taskId = taskRes.body.id as string;

    // Verify task is included before disable
    const estBefore = await db.estimate.findUnique({ where: { id: estimateId } });
    expect(parseFloat(estBefore!.totalEffortHours.toString())).toBe(10);

    const currentRevision = estBefore!.revision;

    // Disable the task
    await supertest(app.server)
      .patch(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks/${taskId}`)
      .send({ revision: currentRevision, isEnabled: false, updatedBy: 'user-1' })
      .expect(200);

    // Verify totals are now 0
    const estAfter = await db.estimate.findUnique({ where: { id: estimateId } });
    expect(parseFloat(estAfter!.totalEffortHours.toString())).toBe(0);
    expect(parseFloat(estAfter!.totalCostEur.toString())).toBe(0);
  });
});
