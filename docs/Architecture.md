# Architecture

## Components

Four-Man Team has four layers:

- **Superset**: entry point, workspace UI, terminal host, worktree manager, diff review surface.
- **Orvo**: user-facing orchestrator that owns task intake, flow selection, model fallback, and post-close observation.
- **Arch**: architect/planner that handles complex planning and writes `PLAN.md`.
- **Workers**: Codex, Gemini CLI, OpenCode Go, or other configured agents.
- **Handoff files**: Markdown artifacts that preserve task state across agents.

## Control Flow

1. User gives task to Orvo in Superset.
2. Orvo writes or updates `.4-man-team/handoff/TASK.md`.
3. Orvo classifies task as `trivial`, `medium`, or `complex`.
4. Orvo selects a configured flow from `.4-man-team/config.yaml`.
5. Orvo asks for confirmation before nontrivial execution.
6. For complex work, Orvo routes planning to Arch.
7. Orvo dispatches execution and review to the first available model in the relevant priority list.
8. If a model is exhausted, Orvo reports the fallback and tries the next model.
9. Review is selected through the global review policy.
10. If the task is closed, Orvo runs observer mode after Reviewer.
11. Orvo summarizes result, open risks, verification status, and observation suggestions.

## Why No Fork In V1

Superset already provides the workspace shell. V1 should use terminal agents and project-local prompts before maintaining a fork.

A fork becomes justified only if config-based routing cannot provide stable fallback, prompt isolation, or review enforcement.

## State Model

The handoff files are intentionally simple:

- `TASK.md`: normalized task packet.
- `PLAN.md`: plan from planner model.
- `EXECUTION.md`: implementation log from executor.
- `REVIEW.md`: reviewer findings and verdict.
- `OBSERVATION.md`: post-close suggestions from Orvo observer mode.
- `STATUS.md`: current routing state and fallback history.
