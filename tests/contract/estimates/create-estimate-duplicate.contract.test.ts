import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000002';

describe('Contract: Duplicate estimate name → 409', () => {
  it('returns 409 when creating estimate with duplicate name', async () => {
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Test Project Dup' },
      update: {},
    });

    await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Option X', description: '', createdBy: 'user-1' })
      .expect(201);

    const response = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Option X', description: '', createdBy: 'user-1' })
      .expect(409);

    expect(response.body.code).toBe('DUPLICATE_ESTIMATE_NAME');
    expect(response.body.message).toContain('Option X');
  });
});
