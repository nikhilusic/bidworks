# Research: Multiple Estimates per Project

## Decision 1: Use estimate-scoped aggregate recomputation on every write

- **Decision**: Recompute task/module/phase/estimate totals synchronously whenever an estimate mutation occurs.
- **Rationale**: The spec requires immediate reflection of edits in effort and cost totals and deterministic behavior.
- **Alternatives considered**:
  - Async background recomputation: rejected due to temporary inconsistency and delayed UI totals.
  - Incremental partial updates only: rejected due to higher defect risk with enable/disable and repetition interactions.

## Decision 2: Enforce estimate isolation at both query and persistence levels

- **Decision**: All totals are derived and retrieved using `estimate_id` as hard boundary; no project-level aggregate materialization.
- **Rationale**: Prevents cross-estimate contamination and matches requirement that one estimate option is selected later.
- **Alternatives considered**:
  - Shared project aggregate table: rejected because it risks accidental blending of option totals.

## Decision 3: Versioning with optimistic concurrency

- **Decision**: Keep auto-incrementing estimate revision and require expected revision/version on updates.
- **Rationale**: Clarified requirement introduces revisions; optimistic concurrency prevents silent collision when concurrent edits occur.
- **Alternatives considered**:
  - Last-write-wins: rejected as it can silently discard estimator changes.
  - Pessimistic locking: rejected for poor collaboration scalability.

## Decision 4: Pricing year derived from estimate start period

- **Decision**: Applicable rate year is derived from estimate start period (month-year); year change triggers recalculation of all task costs.
- **Rationale**: Matches clarified rule and ensures consistent estimate totals against selected planning year.
- **Alternatives considered**:
  - Preserve historical rates after year changes: rejected; conflicts with clarification outcome.

## Decision 5: Currency-safe arithmetic in EUR

- **Decision**: Perform all cost math using decimal type and persist roll-ups in EUR base currency.
- **Rationale**: Avoid floating-point errors and satisfy base currency storage requirement.
- **Alternatives considered**:
  - Floating-point math: rejected due to rounding instability.

## Decision 6: Solution component metric mapping

- **Decision**: Define `total_solution_components` as count of distinct solution phases.
- **Rationale**: Explicitly clarified during spec refinement, removing ambiguity for summary calculations.
- **Alternatives considered**:
  - Separate component entity now: rejected for this iteration scope.

## Decision 7: Roll-up hierarchy implementation

- **Decision**: Implement strict hierarchy: role entry -> task -> module -> solution phase -> estimate.
- **Rationale**: Required by BR and supports auditable drill-down.
- **Alternatives considered**:
  - Direct task-to-estimate aggregation only: rejected because it loses mandated intermediate roll-up levels.
