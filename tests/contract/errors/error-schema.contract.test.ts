import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../setup.js';

describe('Contract: Error Schema', () => {
  it('returns ErrorResponse shape for 404 not found', async () => {
    const response = await supertest(app.server)
      .get('/projects/00000000-0000-0000-0000-000000000000/estimates/00000000-0000-0000-0000-000000000001/summary')
      .expect(404);

    expect(response.body).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
    });
    expect(response.body.code).toBeTruthy();
  });

  it('returns ErrorResponse shape for 400 validation error', async () => {
    const response = await supertest(app.server)
      .post('/projects/00000000-0000-0000-0000-000000000000/estimates')
      .send({}) // missing required fields
      .expect(400);

    expect(response.body).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
    });
  });
});
