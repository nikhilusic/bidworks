import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000001';

describe('Contract: POST /projects/:projectId/estimates', () => {
  it('returns 201 with Estimate shape on valid create', async () => {
    // Ensure project exists
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Test Project' },
      update: {},
    });

    const response = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({
        name: 'Option A',
        description: 'First estimate',
        startPeriod: '2026-01',
        durationMonths: 6,
        createdBy: 'user-1',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      projectId: PROJECT_ID,
      name: 'Option A',
      revision: 1,
      status: 'Draft',
      createdBy: 'user-1',
      totalEffortHours: 0,
      totalCostEur: 0,
    });
  });

  it('returns 400 when name is missing', async () => {
    const response = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ description: 'no name', createdBy: 'user-1' })
      .expect(400);

    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
