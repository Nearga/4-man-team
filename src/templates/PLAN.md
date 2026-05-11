# Arch Plan
*Written by Arch. Read by Orvo, Executor, and Reviewer.*
*Template source only. Copy into `.4-man-team/tasks/<task-id>/` before writing.*
*Overwrite this file for each active task. It is the executable brief.*

---

## Step [N] — [What is being built]

**Planner model:** [provider:model]
**Selected flow:** [trivial / medium / complex]

### Decisions

- [Decision or constraint]
- [Decision or constraint]

### Assumptions

- [Assumption]
- [Assumption]

### Build Order

1. [First bounded unit of work]
2. [Second bounded unit of work]
3. [Third bounded unit of work]

### Files Or Subsystems Likely Affected

- `path/to/file` — [expected reason]
- `path/to/subsystem` — [expected reason]

### Flags

- Flag: [anything Executor must not guess at]
- Flag: [risk or dependency that needs Orvo approval if it changes]

### Definition Of Done

- [ ] [Verifiable completion criterion]
- [ ] [Verifiable completion criterion]

### Verification Commands

```bash
[command]
```

Expected result: [expected output or condition]

### Risks

- [Risk] — [mitigation]

### Rollback Notes

- [How to revert safely]

---

## Executor Plan
*Executor adds a short plan here before implementation. Orvo approves or redirects.*

[Executor writes plan here]

Orvo approval: [ ] Approved / [ ] Redirect — see notes below

## Orvo Notes

[Approval notes, routing notes, or redirect instructions]
