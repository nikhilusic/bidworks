import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_ID = '20000000-0000-0000-0000-000000000001';

describe('Integration: Role selection enforcement', () => {
  it('rejects effort entry for role not in estimate selections', async () => {
    await db.project.create({ data: { id: PROJECT_ID, name: 'Role Enforcement Project' } });

    const selectedRole = await db.roleType.create({ data: { name: 'Developer' } });
    const unselectedRole = await db.roleType.create({ data: { name: 'Architect' } });
    await db.priceCardRate.create({
      data: { roleTypeId: selectedRole.id, rateYear: 2026, hourlyRateEur: 100 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Role Test', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;

    // Only select one role
    await db.estimateRoleSelection.create({ data: { estimateId, roleTypeId: selectedRole.id } });

    // Try to create task with unselected role
    const response = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates/${estimateId}/tasks`)
      .send({
        revision: 1,
        solutionPhase: 'P1',
        module: 'M1',
        title: 'Bad Task',
        description: '',
        repetitionCount: 1,
        effortEntries: [{ roleTypeId: unselectedRole.id, effortHours: 8 }],
        updatedBy: 'user-1',
      })
      .expect(422);

    expect(response.body.code).toBe('ROLE_NOT_SELECTED');
  });
});
