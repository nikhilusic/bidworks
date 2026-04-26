import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../../src/app.js';

export let app: Awaited<ReturnType<typeof buildApp>>;
export let db: PrismaClient;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgresql://localhost:5432/bidworks_test';
  process.env.NODE_ENV = 'test';
  app = await buildApp();
  db = app.db;
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  // Clean up test data in dependency order
  await db.taskEffortEntry.deleteMany();
  await db.task.deleteMany();
  await db.module.deleteMany();
  await db.solutionPhase.deleteMany();
  await db.estimateRoleSelection.deleteMany();
  await db.estimate.deleteMany();
  await db.priceCardRate.deleteMany();
  await db.roleType.deleteMany();
  await db.project.deleteMany();
});
