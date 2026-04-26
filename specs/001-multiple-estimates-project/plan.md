# Implementation Plan: Multiple Estimates per Project

**Branch**: `[001-multiple-estimates-project]` | **Date**: 2026-04-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multiple-estimates-project/spec.md`

## Summary

Deliver an estimate-management capability that supports multiple independent estimates under one project, detailed role-based task effort entry, annual price-card-based costing, and deterministic roll-ups to estimate level only. The implementation uses a modular service architecture with strict estimate isolation, synchronous recalculation on edits, and explicit contract validation for calculation correctness.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 22 LTS)  
**Primary Dependencies**: Fastify (API), Zod (input validation), Prisma (data access), Decimal.js (currency-safe arithmetic)  
**Storage**: PostgreSQL 16  
**Testing**: Vitest (unit/integration), Pactum or Supertest (API contract tests)  
**Target Platform**: Linux containerized service
**Project Type**: web-service  
**Performance Goals**: 95% of estimate recalculations complete within 2 seconds for expected load  
**Constraints**: EUR base-currency persistence, strict estimate isolation, deterministic roll-up outputs, no project-level roll-up  
**Scale/Scope**: 500 active projects, up to 20 estimates/project, up to 2,000 tasks/estimate
**Architecture Artifacts**: system design, component breakdown, data flow, API contracts, interaction patterns documented in this plan and contracts directory
**NFR Coverage**: performance, reliability, security/auditability, operability, maintainability/extensibility

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Architecture baseline exists and is approved before implementation work.
- [x] System design, component breakdown, and data flow are documented for core user journeys.
- [x] API contracts and interaction patterns are explicit, versioned where needed, and testable.
- [x] Minimum scalability/extensibility posture is defined with known limits and triggers.
- [x] Design decisions include rationale and rejected alternatives.
- [x] Applicable NFRs are documented with measurable acceptance checks.

## Project Structure

### Documentation (this feature)

```text
specs/001-multiple-estimates-project/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── estimate-management.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── routes/
│   │   ├── projects.ts
│   │   └── estimates.ts
│   ├── schemas/
│   └── plugins/
├── modules/
│   └── estimation/
│       ├── application/
│       │   ├── commands/
│       │   └── queries/
│       ├── domain/
│       │   ├── entities/
│       │   ├── value-objects/
│       │   └── services/
│       ├── infrastructure/
│       │   ├── persistence/
│       │   └── pricing/
│       └── mappers/
├── shared/
│   ├── errors/
│   ├── time/
│   └── money/
└── app.ts

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Single backend service was selected because the feature scope is domain-heavy (estimation logic, pricing, roll-up consistency) with no mandatory independent frontend deliverable in this iteration.

## System Design Baseline

### System Context

- Actors: estimator, reviewer.
- Upstream dependency: authenticated user context for audit fields.
- Domain boundaries: project-level container, estimate-level isolation, estimate-only roll-up boundaries.

### Component Breakdown

- Project Estimate Registry: enforces unique estimate naming within a project.
- Estimate Workspace: manages estimate identity, metadata, lifecycle (`Draft`), and planning fields.
- Task & Effort Ledger: records phase/module/task hierarchy, selected roles, effort hours, counts, and enabled state.
- Pricing & Rollup Engine: applies annual rates, year increments, repetition multipliers, and hierarchy roll-ups.
- Summary Query Service: serves aggregate metrics for review and approval.

### Data Flow (Core Journey)

1. Client writes estimate/task changes.
2. API validates payload and concurrency token.
3. Application layer updates estimate-scoped state.
4. Pricing & Rollup engine recomputes deterministic totals.
5. Updated totals are persisted in EUR.
6. Response returns recalculated totals and summary snapshot.

## Interaction Pattern Decisions

- Write interactions are synchronous request/response to satisfy immediate recalculation requirement.
- Read interactions expose summary and breakdown views for estimate-level review.
- Concurrency uses optimistic version checks to avoid silent overwrite of parallel edits.

## NFR Implementation Strategy

- Performance: estimate-scoped recomputation and indexed lookups per estimate.
- Reliability: decimal math and deterministic ordering in roll-up calculations.
- Security: immutable audit fields at create/update boundaries with actor traceability.
- Operability: explicit breakdown metrics at task/module/phase/estimate levels for diagnostics.
- Extensibility: rate-provider abstraction to support future regional pricing or alternate cards.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
