<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
	- Template Principle 1 -> I. Architecture-First Delivery Gate
	- Template Principle 2 -> II. Mandatory System Design Artifacts
	- Template Principle 3 -> III. Explicit API Contracts and Interaction Patterns
	- Template Principle 4 -> IV. Baseline Scalability and Extensibility
	- Template Principle 5 -> V. Decision Records and NFR Accountability
- Added sections:
	- Architecture Documentation Standards
	- Development Workflow and Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending review path: .specify/templates/commands/*.md (directory not present)
- Follow-up TODOs:
	- None
-->

# Bidworks Constitution

## Core Principles

### I. Architecture-First Delivery Gate
Implementation work MUST NOT begin until an approved architecture baseline exists for the
target feature. The baseline MUST define system boundaries, runtime context, and intended
deployment shape. This prevents ad hoc implementation and reduces redesign churn.

### II. Mandatory System Design Artifacts
Every feature plan MUST include a system design summary, component breakdown, and data flow
description. The component view MUST identify ownership and responsibilities for each major
module. The data flow MUST document producers, consumers, and state transitions for key user
journeys so reviewers can validate correctness and failure handling.

### III. Explicit API Contracts and Interaction Patterns
All internal and external interfaces MUST be documented before implementation. Contracts MUST
define request/response schemas, error semantics, versioning expectations, and idempotency
behavior where applicable. Interaction patterns (sync, async, evented, batch) MUST be declared
and justified to prevent ambiguous integration behavior.

### IV. Baseline Scalability and Extensibility
Designs MUST include a minimum scalability and extensibility posture aligned to expected near-
term load. Plans MUST identify scaling bottlenecks, safe extension points, and compatibility
constraints for future capabilities. If horizontal scaling is not required, the design MUST
state why and define the threshold that would trigger redesign.

### V. Decision Records and NFR Accountability
Material architecture decisions MUST include documented rationale and rejected alternatives.
Each feature MUST define applicable non-functional requirements (performance, reliability,
security, operability, cost, maintainability, or compliance) with verifiable acceptance checks.
Unspecified NFRs are allowed only when explicitly marked out of scope with rationale.

## Architecture Documentation Standards

- Architecture artifacts MUST be stored with feature documentation and linked from plan output.
- Architecture sections MUST use testable language (`MUST`, `MUST NOT`, `SHOULD`) and avoid
	vague qualifiers.
- Contract documents MUST remain implementation-agnostic while still being executable as test
	inputs where practical.
- Design updates that change interactions or data flow MUST update both contracts and decision
	rationale in the same change set.

## Development Workflow and Quality Gates

- A Constitution Check gate MUST verify architecture baseline completeness before research and
	before implementation tasks are finalized.
- Specification output MUST capture architecture/NFR requirements that can be mapped to tasks.
- Task generation MUST include architecture, contract, and NFR validation tasks as first-class
	work items rather than implied cleanup.
- Pull requests MUST provide evidence for architecture decisions, contract conformance, and NFR
	verification relevant to the changed scope.

## Governance

This constitution is the authoritative engineering policy for Bidworks planning and delivery.
Amendments require: (1) explicit change rationale, (2) update of dependent templates, and
(3) recorded version bump rationale using semantic versioning.

Version policy:
- MAJOR: Removes or redefines a core principle or governance requirement in a breaking way.
- MINOR: Adds a new principle/section or materially expands mandatory guidance.
- PATCH: Clarifies wording, fixes typos, or improves non-semantic guidance.

Compliance review expectations:
- Every implementation plan MUST pass Constitution Check gates.
- Reviews MUST block merges that violate mandatory principles without an approved waiver.
- Waivers MUST be time-bound, include mitigation tasks, and be tracked in feature artifacts.

**Version**: 1.0.0 | **Ratified**: 2026-04-26 | **Last Amended**: 2026-04-26
