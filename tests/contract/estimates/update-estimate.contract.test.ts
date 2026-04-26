import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000010';

describe('Contract: PATCH /projects/:projectId/estimates/:estimateId', () => {
  it('returns 200 with updated estimate shape', async () => {
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Update Test Project' },
      update: {},
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Update Me', description: '', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;

    const response = await supertest(app.server)
      .patch(`/projects/${PROJECT_ID}/estimates/${estimateId}`)
      .send({
        revision: 1,
        description: 'Updated description',
        startPeriod: '2026-06',
        durationMonths: 12,
        updatedBy: 'user-1',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: estimateId,
      description: 'Updated description',
      startPeriod: '2026-06',
      durationMonths: 12,
      revision: 2,
    });
  });

  it('returns 404 for non-existent estimate', async () => {
    const response = await supertest(app.server)
      .patch(`/projects/${PROJECT_ID}/estimates/00000000-0000-0000-0000-999999999999`)
      .send({ revision: 1, updatedBy: 'user-1' })
      .expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });
});
