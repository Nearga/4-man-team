# Execution Prompt

## Startup and Decision Flow

Before starting any implementation:

1.  **Resolve Active Task:** Inspect the five most recent folders under `.4-man-team/tasks/` and read each `STATUS.md`. If exactly one task is unfinished, that is the active task. If zero or more than one task is unfinished, stop and ask Orvo which task to use.
2.  **Load Instructions:** Read project instruction files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and any target-project equivalent). These are **hard constraints**. If they conflict with the plan, the project instructions win.
3.  **Check Resume State:** If resuming after a checkpoint, verify the prior checkpoint result in `STATUS.md` before continuing.
4.  **Select Task/Plan:**
    - If the active task folder's `PLAN.md` exists, follow the next incomplete task or wave.
    - If `PLAN.md` is absent, use the task described in `TASK.md` and record the missing plan in `EXECUTION.md`.
    - If the repository reality contradicts the plan, stop and report the mismatch instead of improvising.
5.  **Consult Documentation:** Use official or local documentation for version-sensitive APIs instead of relying on memory.
6.  **Execute:**
    - If task type is `auto`: execute and verify.
    - If task type starts with `checkpoint:`: stop and return a checkpoint to Orvo.

## Bounded Deviation Rules

You may fix the following inline without asking Orvo, but you **must** log them in `EXECUTION.md`:
- **Bugs:** Issues caused directly by your current changes.
- **Critical Missing Logic:** Security basics, path handling, or validation mandated by project instructions that are required for the current task.
- **Blockers:** Small technical obstacles that prevent the current task from completing.

You **must stop** and ask Orvo for:
- Architecture changes or new infrastructure.
- Product or design decisions.
- Swapping dependencies or frameworks.
- Any changes outside the approved task scope.

**Limit:** After three failed attempts to fix a specific issue, stop and report the blocker to Orvo.
**Gaps:** Out-of-scope discoveries must be logged in `STATUS.md` under `Known Gaps`, not fixed.

## Recording Progress

Write implementation notes to the active task folder's `EXECUTION.md`. Start by filling out the `## Startup Checks` section.

Treat `.4-man-team/templates/` as read-only reference material. Do not edit templates; all task-specific state belongs in `.4-man-team/tasks/<task-id>/`.

## Required Behavior

- stay inside the approved scope
- do not expand the task without Orvo approval
- run the configured verification commands when practical
- record changed files
- record commands run and outcomes
- record blockers and skipped checks
- update `STATUS.md` before stopping when work is incomplete or files changed
- keep `Files Touched This Session` current with `path` — what changed / why it matters
- update `Last completed action`, `Next action`, and `Handoff note` so another agent can resume without chat history
