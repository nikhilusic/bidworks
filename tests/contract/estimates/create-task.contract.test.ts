import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000012';

describe('Contract: POST /projects/:projectId/estimates/:estimateId/tasks', () => {
  it('returns 201 with Task shape', async () => {
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Task Test Project' },
      update: {},
    });

    const roleType = await app.db.roleType.create({ data: { name: 'Developer' } });
    await app.db.priceCardRate.create({
      data: { roleTypeId: roleType.id, rateYear: 2026, hourlyRateEur: 100 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Task Estimate', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;

    await app.db.estimateRoleSelection.create({ data: { estimateId, roleTypeId: roleType.id } });

    const response = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: 1,
        solutionPhase: 'Phase 1',
        module: 'Core',
        title: 'Implement login',
        description: 'Auth flow',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: roleType.id, effortHours: 8 }],
        updatedBy: 'user-1',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      title: 'Implement login',
      isEnabled: true,
      repetitionCount: 1,
      totalEffortHours: 8,
      totalCostEur: 800,
    });
  });
});
