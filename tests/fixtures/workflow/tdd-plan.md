# Arch Plan

## Step 6 — Add TDD Flow Validation

**Planner model:** test:model
**Selected flow:** tdd

## Objective

Goal: Validate that TDD plans start with tests and include concrete test verification.
Purpose: Keep test-first planning explicit when behavior can be specified before implementation.
Output: Plan checker rejects vague TDD plans and accepts concrete red/green/refactor plans.

## User Decisions And Constraints

- Locked decision: Use `Selected flow: tdd` instead of adding a task type.
- Constraint: Do not add new workflow state or commands.

## Deferred Scope

- Runtime orchestration changes are out of scope.

## Assumptions

- Existing plan checker tests cover the baseline structure.

## Context Read

- `scripts/four-man-team.ts` — plan checker implementation.
- `tests/workflow/four-man-team-cli.test.ts` — checker coverage.

Context intentionally not loaded:
- `.4-man-team/tasks` — not needed for static checker behavior.

## Must Haves

Truths:
- TDD plans fail when they do not begin with a test-focused implementation task.
- TDD plans fail when they do not include a concrete test command.

Artifacts:
- `scripts/four-man-team.ts` — TDD validation exists in the plan checker.
- `tests/workflow/four-man-team-cli.test.ts` — coverage proves valid and invalid TDD plans.

Key links:
- `scripts/four-man-team.ts` -> `tests/workflow/four-man-team-cli.test.ts` — checker rules are covered by workflow tests.

## TDD Notes

This plan uses red/green/refactor sequencing: first add the failing test, then implement the checker behavior, then refactor the helper names if needed.

## Task Waves

### Wave 1 — Checker Coverage

#### Task 1 — Red - Add failing TDD checker tests

Type: auto

Files:
- `tests/workflow/four-man-team-cli.test.ts` — add tests for TDD plan validation.

Action:
Red: add a failing test that expects `Selected flow: tdd` plans to start with a test-focused task and include a concrete test command.

Verify:

```bash
npm test
```

Done:
- Tests fail before the checker recognizes TDD structure.

Dependencies:
- None.

#### Task 2 — Green - Implement TDD checker rules

Type: auto

Files:
- `scripts/four-man-team.ts` — add TDD-only validation helpers.

Action:
Green: implement the minimal checker logic for red/green/refactor wording, test-focused first task, test file coverage, and concrete test commands.

Verify:

```bash
npm test
```

Done:
- TDD checker tests pass without changing non-TDD behavior.

Dependencies:
- Task 1.

#### Task 3 — Refactor - Keep validation helpers focused

Type: auto

Files:
- `scripts/four-man-team.ts` — keep helper names and error messages specific.

Action:
Refactor: keep the TDD helpers small and reuse existing task parsing helpers where possible.

Verify:

```bash
npm test
```

Done:
- Checker remains readable and all workflow tests pass.

Dependencies:
- Task 2.

## Verification

- [ ] npm test
- [ ] npm run plan:check -- tests/fixtures/workflow/tdd-plan.md

## Risks

- False positives on non-TDD plans — validate rules only when `Selected flow: tdd`.

## Rollback Notes

- Revert the TDD helper functions and TDD-specific tests.
