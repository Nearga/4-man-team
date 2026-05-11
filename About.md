# Four-Man Team

## Purpose

Four-Man Team is a Superset-first framework for using multiple coding agents through one user-facing controller and a four-role lifecycle.

The user talks only to **Arch**. Arch classifies the task, asks for confirmation before nontrivial work, selects the right flow, and routes planning, execution, review, and observation through configured model priority lists.

## Core Idea

- **Superset** is the single entry point and workspace/worktree manager.
- **Arch** is the only user-facing agent.
- **Task prompts** are separate from model/provider choices.
- **Model priority lists** decide which model handles planning, execution, and review.
- **Fallback** is config-driven: when a model is exhausted, Arch notifies the user and tries the next model in the relevant priority list.
- **Review policy** is global: the exact model that executed a task should not review its own work.
- **Observer** runs after Reviewer when the task is closed, reads the handoff trail and logs, and suggests improvements.

## V1 Scope

V1 is a config, prompt, and handoff template system. It does not fork Superset or Mastra Code.

Included:

- reusable `.arch/` project template
- Arch role prompt
- planning, execution, and review prompt templates
- routing policy
- handoff documents for task state
- Superset setup notes

Out of scope for V1:

- Superset fork
- Mastra Code fork
- fully automated router CLI
- automatic quota probing across all providers
- automatic merge/commit behavior

## Default Roles

- **Arch**: task intake, classification, model routing, confirmation, review gate, user summary.
- **Planner**: strong model that produces `PLAN.md`.
- **Executor**: usually cheaper/faster model that implements bounded work.
- **Reviewer**: distinct model selected by global review policy.
- **Observer**: post-close analyst that reviews logs and handoffs, then writes suggestions to `OBSERVATION.md`.

## Project Status

Planning and template setup.
