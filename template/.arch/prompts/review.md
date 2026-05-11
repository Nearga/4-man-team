# Review Prompt

Review the implementation for the task in `.arch/handoff/TASK.md`.

Use `.arch/handoff/PLAN.md` and `.arch/handoff/EXECUTION.md` as context when present.

Write findings to `.arch/handoff/REVIEW.md`.

Focus on:

- correctness
- regressions
- scope drift
- missing tests
- unsafe assumptions
- unclear migration or rollback behavior

Do not rewrite the implementation unless Arch explicitly asks for fixes.

Verdict must be one of:

- approve
- approve_with_notes
- request_changes

