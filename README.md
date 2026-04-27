# BidWorks Estimation API

BidWorks Estimation API is a TypeScript service for managing multiple estimates under a single project. It exposes Fastify endpoints for creating estimates, selecting roles, managing estimate tasks, and querying estimate summaries while persisting data through Prisma and PostgreSQL.

## Tech Stack

- Node.js 22+
- TypeScript 5
- Fastify
- Prisma
- PostgreSQL
- Vitest
- Zod
- Decimal.js

## What It Does

- Supports multiple independent estimates per project.
- Enforces unique estimate names within a project.
- Tracks estimate revisions for optimistic concurrency.
- Manages selected roles and role-based task effort.
- Recalculates estimate totals synchronously after task or estimate changes.
- Exposes estimate summary data without project-level rollups.

## Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL 16 or compatible PostgreSQL instance

Default local database connection:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bidworks
```

Default local test database fallback:

```env
TEST_DATABASE_URL=postgresql://localhost:5432/bidworks_test
```

## Install

```bash
npm install
npx prisma generate
```

## Database Setup

Apply the Prisma schema to your local database:

```bash
npx prisma migrate dev
```

If you want to inspect the schema locally:

```bash
npx prisma studio
```

## Rebuild The App

For a normal rebuild:

```bash
rm -rf dist
npm run build
```

For a rebuild after Prisma schema changes:

```bash
npx prisma generate
npx prisma migrate dev
rm -rf dist
npm run build
```

The TypeScript build output is written to `dist`.

## Run Locally

This repository does not currently define a `start` or `dev` npm script. After building, start the compiled server with:

```bash
node dist/src/app.js
```

The API listens on:

- `PORT`, default `3000`
- `HOST`, bound to `0.0.0.0`

Basic health checks:

- `GET /`
- `GET /api/projects/health`

## Available Scripts

```bash
npm run build
npm run typecheck
npm test
npm run test:watch
npm run lint
```

## Testing

The test suite includes unit, integration, and contract coverage.

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Notes:

- Integration and contract tests boot the Fastify app directly.
- Tests use `TEST_DATABASE_URL` when present, otherwise they fall back to `DATABASE_URL` or `postgresql://localhost:5432/bidworks_test`.
- Integration setup clears estimate-related tables before each test.

## API Overview

Current route surface:

- `POST /api/projects/:projectId/estimates`
- `PATCH /api/projects/:projectId/estimates/:estimateId`
- `PUT /api/projects/:projectId/estimates/:estimateId/roles`
- `POST /api/projects/:projectId/estimates/:estimateId/tasks`
- `PATCH /api/projects/:projectId/estimates/:estimateId/tasks/:taskId`
- `GET /api/projects/:projectId/estimates/:estimateId`
- `GET /api/projects/:projectId/estimates/:estimateId/summary`

For the full contract, see:

- `specs/001-multiple-estimates-project/contracts/estimate-management.openapi.yaml`

## Project Layout

```text
src/
  app.ts
  api/
  modules/
  shared/
prisma/
  schema.prisma
  migrations/
tests/
  unit/
  integration/
  contract/
specs/
  001-multiple-estimates-project/
```

## Domain Notes

- Money is stored in EUR.
- Estimate rollups stop at the estimate level.
- Task totals are derived from role effort, pricing, and repetition count.
- Disabled tasks remain present but should contribute zero to rollups.

## Useful References

- `specs/001-multiple-estimates-project/spec.md`
- `specs/001-multiple-estimates-project/plan.md`
- `specs/001-multiple-estimates-project/quickstart.md`
- `prisma/schema.prisma`