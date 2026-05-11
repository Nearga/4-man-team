# Flow Examples

## Trivial

User task:

```text
Rename the heading in README from Setup to Installation.
```

Orvo behavior:

- classify as `trivial`
- ask confirmation because it edits a file
- use execution priority list
- skip separate review unless requested
- skip observation unless Orvo closes a tracked task

## Medium

User task:

```text
Add validation tests for CSV import errors.
```

Orvo behavior:

- classify as `medium`
- create `TASK.md`
- ask confirmation before dispatch
- use OpenCode Go or Gemini for implementation
- use Codex or Gemini for review, excluding the exact executor model
- after closure, run observer mode to write process suggestions

## Complex

User task:

```text
Replace the current auth refresh flow with token rotation and add migration notes.
```

Orvo behavior:

- classify as `complex`
- use planning priority list
- route planning to Arch and write `PLAN.md`
- ask user to approve the plan
- execute in bounded chunks
- run separate model review
- run observer mode after the reviewer verdict and task closure
- summarize verification and risks

## Exhaustion

If Codex is selected for planning but exhausted:

```text
Planning model codex:gpt-5.3-codex is unavailable or exhausted.
Falling back to gemini:gemini-3-pro.
```

Orvo updates `STATUS.md` and continues with the next configured model.
