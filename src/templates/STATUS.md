# Status And Session Checkpoint
*Owned by Orvo. Template source only. Copy into `.4-man-team/tasks/<task-id>/` before writing.*
*Read this before reading other active task files.*
*If this covers the current state, skip deeper files until needed.*

---

## Current Status

**Current state:** [intake / planning / waiting for confirmation / executing / reviewing / observing / closed / blocked]
**Active step:** [N — description]
**Last cleared:** [step N-1 — date]
**Pending deploy or commit:** YES / NO
**Selected flow:** [trivial / medium / complex]
**Next action:** [specific next action]
**Last completed action:** [specific completed action]
**Handoff note:** [what the next agent needs to know if this task is not closed]

## Active Models

- Orvo: [provider:model]
- Arch planner: [provider:model or NOT USED]
- Executor: [provider:model]
- Reviewer: [provider:model]
- Observation: [provider:model or NOT RUN]

## Fallback History

| Phase | Failed Model | Replacement Model | Reason | Date |
|---|---|---|---|---|
| [planning/execution/review/observation] | [provider:model] | [provider:model] | [exhausted/error/user choice] | [date] |

## User Confirmations

- [date/time] — [what user approved]

## Files Touched This Session
*Use this as the resume change log. Each bullet says what changed and why it matters.*

- `path/to/file` — [what changed / why it matters]

## Step History

### Step N — [Description] — [Status: NOT STARTED / IN PROGRESS / COMPLETE / BLOCKED]
*Date: [date]*

Files changed:
- `path/to/file` — [what changed]

Decisions made:
- [Decision]

Reviewer findings: [summary]
Observation: [summary]
Agent watch: [handoff/scope/blocker check, or N/A]
Deploy/commit: [confirmed / pending / not applicable]

## Known Gaps
*Logged here instead of fixed. Address in a future task.*

- **KG-N** — [Description] — logged [date]

## Architecture Decisions
*Locked decisions that should not change without explicit approval.*

- [Decision] — [date]

## Still Open

- [Decision or blocker needed before work continues]

## Resume Prompt

Copy and paste this to resume:

```text
You are Orvo on this project.
Read .4-man-team/config.yaml and .4-man-team/prompts/orvo.md.
Inspect the five most recent .4-man-team/tasks/* folders and read each STATUS.md.
Confirm where we stopped and what the next action is. Then wait.
```
