import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkPlan, resolveTasks, slugify } from "../../scripts/four-man-team";

const fixturesDir = path.join(import.meta.dir, "..", "fixtures", "workflow");

async function checkPlanContent(content: string) {
  const dir = await mkdtemp(path.join(tmpdir(), "four-man-team-plan-"));
  const planPath = path.join(dir, "PLAN.md");

  try {
    await writeFile(planPath, content);
    return await checkPlan(planPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function planWithTask(task: string): string {
  return `# Arch Plan

## Objective

Goal: Build the feature.
Purpose: Make the user workflow complete.
Output: Working implementation.

## User Decisions And Constraints

- Locked decision: Use existing patterns.

## Deferred Scope

- Search is out of scope.

## Assumptions

- Existing tests cover baseline behavior.

## Context Read

- \`src/app.ts\` — entrypoint.

## Must Haves

Truths:
- User can complete the flow.

Artifacts:
- \`src/app.ts\` — real implementation.

Key links:
- \`src/app.ts -> tests/app.test.ts\` — behavior covered.

## Task Waves

### Wave 1 — Implementation

${task}

## Verification

- [ ] npm test

## Risks

- Scope drift — keep deferred scope out.

## Rollback Notes

- Revert the feature commit.
`;
}

describe("four-man-team workflow helpers", () => {
  test("generates stable slugs", () => {
    expect(slugify("Persist task storage!")).toBe("persist-task-storage");
  });

  test("resolves a single unfinished task", async () => {
    const result = await resolveTasks(path.join(fixturesDir, "project-one-open"));

    expect(result.status).toBe("single");
    expect(result.unfinished).toHaveLength(1);
    expect(result.unfinished[0].id).toBe("2026-05-11-open");
    expect(result.unfinished[0].currentState).toBe("planning");
  });

  test("reports multiple unfinished tasks", async () => {
    const result = await resolveTasks(path.join(fixturesDir, "project-two-open"));

    expect(result.status).toBe("multiple");
    expect(result.unfinished.map((task) => task.id).sort()).toEqual([
      "2026-05-10-open",
      "2026-05-11-open",
    ]);
  });

  test("validates executable plan structure", async () => {
    const result = await checkPlan(path.join(fixturesDir, "valid-plan.md"));

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("rejects incomplete plan structure", async () => {
    const result = await checkPlan(path.join(fixturesDir, "invalid-plan.md"));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing section: ## Must Haves");
    expect(result.errors).toContain("Task 1 missing Type:");
    expect(result.errors).toContain("Task 1 missing Files:");
    expect(result.errors).toContain("Task 1 missing Verify:");
    expect(result.errors).toContain("Task 1 missing Done:");
    expect(result.errors).toContain("Task 1 missing Dependencies:");
  });

  test("rejects placeholder verification", async () => {
    const result = await checkPlanContent(
      planWithTask(`#### Task 1 — Placeholder verification

Type: auto

Files:
- \`src/app.ts\` — update behavior.

Action:
Add the feature using existing patterns.

Verify:

\`\`\`bash
[command]
\`\`\`

Done:
- Feature works and tests pass.

Dependencies:
- None.`),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Task 1 has placeholder or empty Verify:");
    expect(result.errors).toContain(
      "Task 1 Verify: for auto tasks must include a concrete command or explicit missing-test marker",
    );
  });

  test("rejects auto task without concrete command", async () => {
    const result = await checkPlanContent(
      planWithTask(`#### Task 1 — Manual auto verification

Type: auto

Files:
- \`src/app.ts\` — update behavior.

Action:
Add the feature using existing patterns.

Verify:
Check the app manually after implementation.

Done:
- Feature works and tests pass.

Dependencies:
- None.`),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Task 1 Verify: for auto tasks must include a concrete command or explicit missing-test marker",
    );
  });

  test("allows checklist command verification", async () => {
    const result = await checkPlanContent(
      planWithTask(`#### Task 1 — Checklist command

Type: auto

Files:
- \`src/app.ts\` — update behavior.

Action:
Add the feature using existing patterns.

Verify:
- [ ] npm test

Done:
- Feature works and tests pass.

Dependencies:
- None.`),
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("allows checkpoint task with precise human verification", async () => {
    const result = await checkPlanContent(
      planWithTask(`#### Task 1 — Confirm copy

Type: checkpoint:human-verify

Files:
- \`src/app.ts\` — no code changes; user-visible behavior only.

Action:
Pause for the user to inspect the rendered settings screen.

Verify:
Ask the user to confirm the settings screen shows the saved project name after refresh.

Done:
- User confirms the refreshed settings screen shows the saved project name.

Dependencies:
- None.`),
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
