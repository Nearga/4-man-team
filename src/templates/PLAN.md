# Arch Plan
*Written by Arch. Read by Orvo, Executor, and Reviewer.*
*Template source only. Copy into `.4-man-team/tasks/<task-id>/` before writing.*
*Overwrite this file for each active task. It is the executable brief.*

---

## Step [N] — [What is being built]

**Planner model:** [provider:model]
**Selected flow:** [trivial / medium / complex]

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

Truths:
- [Observable behavior that must be true for the goal to be achieved.]

Artifacts:
- `path/to/file` — [what real implementation must exist there.]

Key links:
- `[source] -> [target]` — [connection that must work.]

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

Type: auto / checkpoint:decision / checkpoint:human-verify

Files:
- `path/to/file.ext` — [ownership/change]

Action:
[Specific implementation or checkpoint instructions.]

Verify:

```bash
[command]
```

Done:
- [Measurable acceptance criterion.]

Dependencies:
- [Task or wave dependency.]

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

---

## Executor Plan
*Executor adds a short plan here before implementation. Orvo approves or redirects.*

[Executor writes plan here]

Orvo approval: [ ] Approved / [ ] Redirect — see notes below

## Orvo Notes

[Approval notes, routing notes, or redirect instructions]
