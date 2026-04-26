# Data Model: Multiple Estimates per Project

## Entity: Project

- **Purpose**: Parent container for multiple independent estimates.
- **Key fields**:
  - `id` (UUID)
  - `name` (string)
- **Relationships**:
  - One-to-many with Estimate.

## Entity: Estimate

- **Purpose**: Independent implementation option under a project.
- **Key fields**:
  - `id` (UUID)
  - `project_id` (UUID, FK)
  - `name` (string, unique within project)
  - `revision` (integer, auto-increment per estimate revision)
  - `description` (text)
  - `status` (enum, currently `Draft` only)
  - `start_period` (YYYY-MM)
  - `duration_months` (integer > 0)
  - `created_at`, `created_by`
  - `updated_at`, `updated_by`
  - `total_effort_hours` (decimal)
  - `total_cost_eur` (decimal)
- **Relationships**:
  - One-to-many with EstimateRoleSelection.
  - One-to-many with SolutionPhase.

## Entity: EstimateRoleSelection

- **Purpose**: Role types enabled for effort entry in one estimate.
- **Key fields**:
  - `id` (UUID)
  - `estimate_id` (UUID, FK)
  - `role_type_id` (UUID, FK)

## Entity: RoleType

- **Purpose**: Catalog of labor roles (e.g., Technical Project Manager, Software Developer Senior).
- **Key fields**:
  - `id` (UUID)
  - `name` (string)
  - `seniority` (string, optional)

## Entity: PriceCardRate

- **Purpose**: EUR billing rate per role type and rate year.
- **Key fields**:
  - `id` (UUID)
  - `role_type_id` (UUID, FK)
  - `rate_year` (integer)
  - `hourly_rate_eur` (decimal)
- **Rules**:
  - For year N+1, default rate is year N + 2.0 EUR unless explicitly overridden.

## Entity: SolutionPhase

- **Purpose**: Top-level grouping for modules inside an estimate.
- **Key fields**:
  - `id` (UUID)
  - `estimate_id` (UUID, FK)
  - `name` (string)
  - `total_effort_hours` (decimal)
  - `total_cost_eur` (decimal)

## Entity: Module

- **Purpose**: Grouping of tasks under a solution phase.
- **Key fields**:
  - `id` (UUID)
  - `solution_phase_id` (UUID, FK)
  - `name` (string)
  - `total_effort_hours` (decimal)
  - `total_cost_eur` (decimal)

## Entity: Task

- **Purpose**: Estimable delivery work item.
- **Key fields**:
  - `id` (UUID)
  - `module_id` (UUID, FK)
  - `title` (string)
  - `description` (text)
  - `repetition_count` (integer >= 1)
  - `is_enabled` (boolean)
  - `total_effort_hours` (decimal)
  - `total_cost_eur` (decimal)

## Entity: TaskEffortEntry

- **Purpose**: Effort-hours entry per task and selected role type.
- **Key fields**:
  - `id` (UUID)
  - `task_id` (UUID, FK)
  - `role_type_id` (UUID, FK)
  - `effort_hours` (decimal >= 0)
  - `hourly_rate_eur` (decimal)
  - `cost_eur` (decimal)
- **Rules**:
  - Role must exist in EstimateRoleSelection for parent estimate.

## Derived Summary Model (EstimateSummary)

- `total_solution_components` = count(distinct solution phases)
- `total_modules`
- `total_tasks`
- `total_effort_by_role_type`
- `overall_effort_hours`
- `overall_cost_eur`

## Invariants

- Estimate name uniqueness scope: `(project_id, name)`.
- No cross-estimate aggregation for totals.
- Disabled tasks contribute 0 effort and 0 cost to roll-ups but remain queryable.
- Roll-up order is fixed: task effort entries -> task -> module -> solution phase -> estimate.
- All persisted roll-up amounts are EUR.
