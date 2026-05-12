# Arch Plan
*Written by Arch. Read by Orvo, Executor, and Reviewer.*
*Template source only. Copy into `.4-man-team/tasks/<task-id>/` before writing.*
*Overwrite this file for each active task. It is the executable brief.*

---

## Step [N] — [What is being built]

**Planner model:** [provider:model]
**Selected flow:** [trivial / medium / complex / tdd]

## Objective

Goal: [One sentence describing the result.]
Purpose: [Why this matters.]
Output: [Artifacts or behavior expected after execution.]

## User Decisions And Constraints

- Locked decision: [User-approved decision Executor must honor.]
- Constraint: [Technical, product, or process constraint.]

## Deferred Scope

- [Explicitly out-of-scope item.]
- [Future work to log instead of doing now.]

## Assumptions

- [Assumption Arch is making.]
- [Assumption Executor should validate before editing.]

## Context Read

- `path/to/file` — [why it was read]
- `path/to/subsystem` — [why it matters]

Context intentionally not loaded:
- [File/subsystem] — [why it was not needed]

## Must Haves

List must-haves before task waves. These prove the user goal, not just the implementation steps.

Truths:
*Observable outcomes that must be true from the user or system perspective.*
- [Observable behavior that must be true for the goal to be achieved.]

Artifacts:
*Concrete files, scripts, configs, docs, or generated outputs. Use path-based artifacts when files change.*
- `path/to/file` — [what real implementation must exist there.]

Key links:
*Important connections likely to break if missed, such as prompt -> template, CLI -> task folder, config -> runtime.*
- `path/to/source` -> `path/to/target` — [connection that must work.]
- None - no cross-file/runtime link for this trivial task.

## TDD Notes

Use `Selected flow: tdd` when expected behavior can be stated before implementation. Good fits include pure functions, validation rules, data transforms, API contracts, state machines, CLI input/output, and deployment logic.

TDD is usually not useful for prompt-only edits, docs-only edits, one-off shell glue, or visual/UI polish without stable assertions.

For TDD plans:
- The first non-checkpoint task must add or update the failing test.
- Include red/green/refactor sequencing in the task actions.
- Include a concrete test verification command such as `npm test`, `bun test`, `pytest`, or `cargo test`.

## Task Waves

### Wave 1 — [Independent or first dependency group]

#### Task 1 — [Action-oriented name]

Type: auto

Files:
- `path/to/file.ext` — [ownership/change]

Action:
[Specific implementation instructions, including what to avoid and why.]

Verify:

```bash
[command]
```

Done:
- [Measurable acceptance criterion.]

Dependencies:
- None / [Task or wave dependency.]

#### Task 2 — [Action-oriented name]

Type: checkpoint:decision

Files:
- `path/to/file.ext` — no edits until the user decides.

Action:
Ask Orvo to ask the user: "[exact decision question]". Continue only after the user chooses one option. If the user declines or cannot decide, keep the task blocked and record the reason in `STATUS.md`.

Verify:
User answer selects a concrete option and unblocks the dependent implementation task.

Done:
- Orvo records the selected option in `STATUS.md`.

Dependencies:
- Task 1.

## Checkpoint Rules

- Approved task types: `auto`, `checkpoint:decision`, `checkpoint:human-verify`, `checkpoint:human-action`, `checkpoint:external-setup`.
- If CLI, API, or browser automation can reasonably perform or verify the work, plan it as `auto`, not as a checkpoint.
- Checkpoints are only for decisions, manual verification, external setup, or unavoidable user-only actions.
- Checkpoint `Action:` must include the exact Orvo/user-facing question or instruction and what result unblocks execution.
- Prefer checkpoints between waves; use an in-wave checkpoint only when the dependency is local and explicit.

## Human Checkpoints

- [Checkpoint type] — [what Orvo must ask or what user must verify.]

## Verification

- [ ] [Specific automated command]
- [ ] [Build/type check]
- [ ] [Behavior verification]

## Risks

- [Risk] — [mitigation]

## Rollback Notes

- [How to revert safely]

## Orvo Notes

[Planning approval notes, routing notes, or redirect instructions]
