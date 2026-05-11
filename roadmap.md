# Four-Man Team Planning Roadmap

This roadmap captures the next planning improvements to discuss and implement one step at a time.

Core rule: Four-Man Team must not duplicate state. Current work is derived from the five most recent `.4-man-team/tasks/*/STATUS.md` files. Task-specific state stays inside `.4-man-team/tasks/<task-id>/`. Templates stay read-only.

## Context For Future Agents

Repository root:

- `/Users/vitaliivasylenko/Obsidian/AI_Knowledgebase/20 My Projects/2020 AI/four-man-team`

Primary files:

- `scripts/four-man-team.ts` — local helper CLI and exported workflow functions.
- `src/templates/PLAN.md` — read-only source template copied into each task folder before editing.
- `src/templates/STATUS.md` — task-local state and resume source of truth.
- `src/prompts/arch.md` — planner prompt that defines how Arch writes `PLAN.md`.
- `src/prompts/orvo.md` — Orvo prompt that defines task creation/resume behavior.
- `tests/workflow/four-man-team-cli.test.ts` — unit tests for `slugify`, `resolveTasks`, and `checkPlan`.
- `tests/workflow/planner.test.ts` — regression tests for Arch/PLAN prompt concepts and GSD leakage.
- `tests/fixtures/workflow/valid-plan.md` — current valid plan fixture.
- `tests/fixtures/workflow/invalid-plan.md` — current invalid plan fixture.

Commands:

- `npm test` — full Bun test suite.
- `npm run plan:check -- tests/fixtures/workflow/valid-plan.md` — manually exercise the plan checker.
- `npm run task:resolve -- --root tests/fixtures/workflow/project-one-open` — manually exercise active task resolution.

Important current implementation notes:

- `checkPlan(planPath)` is exported from `scripts/four-man-team.ts`.
- `checkPlan` currently checks required sections and that task sections contain `Files:`, `Action:`, `Verify:`, and `Done:`.
- Task sections are currently detected with `/#### Task [\s\S]*?(?=\n#### Task |\n## |$)/g`.
- `resolveTasks(root, limit = 5)` already implements the "five most recent task folders" rule.
- `src/templates/PLAN.md` currently contains placeholder text, so strict `plan check` should be intended for copied task plans, not the source template.
- `tests/workflow/planner.test.ts` guards against leaking `/gsd:`, `.planning/`, `gsd-planner`, and `Claude executor`.

Non-goals:

- Do not add `.planning/`.
- Do not add `current-task.md`.
- Do not add a separate checkpoint/setup/status tracker.
- Do not make `src/templates/` writable runtime state.

## Step 1 — Strengthen Plan Verification

Goal: make `PLAN.md` harder to write vaguely and easier for Executor/Reviewer to trust.

What to add:

- Extend `scripts/four-man-team.ts plan check` so it validates real plan quality, not just section presence.
- Keep validation scoped to a task `PLAN.md`; do not introduce GSD `.planning` files.
- Validate that every task includes:
  - `Type:`
  - `Files:`
  - `Action:`
  - `Verify:`
  - `Done:`
  - `Dependencies:`
- Validate that every `Verify:` block includes either:
  - a concrete command, such as `npm test`, `bun test`, `npm run build`, or a project-specific check
  - or an explicit missing-test marker, such as `MISSING - Wave 0 creates the test first`
- Reject placeholder-only content such as:
  - `[command]`
  - `[Specific implementation instructions]`
  - `TBD`
  - `TODO`
  - empty bullet lists

Why this fits Four-Man Team:

- It improves the existing local helper instead of adding another orchestrator.
- It keeps `PLAN.md` as the executable brief.
- It gives Reviewer a stronger basis for checking whether Executor followed the plan.

Discussion points:

- Should `plan check` be strict enough to fail placeholder text in templates, or should it only be used against copied task plans?
- Should the checker require at least one automated verification command per task, or allow manual-only checkpoint tasks?

Default proposal:

- `plan check` is intended for task plans only, not source templates.
- `auto` tasks require automated verification.
- checkpoint tasks may use manual verification, but must say exactly what Orvo asks the user to verify or decide.

Implementation references:

- Update `checkPlan(planPath)` in `scripts/four-man-team.ts`.
- Keep `PlanCheckResult` shape as `{ valid: boolean; errors: string[] }` unless a future step explicitly needs warnings.
- Update `tests/workflow/four-man-team-cli.test.ts`.
- Reuse `tests/fixtures/workflow/valid-plan.md` and `tests/fixtures/workflow/invalid-plan.md` where practical.
- Add targeted fixtures only if the single invalid fixture becomes too broad to diagnose clearly.

Concrete Step 1 implementation checklist:

- Add helper functions in `scripts/four-man-team.ts`:
  - `sectionBody(content, heading)` to extract a markdown section.
  - `taskSections(content)` to return `#### Task` blocks.
  - `hasPlaceholder(text)` to catch unresolved template placeholders.
  - `hasConcreteVerification(task)` to distinguish real checks from placeholder verification.
  - `taskType(task)` to parse `Type:`.
- Extend task validation:
  - require `Type:`
  - require `Files:`
  - require `Action:`
  - require `Verify:`
  - require `Done:`
  - require `Dependencies:`
  - reject placeholder-only content inside each required field.
- Approved task types for Step 1:
  - `auto`
  - `checkpoint:decision`
  - `checkpoint:human-verify`
  - `checkpoint:human-action`
  - `checkpoint:external-setup`
- Verification rule:
  - `auto` tasks must include a concrete command in `Verify:`.
  - checkpoint tasks may omit a shell command only if `Verify:` contains a precise human/action verification instruction.
  - Any task may use an explicit missing-test marker only when it says what creates the test first, e.g. `MISSING - Wave 0 creates tests/workflow/example.test.ts first`.
- Placeholder rejection examples:
  - `[command]`
  - `[Specific implementation instructions]`
  - `[Action-oriented name]`
  - `[Measurable acceptance criterion.]`
  - `TBD`
  - `TODO`
  - `None / [Task or wave dependency.]`
- Concrete command detection can be simple for Step 1:
  - Accept fenced `bash` blocks with non-placeholder content.
  - Accept common command prefixes in `Verify:` such as `npm `, `bun `, `node `, `git `, `npx `, `pnpm `, `yarn `, `cargo `, `pytest `, `uv `, `make `, `./`.
  - Do not try to execute commands in `plan check`.
- Expected test updates:
  - `valid-plan.md` should include `Type:` and `Dependencies:` in each task.
  - `invalid-plan.md` should assert missing `Type:` and missing `Dependencies:` errors.
  - Add a test that placeholder verification like `[command]` is rejected.
  - Add a test that an `auto` task without a concrete command is rejected.
  - Add a test that a checkpoint task with an explicit human verification instruction passes.
- Acceptance criteria:
  - `npm test` passes.
  - `npm run plan:check -- tests/fixtures/workflow/valid-plan.md` exits 0.
  - `npm run plan:check -- tests/fixtures/workflow/invalid-plan.md` exits non-zero.
  - No references to `.planning/`, `/gsd:`, `gsd-planner`, or `Claude executor` are introduced.

## Step 2 — Resume Summary Without Duplicated State

Goal: help a second agent continue when the first agent is exhausted without creating another source of truth.

What to add:

- Keep the existing `STATUS.md` as the resume surface.
- Add clearer required fields inside `STATUS.md`, not a new file:
  - `Next action:`
  - `Last completed action:`
  - `Files touched this session:`
  - `Open blockers:`
  - `Handoff note:`
- Update Orvo/Executor prompts to refresh `STATUS.md` after meaningful progress.
- Keep task discovery unchanged:
  - inspect five most recent task folders
  - unfinished means `Current state:` is not `closed`
  - if more than one unfinished task exists, stop and ask the user

Why this fits Four-Man Team:

- `STATUS.md` already exists and is the current-state source.
- The resume summary is not separate persisted state; it is a clearer shape for the existing state.
- Agents can resume by reading one active task folder instead of reconstructing from chat history.

Discussion points:

- Should `Handoff note:` be mandatory after every Executor pass, or only when stopping due to exhaustion/blocking?
- Should `Files touched this session:` be maintained by Orvo, Executor, or both?

Default proposal:

- `Handoff note:` is required whenever the agent stops before the task is closed.
- Executor records implementation-specific touched files.
- Orvo records routing/approval context.

Implementation references:

- Update `src/templates/STATUS.md`.
- Update `src/prompts/orvo.md` so Orvo keeps the new resume fields current.
- Update `src/prompts/execution.md` so Executor records changed files, last completed action, blockers, and handoff note before stopping.
- Optionally update `src/prompts/review.md` so Reviewer checks whether `STATUS.md` is useful enough for another agent to resume.
- Update `tests/workflow/planner.test.ts` or add `tests/workflow/status-template.test.ts` to lock the template/prompt behavior.

Concrete Step 2 implementation checklist:

- Add these fields to `src/templates/STATUS.md` under `## Current Status` or a new `## Resume State` section:
  - `**Next action:** [specific next action]`
  - `**Last completed action:** [specific completed action]`
  - `**Handoff note:** [what the next agent needs to know]`
- Add a `## Files Touched This Session` section:
  - each bullet should be `` `path/to/file` — [what changed / why it matters] ``
- Add a `## Open Blockers` section:
  - each bullet should include blocker, owner, and needed decision/action
  - use `- None` only when no blockers exist
- Keep existing fields:
  - `Current state`
  - `Active step`
  - `Last cleared`
  - `Pending deploy or commit`
  - `Selected flow`
  - `Still Open`
  - `Resume Prompt`
- Do not add:
  - `current-task.md`
  - `SUMMARY.md`
  - `.planning/STATE.md`
  - any global task pointer
- Prompt updates:
  - Orvo must update resume fields when routing changes, user confirms decisions, or task state changes.
  - Executor must update resume fields before stopping if work is incomplete, blocked, or verification was skipped.
  - Reviewer should flag missing handoff details as a process issue, not automatically edit implementation.
- Keep current task resolution unchanged:
  - use the five most recent folders under `.4-man-team/tasks/`
  - read `STATUS.md`
  - more than one unfinished task means ask the user

Expected test updates:

- Add assertions that `src/templates/STATUS.md` contains `Next action`, `Last completed action`, `Handoff note`, `Files Touched This Session`, and `Open Blockers`.
- Add assertions that `src/prompts/orvo.md` still contains the five-most-recent task resolution rule.
- Add assertions that no `current-task.md`, `.planning/`, or separate summary state is introduced in source prompts/templates.
- Optional: add a fixture `tests/fixtures/workflow/status-resume.md` if a parser is added later. For Step 2, prefer template/prompt regression tests only unless implementation needs parsing.

Acceptance criteria:

- `npm test` passes.
- Source prompts/templates explain how a second agent resumes without chat history.
- Resume fields live only in `STATUS.md`.
- No new state file is introduced.

## Step 3 — Explicit Checkpoint Patterns

Goal: make human pauses precise and rare.

Checkpoint types:

- `auto`: Executor can complete the task without asking.
- `checkpoint:decision`: user must choose between product or implementation options.
- `checkpoint:human-verify`: user must manually verify behavior the agent cannot prove, such as a visual result.
- `checkpoint:human-action`: user must perform an unavoidable local/manual action.
- `checkpoint:external-setup`: user must provide credentials, create accounts, configure dashboards, or approve environment setup.

Rules:

- If the agent can do the work through CLI/API, it must not be a checkpoint.
- A checkpoint must include the exact question or instruction Orvo gives the user.
- Checkpoints should happen after automated verification where possible.
- Checkpoints must live in `PLAN.md`; do not add a separate checkpoint tracker.

Examples:

- Good decision checkpoint: "Ask user whether the deployment target should be `staging` or `production`; do not edit deploy config until selected."
- Good human-verify checkpoint: "Ask user to verify the page renders correctly in their browser after `npm run dev` starts."
- Good external-setup checkpoint: "Ask user to provide `STRIPE_SECRET_KEY`; do not commit or store the secret."
- Bad checkpoint: "User checks if tests pass." Tests are automatable and should be run by the agent.

Why this fits Four-Man Team:

- Orvo remains the user-facing router.
- Arch plans the checkpoint.
- Executor stops only when the plan requires a human input.
- Reviewer can verify that a checkpoint was necessary and not used as a shortcut.

Discussion points:

- Should `checkpoint:external-setup` be distinct from `checkpoint:human-action`, or is one human-action type enough?
- Should checkpoint tasks be allowed inside implementation waves, or only between waves?

Default proposal:

- Keep `checkpoint:external-setup` distinct because secrets/accounts/dashboard configuration are common and high-risk.
- Allow checkpoints between tasks, but prefer placing them between waves for cleaner resume.

Implementation references:

- Update `src/templates/PLAN.md`.
- Update `src/prompts/arch.md`.
- Update `scripts/four-man-team.ts` only if Step 1 has not already added checkpoint task validation.
- Update `tests/workflow/planner.test.ts`.
- Update `tests/fixtures/workflow/valid-plan.md` or add `tests/fixtures/workflow/checkpoint-plan.md`.

Concrete Step 3 implementation checklist:

- Add a `## Checkpoint Rules` or expand `## Human Checkpoints` in `src/templates/PLAN.md`.
- Document approved task types in the template:
  - `auto`
  - `checkpoint:decision`
  - `checkpoint:human-verify`
  - `checkpoint:human-action`
  - `checkpoint:external-setup`
- Update task examples so checkpoint tasks include:
  - `Type: checkpoint:*`
  - exact Orvo prompt/question
  - what input/result unblocks execution
  - what to do if the user declines or cannot verify
  - dependency on the previous task/wave when relevant
- Update `src/prompts/arch.md` to require automation-first checkpoint selection:
  - if CLI/API can do it, Arch must plan automation
  - checkpoints are only for decisions, manual verification, external setup, or user-only actions
  - checkpoint placement should be between waves unless there is a reason to pause inside a wave
- If Step 1 validation exists, extend or confirm checker behavior:
  - reject unknown checkpoint types
  - require `Action:` to include `Ask Orvo` or similarly explicit user-facing instruction for checkpoint tasks
  - allow checkpoint `Verify:` without shell command only when it contains precise manual verification text

Expected test updates:

- `planner.test.ts` should assert `src/templates/PLAN.md` includes each approved checkpoint type.
- `planner.test.ts` should assert `src/prompts/arch.md` includes automation-first wording.
- If checker validation is included, add:
  - valid checkpoint fixture passes
  - unknown checkpoint type fails
  - vague checkpoint action fails

Acceptance criteria:

- `npm test` passes.
- Arch and the plan template clearly distinguish automated work from human checkpoints.
- Checkpoints stay in task `PLAN.md` and `STATUS.md`; no separate tracker is added.
- The roadmap’s skipped codebase-map decision remains unchanged.

## Step 4 — Skip Codebase Map-Lite

Goal: avoid adding a stale or duplicated overview file.

Decision:

- Do not add a `PROJECT.md`, codebase map, `.planning` state, or generated architecture summary.
- If a plan needs context, Arch records only the files it actually read in `PLAN.md` under `Context Read`.
- If a task needs resume context, agents read the active task `STATUS.md`, `TASK.md`, `PLAN.md`, and implementation artifacts.

Why:

- A codebase map becomes a second source of truth unless constantly maintained.
- Four-Man Team already prefers task-local context.
- Targeted context is cheaper and safer than broad summaries.

Discussion status:

- User already chose to skip this.

Implementation references:

- This step usually requires no code changes.
- Use `tests/workflow/planner.test.ts` for regression coverage if needed.
- Relevant files to guard:
  - `src/prompts/arch.md`
  - `src/prompts/orvo.md`
  - `src/templates/PLAN.md`
  - `src/templates/STATUS.md`
  - `scripts/four-man-team.ts`

Concrete Step 4 implementation checklist:

- Do not create any of these files:
  - `.planning/PROJECT.md`
  - `.planning/ROADMAP.md`
  - `.planning/STATE.md`
  - `.4-man-team/PROJECT.md`
  - `.4-man-team/CODEBASE.md`
  - `.4-man-team/current-task.md`
- If another step suggests persistent overview context, fold only the needed information into:
  - active task `PLAN.md` under `Context Read`
  - active task `STATUS.md` under resume fields
  - source prompt/template instructions
- Keep `Context Read` in `PLAN.md` as the only planning context inventory.
- Keep the five-most-recent `STATUS.md` scan as the only current-task discovery mechanism.

Expected test updates:

- Existing `tests/workflow/planner.test.ts` already rejects `.planning/`.
- Existing `tests/workflow/paths.test.ts` should continue guarding against `current-task.md`.
- Add explicit tests only if a future implementation introduces a risk of codebase-map files.

Acceptance criteria:

- No codebase map or global planning state file exists.
- `npm test` passes.
- `rg "\\.planning|current-task|CODEBASE|PROJECT.md" src scripts tests` shows no new runtime workflow dependency, except tests that intentionally reject those strings.

## Step 5 — Goal-Backward Must-Have Verification

Goal: make plans prove the user goal, not merely list implementation steps.

What to add:

- Strengthen `PLAN.md` `Must Haves` with three explicit categories:
  - `Truths`
  - `Artifacts`
  - `Key Links`
- Update Arch prompt to derive must-haves before writing tasks.
- Update `plan check` to reject empty or placeholder must-haves.

Definitions:

- `Truths`: observable outcomes that must be true from the user or system perspective.
- `Artifacts`: concrete files, scripts, configs, docs, or generated outputs that must exist.
- `Key Links`: connections likely to break if missed, such as prompt -> template, CLI -> task folder, deployment source -> target, API -> UI, config -> runtime.

Example:

```markdown
## Must Haves

Truths:
- Running `npm run deploy` replaces the target `.4-man-team` with the source template.
- More than one unfinished recent task stops Orvo and asks the user to choose.

Artifacts:
- `scripts/deploy-core.ts` contains delete-then-copy deployment logic.
- `src/prompts/orvo.md` documents current-task resolution from recent tasks.

Key links:
- `src/templates/STATUS.md` -> Orvo resume instructions.
- `scripts/four-man-team.ts task resolve` -> `.4-man-team/tasks/*/STATUS.md`.
```

Why this fits Four-Man Team:

- It gives Arch a quality bar before task decomposition.
- It gives Executor a concrete target.
- It gives Reviewer a checklist tied to user outcomes.

Discussion points:

- Should every artifact include a path, or can some artifacts be behavior-only?
- Should key links be required for small/trivial tasks?

Default proposal:

- Artifacts should be path-based when the task changes files.
- Key links are required for medium/complex flow, optional for trivial flow.

Implementation references:

- Update `src/templates/PLAN.md`.
- Update `src/prompts/arch.md`.
- Extend `checkPlan(planPath)` in `scripts/four-man-team.ts`.
- Update `tests/workflow/four-man-team-cli.test.ts`.
- Add or update fixtures under `tests/fixtures/workflow/`.

Concrete Step 5 implementation checklist:

- Make `## Must Haves` in `src/templates/PLAN.md` explicitly require:
  - `Truths:`
  - `Artifacts:`
  - `Key links:`
- Update `src/prompts/arch.md`:
  - Arch must derive must-haves before task waves.
  - Arch must work backward from user goal to observable truths.
  - Arch must map truths to artifacts and key links.
  - Arch must avoid generic truths like "tests pass" unless tied to user-visible behavior.
- Extend `checkPlan`:
  - require `Truths:`, `Artifacts:`, and `Key links:` inside `## Must Haves`
  - reject empty sections
  - reject placeholder entries
  - require artifacts to contain at least one path-like token when the plan has file changes
  - require key links for selected flow `medium`, `complex`, or `tdd`
- Suggested simple path-like detection:
  - accept backticked paths containing `/`, `.ts`, `.tsx`, `.js`, `.md`, `.json`, `.yaml`, `.yml`, `.sh`, or package/script names
  - do not require paths for truth entries
- Suggested selected-flow detection:
  - parse `**Selected flow:** [value]`
  - accept `trivial`, `medium`, `complex`, `tdd`
  - if missing, Step 1/5 checker can report missing selected flow later, but do not block Step 5 unless desired

Expected test updates:

- Update `valid-plan.md` with non-placeholder `Truths`, `Artifacts`, and `Key links`.
- Add invalid fixture or test case for missing `Truths:`.
- Add invalid fixture or test case for placeholder artifact.
- Add invalid fixture or test case where medium/complex plan has no key links.
- Add regression assertion in `planner.test.ts` that Arch prompt mentions working backward from the user goal.

Acceptance criteria:

- `npm test` passes.
- `plan check` rejects vague must-haves.
- Valid plans prove the goal through observable truths, concrete artifacts, and important wiring.
- No GSD frontmatter or `.planning` requirement is introduced.

## Step 6 — TDD Mode For Testable Work

Goal: make Arch recognize when tests should lead implementation.

TDD candidates:

- pure functions
- validation rules
- data transformations
- API request/response behavior
- state machines
- CLI input/output behavior
- deployment logic with fixtures

Non-TDD candidates:

- prompt wording changes
- documentation-only changes
- one-off shell glue
- visual/UI polish where behavior is not easily assertable

What to add:

- Add `Selected flow: tdd` or `Plan type: tdd` to `PLAN.md` when applicable.
- Require a first task that creates or updates the failing test.
- Require task sequencing:
  - red: add failing test
  - green: implement minimal fix
  - refactor: clean up without changing behavior
- Update `plan check` so TDD plans must include test-first language and verification commands.

Why this fits Four-Man Team:

- The existing repo already has fixture-driven Bun tests.
- It helps keep helper scripts and deploy behavior safe.
- It is a planning pattern, not a separate workflow system.

Discussion points:

- Should TDD be a selected flow value, or a task type?
- Should prompt-only changes ever require tests?

Default proposal:

- Use `Selected flow: tdd` at the plan level.
- Prompt-only changes do not require TDD, but should have lightweight text regression tests when behavior depends on prompt wording.

Implementation references:

- Update `src/templates/PLAN.md`.
- Update `src/prompts/arch.md`.
- Extend `checkPlan(planPath)` in `scripts/four-man-team.ts`.
- Update `tests/workflow/four-man-team-cli.test.ts`.
- Add `tests/fixtures/workflow/tdd-plan.md` if needed.

Concrete Step 6 implementation checklist:

- Use `Selected flow: tdd` in `PLAN.md`; do not introduce a separate TDD workflow file.
- Add a `## TDD Notes` section or plan-level guidance in `src/templates/PLAN.md`:
  - when behavior is input/output testable, tests come first
  - first task creates or updates the failing test
  - implementation task follows the test
  - final task refactors or confirms no refactor needed
- Update `src/prompts/arch.md`:
  - TDD candidates include pure functions, validation, data transforms, API contracts, state machines, CLI behavior, deployment logic
  - non-TDD candidates include prompt-only edits, docs-only edits, one-off glue, visual polish without assertable behavior
  - if selected flow is `tdd`, Arch must produce red/green/refactor sequencing
- Extend `checkPlan`:
  - if selected flow is `tdd`, require at least one task/action mentioning a test file or test command
  - require red/green/refactor wording or equivalent test-first sequencing
  - require the first implementation task to be test-focused, unless a prior checkpoint is needed
  - require concrete verification command for the test
- Keep TDD scoped:
  - no new command needed in `package.json`
  - use existing project test command unless target project plan specifies otherwise
  - do not force TDD for prompt-only changes

Expected test updates:

- Add valid TDD fixture with:
  - `Selected flow: tdd`
  - first task creating/updating a test
  - second task implementing behavior
  - concrete test command
- Add invalid TDD fixture or inline test for:
  - `Selected flow: tdd` with no test-first task
  - `Selected flow: tdd` with no concrete verification command
- Update `planner.test.ts` to assert Arch prompt contains the TDD candidate list or core terms.

Acceptance criteria:

- `npm test` passes.
- TDD plans are recognizable and enforce test-first execution.
- Non-TDD plans are not forced into extra ceremony.
- Existing fixture-driven Bun tests remain the model for this repository.

## Step 7 — User Setup Tracking As Plan Checkpoints

Goal: handle external setup without creating another state file.

What to add:

- Represent user setup as `checkpoint:external-setup` tasks in `PLAN.md`.
- Keep setup state in the active task `STATUS.md` only when it affects resume.
- Do not add `user_setup.yaml`, `.planning/STATE.md`, or another global setup tracker.

External setup examples:

- user must provide an API key
- user must create an OAuth app
- user must configure a webhook in a provider dashboard
- user must approve a destructive local action
- user must confirm a deployment target

Required checkpoint content:

- service or system involved
- why setup is needed
- exact item needed from the user
- where the user gets it, if known
- how the agent will use it
- how secrets must not be stored
- fallback if the user declines

Example:

```markdown
#### Task 3 — Configure Stripe Secret

Type: checkpoint:external-setup

Files:
- `.env.local` — user-managed only; do not commit

Action:
Ask Orvo to request `STRIPE_SECRET_KEY` from the user. Explain that it comes from Stripe Dashboard -> Developers -> API keys. Do not print the value in logs and do not commit it.

Verify:
After the user confirms it is present, run:

```bash
npm run test:stripe-config
```

Done:
- Runtime config detects `STRIPE_SECRET_KEY`.
- Secret is not committed.
```

Why this fits Four-Man Team:

- It keeps setup attached to the task that needs it.
- Resume remains simple because `STATUS.md` records whether the checkpoint is complete.
- It avoids the GSD-style global setup frontmatter/state model.

Discussion points:

- Should external setup checkpoints be allowed to name `.env.local`, or should they avoid file-specific secret handling?
- Should the checker fail if a setup checkpoint does not mention secret handling?

Default proposal:

- Allow `.env.local` references only when the target project already uses that pattern.
- Checker should warn or fail if an external setup checkpoint does not include "do not commit" or equivalent secret-safety wording.

Implementation references:

- Update `src/templates/PLAN.md`.
- Update `src/prompts/arch.md`.
- Update `src/prompts/orvo.md` if Orvo needs explicit wording for asking setup questions.
- Extend `checkPlan(planPath)` in `scripts/four-man-team.ts` if Step 1 checkpoint validation exists.
- Update `tests/workflow/four-man-team-cli.test.ts` and `tests/workflow/planner.test.ts`.
- Add `tests/fixtures/workflow/external-setup-plan.md` if useful.

Concrete Step 7 implementation checklist:

- Keep setup represented as `Type: checkpoint:external-setup` task blocks in `PLAN.md`.
- Do not add:
  - `user_setup.yaml`
  - `setup.json`
  - `.planning/STATE.md`
  - global setup checklist files
- Update `src/templates/PLAN.md` external setup example to require:
  - service/system
  - why setup is needed
  - exact item needed
  - where user can find/create it when known
  - how Executor uses it
  - secret-safety instruction
  - fallback if user declines
- Update `src/prompts/arch.md`:
  - Arch should identify external setup only when the agent cannot perform it safely
  - Arch should not ask the user to do automatable CLI/API work
  - Arch should include secrets only as names, never values
- Update `src/prompts/orvo.md`:
  - Orvo asks the user for setup input without exposing secrets in logs
  - Orvo records completion/blocker status in task `STATUS.md`
  - Orvo does not write secrets into tracked files
- Extend `checkPlan`:
  - `checkpoint:external-setup` must mention a service/system or external dependency
  - must include secret-safety language when the task mentions key/token/secret/password/credential
  - acceptable secret-safety terms: `do not commit`, `not committed`, `do not store`, `do not print`, `redact`
  - must include a fallback or blocked-state instruction if user cannot provide setup

Expected test updates:

- Add valid external setup fixture that passes.
- Add invalid fixture or inline test for setup checkpoint mentioning `SECRET_KEY` without secret-safety wording.
- Add invalid fixture or inline test for setup checkpoint without fallback/blocked instruction.
- Add `planner.test.ts` assertion that no `user_setup.yaml` or `.planning/STATE.md` references are introduced.

Acceptance criteria:

- `npm test` passes.
- External setup is handled through plan checkpoints and task status only.
- Secret handling is explicit and safe.
- No global setup state is introduced.

## Suggested Discussion Order

1. Step 1 — Strengthen Plan Verification
2. Step 5 — Goal-Backward Must-Have Verification
3. Step 3 — Explicit Checkpoint Patterns
4. Step 6 — TDD Mode For Testable Work
5. Step 2 — Resume Summary Without Duplicated State
6. Step 7 — User Setup Tracking As Plan Checkpoints
7. Step 4 — Confirm Codebase Map-Lite stays skipped
