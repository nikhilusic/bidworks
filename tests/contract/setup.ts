import { beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';

export let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgresql://localhost:5432/bidworks_test';
  process.env.NODE_ENV = 'test';
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});
