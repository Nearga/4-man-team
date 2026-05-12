# Four-Man Team

[Superset](https://superset.sh)-first multi-agent workflow with one user-facing orchestrator and task-local handoff files.

User talks to **Orvo**. Based on the task, Orvo chooses the flow (`trivial`, `medium`, `complex`, or `tdd`), asks before nontrivial work, routes agents through configured model priority lists (`.4-man-team/config.yaml`), and writes post-close observations.

Inspired by:
* [russelleNVy/three-man-team](https://github.com/russelleNVy/three-man-team). This version adds agent routing and Orvo as orchestrator/observer.
* [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done). Some planning patterns were adapted to Four-Man Team's task-folder workflow.

## Roles

- **Orvo** handles intake, flow selection, confirmation, routing, fallback, review gating, and observation.
- **Arch** writes executable plans to task-local `PLAN.md`.
- **Executor** follows `TASK.md` and `PLAN.md`, records implementation details in `EXECUTION.md`, and updates resume state in `STATUS.md`.
- **Reviewer** audits correctness, missing tests, scope drift, bounded deviations, and handoff quality.

## Task State

Runtime state lives inside the target project's deployed `.4-man-team/` directory:

```text
.4-man-team/config.yaml
.4-man-team/prompts/
.4-man-team/templates/       # read-only seed templates
.4-man-team/tasks/<task-id>/ # mutable task state
```

Each task folder can contain:

- `TASK.md` - normalized user request.
- `PLAN.md` - Arch's executable plan, including task type, files, action, verification, done criteria, and dependencies.
- `EXECUTION.md` - Executor's startup checks, implementation log, commands, verification, deviations, and review handoff.
- `REVIEW.md` - Reviewer findings and verdict.
- `OBSERVATION.md` - post-close process suggestions from Orvo.
- `STATUS.md` - current state, active step, fallback history, confirmations, known gaps, and resume prompt.

On resume, Orvo, Arch, Executor, and Reviewer inspect the five most recent `.4-man-team/tasks/*/STATUS.md` files. A task is unfinished unless `STATUS.md` says `Current state: closed`; if multiple recent tasks are unfinished, Orvo asks which one to continue.

## Workflow

- Trivial work can skip separate planning and review when appropriate.
- Medium work uses task-local state, confirmation, execution, review, and optional observation.
- Complex work routes planning to Arch, asks for plan approval, executes bounded chunks, reviews with a distinct model when possible, then observes after closure.
- TDD plans are selected when behavior can be specified before implementation; the first non-checkpoint task must be test-focused.

Executor guardrails now include startup checks, project-instruction loading, plan mismatch stops, bounded deviation rules, concrete verification logging, and `STATUS.md` handoff updates before stopping.

## Install And Deploy

```bash
npm run deploy
```

Deployment copies `src/` into each enabled target project as `.4-man-team/`.

Local deployment targets live in this ignored file:

```text
deployment/projects.local.json
```

Start from the example config:

```bash
cp deployment/projects.example.json deployment/projects.local.json
```

You can pass a custom config to the deploy script:

```bash
bash scripts/deploy.sh --config deployment/projects.local.json
```

## Superset

Add a terminal preset:

```text
Name: Four-Man Team - Orvo
Working Directory: .
Mode: New Tab
Command:
bash .4-man-team/orvo.sh
```

`src/orvo.sh` is the canonical launcher in this repo.

It starts Gemini by default and injects the first Orvo prompt. The same file is deployed as `.4-man-team/orvo.sh` in target projects.

Backend override:

```bash
FOUR_MAN_TEAM_BACKEND=gemini bash .4-man-team/orvo.sh
FOUR_MAN_TEAM_BACKEND=opencode bash .4-man-team/orvo.sh
```

Repo-local entrypoint:

```bash
npm run orvo
```

Task prompt:

```text
Task: <your task>
Use Four-Man Team flow.
Classify complexity, show selected flow, and ask before nontrivial execution.
```

## Development

```bash
npm test
```

Workflow helpers:

```bash
npm run slug -- "task title"
npm run task:resolve -- --root /path/to/project
npm run plan:check -- /path/to/project/.4-man-team/tasks/task-id/PLAN.md
```
