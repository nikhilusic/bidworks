import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000003';

describe('Contract: Stale revision conflict → 409', () => {
  it('returns 409 when update uses stale revision', async () => {
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Test Project Rev' },
      update: {},
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Rev Test', description: '', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;

    // First update succeeds (uses revision 1)
    await supertest(app.server)
      .patch(`/projects/${PROJECT_ID}/estimates/${estimateId}`)
      .send({ revision: 1, description: 'Updated', updatedBy: 'user-1' })
      .expect(200);

    // Second update with same (now stale) revision fails
    const response = await supertest(app.server)
      .patch(`/projects/${PROJECT_ID}/estimates/${estimateId}`)
      .send({ revision: 1, description: 'Stale update', updatedBy: 'user-1' })
      .expect(409);

    expect(response.body.code).toBe('REVISION_CONFLICT');
  });
});
