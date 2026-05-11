# Architecture

## Components

Four-Man Team has four layers:

- **Superset**: entry point, workspace UI, terminal host, worktree manager, diff review surface.
- **Arch**: user-facing controller that owns task classification and flow selection.
- **Workers**: Codex, Gemini CLI, OpenCode Go, Mastra Code, or other configured agents.
- **Handoff files**: Markdown artifacts that preserve task state across agents.

## Control Flow

1. User gives task to Arch in Superset.
2. Arch writes or updates `.arch/handoff/TASK.md`.
3. Arch classifies task as `trivial`, `medium`, or `complex`.
4. Arch selects a configured flow from `.arch/config.yaml`.
5. Arch asks for confirmation before nontrivial execution.
6. Arch dispatches the selected phase to the first available model in the relevant priority list.
7. If a model is exhausted, Arch reports the fallback and tries the next model.
8. Review is selected through the global review policy.
9. If the task is closed, Arch calls Observer after Reviewer.
10. Observer reads the handoff trail and logs, then writes suggestions to `OBSERVATION.md`.
11. Arch summarizes result, open risks, verification status, and observer suggestions.

## Why No Fork In V1

Superset already provides the workspace shell. Mastra Code already exposes project settings, modes, prompts, and headless execution. V1 should use those extension surfaces before maintaining a fork.

A fork becomes justified only if config-based routing cannot provide stable fallback, prompt isolation, or review enforcement.

## State Model

The handoff files are intentionally simple:

- `TASK.md`: normalized task packet.
- `PLAN.md`: plan from planner model.
- `EXECUTION.md`: implementation log from executor.
- `REVIEW.md`: reviewer findings and verdict.
- `OBSERVATION.md`: post-close suggestions from Observer.
- `STATUS.md`: current routing state and fallback history.
