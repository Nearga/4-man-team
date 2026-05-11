# Repository Guidelines

## Project Structure & Module Organization

This repository is a Bun-based TypeScript project for the Four-Man Team agent workflow.

- `src/` holds the runtime template shipped to target projects.
- `src/prompts/` contains role prompts, and `src/templates/` contains read-only task-state templates.
- `scripts/` contains deployment logic, including `deploy.ts` and shared helpers in `deploy-core.ts`.
- `tests/` contains `bun:test` suites plus fixtures in `tests/fixtures/` and helpers in `tests/support/`.
- `docs/` contains workflow and deployment notes.
- `deployment/projects.example.json` is the sample deployment config; use `deployment/projects.local.json` for local targets.

## Build, Test, and Development Commands

- `npm run orvo` starts the local Orvo launcher from `src/orvo.sh`.
- `npm run deploy` replaces each configured target’s `.4-man-team/` directory with `src/`.
- `npm test` runs the Bun test suite.

## Coding Style & Naming Conventions

- Use TypeScript ES modules and modern Node APIs, matching the existing `scripts/*.ts` style.
- Prefer 2-space indentation and double-quoted strings in TypeScript.
- Keep shell scripts POSIX-friendly where possible, with `set -euo pipefail` for safety.
- Use lowercase, descriptive filenames that reflect role or purpose, such as `planning.test.ts` or `review.md`.

## Testing Guidelines

The project uses `bun:test` with fixture-driven tests.

- Name tests by feature area, e.g. `tests/deploy/config.test.ts`.
- Prefer committed fixtures over temp directories or generated local configs.
- Test pure planning logic before write paths and deployment side effects.
- Run the full suite with `npm test`.

## Commit & Pull Request Guidelines

Git history shows short, task-focused commit messages, usually lowercase and brief, such as `init` or `tests and deployment config`.

- Keep commits scoped to one logical change.
- For pull requests, include a short summary, the commands you ran, and any deployment impact.
- Add screenshots or logs only when they help explain a workflow or config change.

## Configuration Notes

- Do not commit `deployment/projects.local.json`; it is ignored on purpose.
- Update `deployment/projects.example.json` when the expected config shape changes.
