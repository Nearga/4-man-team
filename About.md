# Four-Man Team

## Purpose

Four-Man Team is a Superset-first framework for using multiple coding agents through one user-facing orchestrator and a four-role lifecycle.

The user talks only to **Orvo**. Orvo classifies the task, asks for confirmation before nontrivial work, selects the right flow, routes planning to Arch, and runs post-close observation after review.

## Core Idea

- **Superset** is the single entry point and workspace/worktree manager.
- **Orvo** is the only user-facing agent.
- **Arch** is the architect/planner.
- **Task prompts** are separate from model/provider choices.
- **Model priority lists** decide which model handles planning, execution, review, and observation.
- **Fallback** is config-driven: when a model is exhausted, Orvo notifies the user and tries the next model in the relevant priority list.
- **Review policy** is global: the exact model that executed a task should not review its own work.
- **Observation** runs after Reviewer when the task is closed. Orvo reads the handoff trail and logs, then suggests improvements.

## V1 Scope

V1 is a config, prompt, and handoff template system. It does not fork Superset.

Included:

- reusable `src/` project template, deployed into target projects as `.4-man-team/`
- Orvo prompt
- Arch planning prompt
- execution and review prompts
- routing policy
- handoff documents for task state
- Superset setup in `README.md`

Out of scope for V1:

- Superset fork
- fully automated router CLI
- automatic quota probing across all providers
- automatic merge/commit behavior

## Default Roles

- **Orvo**: task intake, classification, model routing, confirmation, review gate, observation, user summary.
- **Arch**: architect/planner that produces `PLAN.md`.
- **Executor**: usually cheaper/faster model that implements bounded work.
- **Reviewer**: distinct model selected by global review policy.
- **Orvo Observation Mode**: post-close analysis that reviews logs and handoffs, then writes suggestions to `OBSERVATION.md`.

## Project Status

Planning and deployment setup.
