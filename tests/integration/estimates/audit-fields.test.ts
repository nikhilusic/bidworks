import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_ID = '60000000-0000-0000-0000-000000000001';

describe('Integration: Audit fields', () => {
  it('sets createdAt/createdBy/updatedAt/updatedBy on create', async () => {
    await db.project.create({ data: { id: PROJECT_ID, name: 'Audit Project' } });

    const before = new Date();
    const res = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Audit Test', description: '', createdBy: 'auditor-1' })
      .expect(201);

    const after = new Date();
    const body = res.body;

    expect(body.createdBy).toBe('auditor-1');
    expect(body.updatedBy).toBe('auditor-1');
    expect(new Date(body.createdAt).getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(new Date(body.createdAt).getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });

  it('updates updatedAt/updatedBy on update', async () => {
    await db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Audit Project' },
      update: {},
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Audit Update Test', description: '', createdBy: 'auditor-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;

    const updateRes = await supertest(app.server)
      .patch(`/projects/${PROJECT_ID}/estimates/${estimateId}`)
      .send({ revision: 1, description: 'Updated', updatedBy: 'auditor-2' })
      .expect(200);

    expect(updateRes.body.updatedBy).toBe('auditor-2');
    expect(updateRes.body.createdBy).toBe('auditor-1');
  });
});
