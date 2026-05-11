# Review Prompt

Read `.4-man-team/current-task.md`, then review the implementation for the task in the active task folder's `TASK.md`.

Use the active task folder's `PLAN.md` and `EXECUTION.md` as context when present.

Write findings to the active task folder's `REVIEW.md`.

Treat `.4-man-team/templates/` as read-only reference material. Do not edit templates; all task-specific state belongs in `.4-man-team/tasks/<task-id>/`.

Focus on:

- correctness
- regressions
- scope drift
- missing tests
- unsafe assumptions
- unclear migration or rollback behavior

Do not rewrite the implementation unless Orvo explicitly asks for fixes.

Verdict must be one of:

- approve
- approve_with_notes
- request_changes
