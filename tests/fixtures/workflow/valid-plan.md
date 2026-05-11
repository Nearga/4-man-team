# Arch Plan

## Objective

Goal: Build the feature.
Purpose: Make the user workflow complete.
Output: Working implementation.

## User Decisions And Constraints

- Locked decision: Use existing patterns.

## Deferred Scope

- Search is out of scope.

## Assumptions

- Existing tests cover baseline behavior.

## Context Read

- `src/app.ts` — entrypoint.

## Must Haves

Truths:
- User can complete the flow.

Artifacts:
- `src/app.ts` — real implementation.

Key links:
- `src/app.ts -> tests/app.test.ts` — behavior covered.

## Task Waves

### Wave 1 — Implementation

#### Task 1 — Implement feature

Type: auto

Files:
- `src/app.ts` — update behavior.

Action:
Add the feature using existing patterns.

Verify:

```bash
npm test
```

Done:
- Feature works and tests pass.

Dependencies:
- None.

## Verification

- [ ] npm test

## Risks

- Scope drift — keep deferred scope out.

## Rollback Notes

- Revert the feature commit.
