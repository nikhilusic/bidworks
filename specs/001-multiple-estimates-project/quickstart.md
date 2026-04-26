# Quickstart: Multiple Estimates per Project

## Goal

Validate that independent estimates, effort/cost calculations, and summary roll-ups behave as specified.

## Prerequisites

- Service is running locally.
- Test database is available.
- Seeded role catalog and base-year EUR price card are loaded.

## Scenario 1: Independent Estimates Under One Project

1. Create project `Project-Alpha`.
2. Create estimate `Option A` with start period `2027-03` and duration `6` months.
3. Create estimate `Option B` under the same project.
4. Verify duplicate name rejection by attempting to create another `Option A`.
5. Confirm each estimate has independent totals and default status `Draft`.

## Scenario 2: Role Selection and Task Effort Entry

1. In `Option A`, select role types:
   - Technical Project Manager
   - Software Developer (Senior)
2. Add solution phase `Build`, module `Core`, and task `Implement API` with repetition count `2`.
3. Enter effort:
   - Technical Project Manager: 8 hours
   - Software Developer (Senior): 24 hours
4. Verify task total effort equals `(8 + 24) * 2 = 64` hours.

## Scenario 3: Pricing and Roll-Up Validation

1. Using applicable rate year from start period:
   - Compute task role costs as `effort_hours * rate` then apply repetition count.
2. Verify roll-up sequence:
   - Role entries -> task -> module -> solution phase -> estimate.
3. Confirm project-level totals are not generated.

## Scenario 4: Disable Task Behavior

1. Disable `Implement API` task.
2. Verify task remains visible in listings.
3. Verify task contributes zero to module/phase/estimate effort and cost.

## Scenario 5: Start Period Year Change Recalculation

1. Change estimate start period year from `2027-03` to `2028-03`.
2. Verify all existing task costs recalculate using year+1 rates (base + EUR 2.0 per role).
3. Verify recalculated totals propagate through all roll-up levels.

## Scenario 6: Summary View Checks

1. Open estimate summary for `Option A`.
2. Validate:
   - Total solution components = distinct solution phases
   - Total modules
   - Total tasks
   - Total effort by role type
   - Overall effort and overall cost

## Expected Outcome

- All scenarios pass with deterministic totals and audit metadata present.
- 95% of recalculations complete within 2 seconds during local benchmark runs.
