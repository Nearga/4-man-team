# Execution Prompt

Resolve the active task by inspecting the five most recent folders under `.4-man-team/tasks/` and reading each `STATUS.md`. If exactly one task is unfinished, implement the task described in that task folder's `TASK.md`. If more than one task is unfinished, stop and ask Orvo which task to use.

If the active task folder's `PLAN.md` exists, follow it unless repo reality proves it wrong. If the plan is wrong, stop and report the mismatch instead of improvising a new architecture.

Write implementation notes to the active task folder's `EXECUTION.md`.

Treat `.4-man-team/templates/` as read-only reference material. Do not edit templates; all task-specific state belongs in `.4-man-team/tasks/<task-id>/`.

Required behavior:

- stay inside the approved scope
- do not expand the task without Orvo approval
- run the configured verification commands when practical
- record changed files
- record commands run and outcomes
- record blockers and skipped checks
