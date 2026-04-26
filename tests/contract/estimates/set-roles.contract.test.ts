import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000011';

describe('Contract: PUT /projects/:projectId/estimates/:estimateId/roles', () => {
  it('returns 200 with updated estimate after role set', async () => {
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Roles Test Project' },
      update: {},
    });

    const roleType = await app.db.roleType.create({
      data: { name: 'Software Developer Senior', seniority: 'Senior' },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Role Estimate', description: '', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;

    const response = await supertest(app.server)
      .put(`/projects/${PROJECT_ID}/estimates/${estimateId}/roles`)
      .send({
        roleTypeIds: [roleType.id],
        revision: 1,
        updatedBy: 'user-1',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: estimateId,
      revision: 2,
    });
  });
});
