# Routing Policy

## Task Classes

### Trivial

Use for answer-only work or very small edits.

Criteria:

- one file or no file edits
- low ambiguity
- no schema/API migration
- no security impact
- expected under 15 minutes

Default flow:

- no separate planning phase
- execute with `model_priorities.execution`
- review optional

### Medium

Use for bounded implementation.

Criteria:

- 2-5 files
- clear existing patterns
- tests or verification commands are known
- rollback is simple

Default flow:

- planner optional
- execute with `model_priorities.execution`
- review with `model_priorities.review`

### Complex

Use for high-judgment or high-risk work.

Criteria:

- architecture decisions
- cross-module behavior
- security-sensitive work
- migrations
- unclear product intent
- many files
- high rollback cost

Default flow:

- plan with `model_priorities.planning`
- ask for confirmation after plan
- execute bounded chunks with `model_priorities.execution`
- review with `model_priorities.review`

## Review Rule

The exact model that executed a task must not be selected as reviewer when another configured model is available.

Prefer a different provider. If only the same provider is available, use a different model. If no distinct reviewer is available, Orvo asks the user whether to proceed.

## Observation Rule

Orvo runs observer mode after Reviewer when Orvo closes the task.

Observation mode does not replace Reviewer and does not block closure by default. Its job is to read `TASK.md`, `PLAN.md`, `EXECUTION.md`, `REVIEW.md`, `STATUS.md`, relevant logs, and the final diff, then write suggestions to `OBSERVATION.md`.

Observation mode focuses on:

- missed signals in logs
- workflow improvements
- better model routing choices
- prompt/config changes
- repeated failure patterns
- follow-up tasks worth capturing

## Fallback Rule

When a model is unavailable or exhausted:

1. Orvo reports the failed model and phase.
2. Orvo selects the next model from the phase priority list.
3. Orvo records the fallback in `STATUS.md`.
4. If all models for a phase fail, Orvo asks the user to choose a narrower scope or wait for quota recovery.
