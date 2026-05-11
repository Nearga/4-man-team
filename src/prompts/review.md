# Review Prompt

Review the implementation for the task in `.4-man-team/handoff/TASK.md`.

Use `.4-man-team/handoff/PLAN.md` and `.4-man-team/handoff/EXECUTION.md` as context when present.

Write findings to `.4-man-team/handoff/REVIEW.md`.

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
