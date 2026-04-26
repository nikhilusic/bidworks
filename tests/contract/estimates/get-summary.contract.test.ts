import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

const PROJECT_ID = '00000000-0000-0000-0000-000000000014';

describe('Contract: GET /projects/:projectId/estimates/:estimateId/summary', () => {
  it('returns 200 with EstimateSummary shape', async () => {
    await app.db.project.upsert({
      where: { id: PROJECT_ID },
      create: { id: PROJECT_ID, name: 'Summary Project' },
      update: {},
    });

    const roleType = await app.db.roleType.create({ data: { name: 'Analyst' } });
    await app.db.priceCardRate.create({
      data: { roleTypeId: roleType.id, rateYear: 2026, hourlyRateEur: 90 },
    });

    const createRes = await supertest(app.server)
      .post(`/projects/${PROJECT_ID}/estimates`)
      .send({ name: 'Summary Estimate', description: '', startPeriod: '2026-01', createdBy: 'user-1' })
      .expect(201);

    const estimateId = createRes.body.id as string;

    const response = await supertest(app.server)
      .get(`/projects/${PROJECT_ID}/estimates/${estimateId}/summary`)
      .expect(200);

    expect(response.body).toMatchObject({
      estimateId,
      totalSolutionComponents: 0,
      totalModules: 0,
      totalTasks: 0,
      totalEffortByRoleType: [],
      overallEffortHours: 0,
      overallCostEur: 0,
    });
  });

  it('returns 404 for non-existent estimate', async () => {
    const response = await supertest(app.server)
      .get(`/projects/${PROJECT_ID}/estimates/00000000-0000-0000-0000-000000000099/summary`)
      .expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });
});
