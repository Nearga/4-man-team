# Superset Setup

## Goal

Superset should be the only daily entry point. The user opens Superset, selects a project, and talks to Arch.

## Custom Agent

Create a custom Superset agent named `Arch`.

For V1, Arch can be launched as one of:

```text
mastracode --mode plan --thread arch --prompt -
```

```text
codex
```

```text
four-man-team
```

Use `four-man-team` only after a thin CLI wrapper exists. Until then, launch Codex or Mastra Code and include `.arch/prompts/arch.md` as the controlling instruction.

## Expected Project Layout

Every project that uses Four-Man Team should include:

```text
.arch/
  config.yaml
  prompts/
  handoff/
```

Arch should read `.arch/config.yaml` before dispatching work.

## Worktree Policy

Arch may create or request Superset worktrees only after user confirmation.

Recommended naming:

```text
arch/<task-slug>
```

Examples:

```text
arch/fix-auth-refresh
arch/add-import-preview
arch/refactor-report-renderer
```

## V1 Limitation

Superset is treated as the shell, not the policy engine. Routing decisions live in `.arch/config.yaml` and Arch prompts.
