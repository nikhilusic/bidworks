import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000013';

describe('Contract: PATCH /projects/:projectId/estimates/:estimateId/tasks/:taskId', () => {
  it('returns 200 with updated Task shape', async () => {
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'UpdateTask Project' },
      update: {},
    });

    const roleType = await app.db.roleType.create({ data: { name: 'Dev' } });
    await app.db.priceCardRate.create({
      data: { roleTypeId: roleType.id, rateYear: 2026, hourlyRateEur: 80 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'UpdateTask Estimate', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;
    await app.db.estimateRoleSelection.create({ data: { estimateId, roleTypeId: roleType.id } });

    const taskRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: 1,
        solutionPhase: 'P1',
        module: 'M1',
        title: 'Task A',
        description: '',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: roleType.id, effortHours: 4 }],
        updatedBy: 'user-1',
      })
      .expect(201);

    const taskId = taskRes.body.id as string;
    const currentEstimate = await app.db.estimate.findUnique({ where: { id: estimateId } });

    const response = await supertest(app.server)
      .patch(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks/${taskId}`)
      .send({
        revision: currentEstimate!.revision,
        isEnabled: false,
        updatedBy: 'user-1',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: taskId,
      isEnabled: false,
      totalEffortHours: 0,
      totalCostEur: 0,
    });
  });
});
