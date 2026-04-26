# Tasks: Multiple Estimates per Project

**Input**: Design documents from `/specs/001-multiple-estimates-project/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/estimate-management.openapi.yaml

**Tests**: Contract, integration, and unit tests are included because deterministic roll-ups, isolation, and recalculation behavior are core feature requirements.

**Organization**: Tasks are grouped by user story to support independent delivery and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story mapping (`US1`, `US2`, `US3`)
- Include explicit file paths in every task

## Path Conventions

- Backend service paths from plan:
  - `src/api/routes/`
  - `src/api/schemas/`
  - `src/modules/estimation/`
  - `tests/contract/`, `tests/integration/`, `tests/unit/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish base project scaffolding, architecture artifacts, and test harness.

- [x] T001 Create backend folder structure markers in `src/api/routes/index.ts`, `src/modules/estimation/index.ts`, `src/shared/index.ts`, and `tests/README.md`
- [x] T002 Initialize project config in `package.json`, `tsconfig.json`, and `vitest.config.ts`
- [x] T003 [P] Configure Fastify bootstrap entry in `src/app.ts`
- [x] T004 [P] Configure lint/format tools in `.eslintrc.cjs` and `.prettierrc.json`
- [x] T005 Add environment and DB configuration scaffolding in `src/api/plugins/env.ts`, `src/api/plugins/db.ts`, and `.env.example`
- [x] T006 [P] Add shared money/time/error utilities in `src/shared/money/currency.ts`, `src/shared/time/clock.ts`, and `src/shared/errors/domain-error.ts`
- [ ] T007 Add architecture decision record references in `specs/001-multiple-estimates-project/research.md` and `specs/001-multiple-estimates-project/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build domain foundation and constitution gates required before user stories.

**CRITICAL**: No user story tasks start before this phase is complete.

- [x] T008 Define Prisma schema entities from `data-model.md` in `prisma/schema.prisma`
- [x] T009 Create initial DB migration for estimation model in `prisma/migrations/001_estimation_init/migration.sql` (depends on T008)
- [x] T010 Implement repository interfaces in `src/modules/estimation/domain/services/EstimateRepository.ts` and `src/modules/estimation/domain/services/TaskRepository.ts`
- [x] T011 Implement persistence adapters in `src/modules/estimation/infrastructure/persistence/PrismaEstimateRepository.ts` and `src/modules/estimation/infrastructure/persistence/PrismaTaskRepository.ts`
- [x] T012 Implement price-card provider and annual increment logic in `src/modules/estimation/infrastructure/pricing/PriceCardProvider.ts`
- [x] T013 Implement deterministic roll-up domain service in `src/modules/estimation/domain/services/RollupCalculator.ts`
- [x] T014 Implement optimistic revision/concurrency guard in `src/modules/estimation/application/commands/RevisionGuard.ts`
- [x] T015 Implement shared Zod validation schemas from OpenAPI contracts in `src/api/schemas/estimates.ts`
- [x] T016 Add base route registration and error mapping in `src/api/routes/projects.ts` and `src/api/routes/estimates.ts`
- [x] T017 [P] Add contract test harness bootstrap in `tests/contract/setup.ts`
- [x] T018 [P] Add integration test harness bootstrap in `tests/integration/setup.ts`
- [x] T019 [P] Add unit test helper utilities for decimal assertions in `tests/unit/helpers/decimal-assertions.ts`
- [x] T061 [P] Add shared API error-schema contract assertions in `tests/contract/errors/error-schema.contract.test.ts`
- [ ] T020 Constitution gate check: verify architecture/contracts/NFR traceability in `specs/001-multiple-estimates-project/plan.md`

**Checkpoint**: Foundation complete; user stories can proceed.

---

## Phase 3: User Story 1 - Create Independent Estimate Options (Priority: P1) MVP

**Goal**: Support multiple independent estimates under one project with unique naming, metadata, revisioning, and draft status.

**Independent Test**: Create three estimates for one project and verify unique name enforcement + no cross-estimate totals.

### Tests for User Story 1

- [x] T021 [P] [US1] Contract test for `POST /projects/{projectId}/estimates` in `tests/contract/estimates/create-estimate.contract.test.ts`
- [x] T022 [P] [US1] Contract test for duplicate-name conflict (`409`) in `tests/contract/estimates/create-estimate-duplicate.contract.test.ts`
- [x] T066 [P] [US1] Contract test for stale-revision conflict (`409`) in `tests/contract/estimates/stale-revision-conflict.contract.test.ts`
- [x] T023 [P] [US1] Integration test for estimate isolation in `tests/integration/estimates/estimate-isolation.test.ts`
- [x] T024 [P] [US1] Unit test for revision auto-increment behavior in `tests/unit/estimation/revisioning.test.ts`

### Implementation for User Story 1

- [x] T025 [US1] Implement `CreateEstimate` command handler in `src/modules/estimation/application/commands/CreateEstimate.ts`
- [x] T026 [US1] Implement unique-name-per-project domain rule in `src/modules/estimation/domain/services/EstimateNamingPolicy.ts`
- [x] T027 [US1] Implement estimate entity/value object mapping in `src/modules/estimation/domain/entities/Estimate.ts`
- [x] T028 [US1] Implement API handler for create estimate in `src/api/routes/estimates.ts`
- [x] T029 [US1] Persist audit fields and default `Draft` status in `src/modules/estimation/infrastructure/persistence/PrismaEstimateRepository.ts`
- [x] T030 [US1] Implement estimate retrieval query scoped by estimate id in `src/modules/estimation/application/queries/GetEstimateById.ts`

**Checkpoint**: US1 is deployable and independently testable.

---

## Phase 4: User Story 2 - Define Planning, Roles, and Task Effort (Priority: P2)

**Goal**: Capture planning data, role selections, task hierarchy, effort hours, and repetition counts.

**Independent Test**: Set start period/duration, select role types, add tasks, and ensure effort entry only for selected roles.

### Tests for User Story 2

- [x] T031 [P] [US2] Contract test for `PATCH /projects/{projectId}/estimates/{estimateId}` in `tests/contract/estimates/update-estimate.contract.test.ts`
- [x] T032 [P] [US2] Contract test for `PUT /projects/{projectId}/estimates/{estimateId}/roles` in `tests/contract/estimates/set-roles.contract.test.ts`
- [x] T033 [P] [US2] Contract test for `POST /projects/{projectId}/estimates/{estimateId}/tasks` in `tests/contract/estimates/create-task.contract.test.ts`
- [x] T034 [P] [US2] Integration test for role-selection enforcement in `tests/integration/estimates/role-selection-enforcement.test.ts`
- [x] T035 [P] [US2] Unit test for repetition multiplier in `tests/unit/estimation/repetition-multiplier.test.ts`

### Implementation for User Story 2

- [x] T036 [US2] Implement update estimate planning command in `src/modules/estimation/application/commands/UpdateEstimate.ts`
- [x] T037 [US2] Implement set roles command in `src/modules/estimation/application/commands/SetEstimateRoles.ts`
- [x] T038 [US2] Implement create task command with phase/module creation logic in `src/modules/estimation/application/commands/CreateTask.ts`
- [x] T039 [US2] Implement task entity and effort entry entities in `src/modules/estimation/domain/entities/Task.ts` and `src/modules/estimation/domain/entities/TaskEffortEntry.ts`
- [x] T040 [US2] Implement role membership guard for task effort entries in `src/modules/estimation/domain/services/RoleSelectionGuard.ts`
- [x] T041 [US2] Implement month-year start period and duration validation in `src/api/schemas/estimates.ts`
- [x] T042 [US2] Wire update/roles/task endpoints in `src/api/routes/estimates.ts`

**Checkpoint**: US1 + US2 work independently with validated planning/role/task data.

---

## Phase 5: User Story 3 - Calculate, Summarize, and Iterate Quickly (Priority: P3)

**Goal**: Provide immediate recalculation, task enable/disable behavior, annual rate recalculation, and summary view.

**Independent Test**: Edit effort and counts, disable tasks, change start-year, and verify roll-ups + summary outputs.

### Tests for User Story 3

- [x] T043 [P] [US3] Contract test for `PATCH /projects/{projectId}/estimates/{estimateId}/tasks/{taskId}` in `tests/contract/estimates/update-task.contract.test.ts`
- [x] T044 [P] [US3] Contract test for `GET /projects/{projectId}/estimates/{estimateId}/summary` in `tests/contract/estimates/get-summary.contract.test.ts`
- [x] T045 [P] [US3] Integration test for task disable exclusion from roll-ups in `tests/integration/estimates/task-disable-rollup.test.ts`
- [x] T046 [P] [US3] Integration test for start-year change recalculation in `tests/integration/estimates/start-year-recalculation.test.ts`
- [x] T047 [P] [US3] Unit test for hierarchy roll-up order in `tests/unit/estimation/rollup-hierarchy.test.ts`
- [x] T048 [P] [US3] Unit test for EUR precision/determinism in `tests/unit/estimation/currency-precision.test.ts`
- [ ] T064 [P] [US3] Integration test matrix for multi-role and multi-module roll-ups in `tests/integration/estimates/rollup-matrix.test.ts`
- [ ] T065 [P] [US3] Unit test for zero-hour effort entry behavior in `tests/unit/estimation/zero-hour-effort.test.ts`

### Implementation for User Story 3

- [ ] T049 [US3] Implement update task command (including enable/disable) in `src/modules/estimation/application/commands/UpdateTask.ts`
- [ ] T050 [US3] Implement recalculation orchestration on every write in `src/modules/estimation/application/commands/RecalculateEstimateTotals.ts`
- [ ] T051 [US3] Implement start-period-year rate re-evaluation logic in `src/modules/estimation/domain/services/PricingYearResolver.ts`
- [ ] T052 [US3] Implement summary query service in `src/modules/estimation/application/queries/GetEstimateSummary.ts`
- [ ] T053 [US3] Implement summary endpoint handler in `src/api/routes/estimates.ts`
- [ ] T054 [US3] Persist module/phase/estimate roll-up totals in EUR in `src/modules/estimation/infrastructure/persistence/RollupRepository.ts`

**Checkpoint**: All user stories functional and independently verifiable.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Final hardening across all stories.

- [ ] T055 [P] Update quickstart validation notes in `specs/001-multiple-estimates-project/quickstart.md`
- [ ] T056 Add request/response examples aligned to contract in `specs/001-multiple-estimates-project/contracts/estimate-management.openapi.yaml`
- [ ] T057 [P] Add performance benchmark test for recalculation latency in `tests/integration/estimates/recalculation-performance.test.ts`
- [ ] T058 [P] Add observability logs for roll-up traceability in `src/modules/estimation/application/commands/RecalculateEstimateTotals.ts`
- [ ] T059 Add audit assertions for created/updated metadata in `tests/integration/estimates/audit-fields.test.ts`
- [ ] T062 [P] Add pricing baseline and year+2 increment tests in `tests/unit/estimation/price-card-rules.test.ts` and `tests/integration/estimates/rate-year-increment.test.ts`
- [ ] T063 [P] Add operability assertions for required recalculation log fields in `tests/integration/estimates/recalculation-observability.test.ts`
- [ ] T060 Validate all NFR outcomes and document evidence in `specs/001-multiple-estimates-project/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): starts immediately.
- Foundational (Phase 2): depends on Setup.
- User Stories (Phases 3-5): depend on Foundational completion.
- Polish (Phase 6): depends on completion of targeted user stories.

### User Story Dependencies

- US1 (P1): no dependency on other user stories.
- US2 (P2): depends on foundational domain and persistence, but not on US3.
- US3 (P3): depends on US2 task/effort structures and foundational roll-up services.

### Within Each User Story

- Tests should be authored first and fail before implementation.
- Domain rules and command handlers before route wiring.
- Persistence integration before end-to-end integration tests.

## Parallel Execution Examples

### US1 Parallel

- T021, T022, T023, T024 can run in parallel.
- T026 and T027 can run in parallel before T025/T028.

### US2 Parallel

- T031, T032, T033, T034, T035 can run in parallel.
- T039, T040, T041 can run in parallel before endpoint wiring.

### US3 Parallel

- T043-T048, T064, and T065 can run in parallel.
- T051 and T052 can run in parallel before T053/T054.

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 (T021-T030).
3. Validate estimate independence and duplicate-name handling.

### Incremental Delivery

1. Add US2 for planning/roles/tasks.
2. Add US3 for recalculation/summary behavior.
3. Finalize with Phase 6 NFR and contract hardening tasks.

### Recommended Commit Slices

- Slice A: T001-T020 (foundation)
- Slice B: T021-T030 (US1)
- Slice C: T031-T042 (US2)
- Slice D: T043-T054 (US3)
- Slice E: T055-T063 (polish and coverage hardening)
- Slice F: T064-T065 (US3 matrix and zero-hour coverage)
