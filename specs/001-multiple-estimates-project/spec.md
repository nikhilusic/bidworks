# Feature Specification: Multiple Estimates per Project

**Feature Branch**: `[001-multiple-estimates-project]`  
**Created**: 2026-04-26  
**Status**: Draft  
**Input**: User description: "Multiple estimates per project with independent estimate options, role-based task effort, automated effort/cost rollups, and summary support"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Independent Estimate Options (Priority: P1)

As an estimator, I can create multiple estimates under one project, each representing a different implementation option, so I can compare approaches without mixing their effort and cost data.

**Why this priority**: This is the core capability; without independent estimates, the feature does not deliver business value.

**Independent Test**: Create three estimates under one project, confirm each has unique identity and metadata, and verify that totals for one estimate never include data from the others.

**Acceptance Scenarios**:

1. **Given** a project already has one estimate named "Option A", **When** a user creates a new estimate named "Option B", **Then** the new estimate is created with its own metadata and default status `Draft`.
2. **Given** a project already has an estimate named "Option A", **When** a user attempts to create another estimate with the same name, **Then** the system rejects the request and asks for a different name.
3. **Given** multiple estimates exist in one project, **When** a user views totals for one estimate, **Then** only that estimate's effort and cost data are shown.

---

### User Story 2 - Define Planning, Roles, and Task Effort (Priority: P2)

As an estimator, I can define planning context, choose role types, and enter detailed task-level effort so the estimate reflects realistic delivery work.

**Why this priority**: Detailed planning and effort capture are required for estimate quality and downstream review.

**Independent Test**: For one estimate, set planning fields, select role types, add tasks with phase/module/title/description/repetitions, and enter effort hours by selected role type.

**Acceptance Scenarios**:

1. **Given** an estimate in `Draft`, **When** a user sets expected start period and estimated duration, **Then** the planning information is stored and displayed on that estimate.
2. **Given** an estimate has selected role types, **When** a user edits task effort, **Then** effort entry is allowed only for the selected role types.
3. **Given** a task is repeated multiple times, **When** a user enters a repetition count, **Then** the task's total effort reflects the repeated instances.

---

### User Story 3 - Calculate, Summarize, and Iterate Quickly (Priority: P3)

As an estimator or reviewer, I can see automatic effort/cost rollups, summary metrics, and immediate updates after edits, so I can quickly compare options and prepare a submission-ready estimate.

**Why this priority**: Automated totals and rapid updates are essential for decision-making and scenario experimentation.

**Independent Test**: Add and disable tasks, modify effort values, and verify recalculated task totals, estimate totals, and summary metrics update immediately and correctly.

**Acceptance Scenarios**:

1. **Given** tasks with effort hours and applicable rates, **When** effort values or counts change, **Then** task and estimate effort/cost totals are recalculated immediately.
2. **Given** a task is disabled, **When** totals are recalculated, **Then** the task remains visible but contributes zero effort and zero cost to rollups.
3. **Given** an estimate has multiple phases/modules/tasks, **When** a user opens summary view, **Then** all required summary metrics are shown and consistent with roll-up rules.

---

## Architecture & Design *(mandatory)*

### System Design

- **Architecture Style**: Estimate-centric domain workflow with project-level option management.
- **System Context**: Estimators and reviewers manage multiple estimate options per project; pricing inputs come from an annual role price card.
- **Deployment Shape**: Central estimation capability serving project workspaces with isolated estimate contexts.

### Component Breakdown

- **Project Estimate Registry**: Maintains project-to-estimate relationships and enforces unique estimate names per project.
- **Estimate Workspace**: Stores estimate identity, metadata, planning fields, and status lifecycle.
- **Task & Effort Ledger**: Captures phase/module/task structure, selected role types, effort hours, repetitions, and enabled/disabled state.
- **Pricing & Rollup Engine**: Applies role rates, annual increments, effort multipliers, and hierarchy roll-up rules to calculate totals.
- **Estimate Summary View**: Presents count metrics and effort/cost totals for review and approval.

### Data Flow

1. Estimator creates or updates an estimate -> Estimate Workspace validates identity and metadata -> Estimate is stored independently within project context.
2. Estimator edits tasks/roles/effort -> Task & Effort Ledger records changes -> Pricing & Rollup Engine recalculates totals -> Summary View refreshes values.

### API Contracts & Interaction Patterns

- **Contract: Create Estimate**: Accepts project reference, estimate name, version, description, and creator metadata; returns a new estimate with default status `Draft`.
- **Contract: Update Estimate Planning and Tasks**: Accepts planning fields, selected role types, and task-level inputs (phase, module, task details, role effort, repetition, enabled flag); returns updated estimate details and recalculated totals.
- **Contract: Retrieve Estimate Summary**: Returns summary counts and roll-up effort/cost metrics for one estimate only.
- **Interaction Pattern**: Synchronous update-and-recalculate behavior for estimator edits; each write operation returns recalculated totals for immediate feedback.
- **Clarified Contract Rules**:
	- Version identifiers are system-managed and auto-increment per estimate revision.
	- Estimate status lifecycle for this feature is `Draft` only.
	- Expected start period format is month-year; duration format is whole months.
	- When start-period year changes, all existing task costs are recalculated using rates for the new year.

### Scalability & Extensibility Baseline

- **Expected Initial Load**: Support at least 500 active projects, up to 20 estimates per project, and up to 2,000 tasks per estimate.
- **Scaling Plan**: Keep calculations scoped to estimate boundaries to avoid project-level aggregation overhead and reduce recalculation blast radius.
- **Extensibility Points**: Role catalog expansion, additional effort types, regional display currency preferences, and alternate summary groupings.
- **Redesign Trigger**: Re-architecture is required when 95th percentile recalculation exceeds agreed response target under normal operating load.

### Design Decisions & Rationale

- **Decision 1**: Keep estimate data fully isolated within project scope to support option comparison without cross-contamination.
- **Alternative Rejected**: Shared project-level roll-up across all estimates was rejected because only one estimate option is typically selected for submission.
- **Decision 2**: Store roll-up amounts in EUR as the base currency.
- **Alternative Rejected**: Storing only display currency values was rejected because it reduces consistency for backend aggregation and reporting.

### Non-Functional Requirements (NFRs)

- **NFR-001 Performance**: Recalculation after edits must complete within 2 seconds for at least 95% of estimate updates under expected load.
- **NFR-002 Reliability**: Calculation consistency must be deterministic; identical inputs must always produce identical totals.
- **NFR-003 Security**: Created/updated user and timestamp fields must be auditable for all estimate changes.
- **NFR-004 Operability**: Summary and roll-up values must be observable at task/module/phase/estimate levels for troubleshooting.
- **NFR-005 Maintainability/Extensibility**: New role types and annual rate updates must be introducible without redefining existing estimate history.

### Edge Cases

- What happens when an estimate has zero tasks but must still be saved and reviewed?
- How does the system handle duplicate estimate names within the same project but allow the same name across different projects?
- What happens when a task has effort hours for a role that is not selected for that estimate?
- How does the system handle negative effort hours, zero-hour entries, or invalid repetition counts?
- What happens to totals when all tasks are disabled?
- How does the system determine applicable billing year when expected start period is changed after tasks are entered?
- What happens when an estimate revision is created while another revision is saved concurrently?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to create multiple estimates under a single project.
- **FR-002**: The system MUST maintain each estimate independently and MUST NOT combine effort or cost across estimates.
- **FR-003**: The system MUST require each estimate name to be unique within a project.
- **FR-004**: The system MUST capture estimate identity attributes: name, version identifier, and description.
- **FR-005**: The system MUST capture and maintain audit fields: Created Date, Created By, Updated Date, and Updated By.
- **FR-006**: The system MUST assign `Draft` as the default status at estimate creation.
- **FR-007**: The system MUST capture estimate planning information with expected project start period in month-year format and estimated project duration in whole months.
- **FR-008**: The system MUST allow estimators to define tasks for solution delivery.
- **FR-009**: Each task MUST capture delivery phase, module, task title, and task description.
- **FR-010**: The system MUST allow each estimate to define selected role types applicable to that estimate.
- **FR-011**: The system MUST allow task-level effort entry only for role types selected in that estimate.
- **FR-012**: Effort values MUST represent estimated work hours per role type.
- **FR-013**: The system MUST support task repetition count and MUST apply it to total task effort.
- **FR-014**: The system MUST automatically calculate total effort and total cost for each task.
- **FR-015**: The system MUST automatically calculate aggregated effort and cost across module, solution phase, and estimate levels.
- **FR-016**: Cost calculations MUST use effort hours multiplied by applicable billing rates.
- **FR-017**: The system MUST support task enable/disable behavior where disabled tasks remain visible but are excluded from all roll-up totals.
- **FR-018**: The system MUST provide an estimate summary view containing: total solution components, total modules, total tasks, total effort by effort type, overall estimated effort, and overall estimated cost.
- **FR-019**: The system MUST reflect edits to tasks and effort values immediately in all relevant totals.
- **FR-020**: The system MUST provide a static annual EUR price card for the current year using the defined role/rate set.
- **FR-021**: For each subsequent year, the system MUST apply a EUR +2.0 increase per role rate.
- **FR-022**: The system MUST execute cost roll-up hierarchy in this order: role type -> task -> module -> solution phase -> estimate.
- **FR-023**: The system MUST NOT roll up estimate totals to project totals.
- **FR-024**: The system MUST store calculated roll-up amounts in EUR in backend records.
- **FR-025**: The system MUST auto-generate and auto-increment the estimate version identifier for each revision within a project.
- **FR-026**: The system MUST support `Draft` as the only estimate status in this feature scope.
- **FR-027**: The summary metric for total solution components MUST equal the count of distinct solution phases in the estimate.
- **FR-028**: If expected start period year is changed, the system MUST recalculate all existing task costs using the updated year's role rates.

### Key Entities *(include if feature involves data)*

- **Project**: Parent context containing one or more independent estimates.
- **Estimate**: A distinct implementation option with identity, metadata, planning fields, status, and roll-up totals.
- **Role Type**: A selectable labor role used for task effort entry and pricing.
- **Price Card Rate**: Annual EUR billing rate per role type, including yearly increment logic.
- **Task**: Unit of planned work under a module and solution phase, including repetition count and enable/disable state.
- **Task Effort Entry**: Effort-hours record for a task-role pairing used for effort and cost calculations.
- **Module**: Logical grouping of tasks within a solution phase.
- **Solution Phase**: Higher-level grouping of modules used for estimate roll-up.
- **Estimate Summary**: Computed aggregate metrics for review and approval.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create and maintain at least 3 independent estimate options under one project without any cross-estimate total contamination.
- **SC-002**: 100% of new estimates start with status `Draft` and complete identity/audit metadata.
- **SC-003**: For 95% of estimate edits, recalculated effort and cost totals are visible to users within 2 seconds.
- **SC-004**: 100% of disabled tasks are excluded from effort/cost totals while remaining visible in estimate views.
- **SC-005**: 100% of sampled roll-ups follow the required hierarchy and match expected calculation outcomes.
- **SC-006**: 100% of stored roll-up totals are persisted in EUR and are consistent with the applicable annual price card rules.

## Assumptions

- Existing authentication and authorization mechanisms already identify the acting user for Created By/Updated By fields.
- Expected project start period is captured as month-year and determines the applicable pricing year for annual rate selection.
- The provided current-year price card is authoritative and managed as reference data for this feature scope.
- Solution component count is defined as the number of distinct solution phases.
- Existing tasks are recalculated when expected start period year changes.
- Approval workflow beyond summary review is out of scope for this feature iteration.
