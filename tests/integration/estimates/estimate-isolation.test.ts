import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, db } from '../setup.js';

const PROJECT_A = '10000000-0000-0000-0000-000000000001';
const PROJECT_B = '10000000-0000-0000-0000-000000000002';

describe('Integration: Estimate isolation', () => {
  it('three estimates under one project have unique names and isolated totals', async () => {
    await db.project.create({ data: { id: PROJECT_A, name: 'Project Alpha' } });

    const names = ['Option A', 'Option B', 'Option C'];
    const ids: string[] = [];

    for (const name of names) {
      const res = await supertest(app.server)
        .post(`/projects/${PROJECT_A}/estimates`)
        .send({ name, description: '', createdBy: 'user-1' })
        .expect(201);
      ids.push(res.body.id as string);
    }

    // All 3 have distinct IDs
    expect(new Set(ids).size).toBe(3);

    // Each has 0 totals and no cross-contamination
    for (const id of ids) {
      const est = await db.estimate.findUnique({ where: { id } });
      expect(parseFloat(est!.totalEffortHours.toString())).toBe(0);
      expect(parseFloat(est!.totalCostEur.toString())).toBe(0);
    }
  });

  it('estimates under different projects are independent', async () => {
    await db.project.create({ data: { id: PROJECT_B, name: 'Project Beta' } });

    await supertest(app.server)
      .post(`/projects/${PROJECT_A}/estimates`)
      .send({ name: 'Shared Name', description: '', createdBy: 'user-1' })
      .expect(201);

    // Same name is allowed under different project
    await supertest(app.server)
      .post(`/projects/${PROJECT_B}/estimates`)
      .send({ name: 'Shared Name', description: '', createdBy: 'user-1' })
      .expect(201);
  });
});
