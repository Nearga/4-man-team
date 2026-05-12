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

function planWithTask(
  task: string,
  options: {
    selectedFlow?: string;
    mustHaves?: string;
  } = {},
): string {
  const mustHaves =
    options.mustHaves ||
    `Truths:
- User can complete the flow.

Artifacts:
- \`src/app.ts\` — real implementation.

Key links:
- \`src/app.ts\` -> \`tests/app.test.ts\` — behavior covered.`;

  return `# Arch Plan
${options.selectedFlow ? `\n**Selected flow:** ${options.selectedFlow}\n` : ""}

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

${mustHaves}

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

  test("validates executable TDD plan structure", async () => {
    const result = await checkPlan(path.join(fixturesDir, "tdd-plan.md"));

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
Ask Orvo to ask the user to inspect the rendered settings screen after refresh.

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

  test("rejects missing must-have truths", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Implement feature

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
- None.`,
        {
          mustHaves: `Artifacts:
- \`src/app.ts\` — real implementation.

Key links:
- \`src/app.ts\` -> \`tests/app.test.ts\` — behavior covered.`,
        },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Must Haves missing Truths:");
  });

  test("rejects placeholder must-have artifact", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Implement feature

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
- None.`,
        {
          mustHaves: `Truths:
- User can complete the flow.

Artifacts:
- [file] — [what changes]

Key links:
- \`src/app.ts\` -> \`tests/app.test.ts\` — behavior covered.`,
        },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Must Haves Artifacts: has placeholder or empty content");
  });

  test("rejects file-changing plan without path-like artifact", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Implement feature

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
- None.`,
        {
          mustHaves: `Truths:
- User can complete the flow.

Artifacts:
- Application behavior is updated.

Key links:
- \`src/app.ts\` -> \`tests/app.test.ts\` — behavior covered.`,
        },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Must Haves Artifacts: must include at least one path-like artifact for file-changing plans",
    );
  });

  test("rejects medium plan without real key links", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Implement feature

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
- None.`,
        {
          selectedFlow: "medium",
          mustHaves: `Truths:
- User can complete the flow.

Artifacts:
- \`src/app.ts\` — real implementation.

Key links:
- None - no cross-file/runtime link for this trivial task.`,
        },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Must Haves Key links: must include real key links for medium plans");
  });

  test("rejects medium plan with vague key links", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Implement feature

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
- None.`,
        {
          selectedFlow: "medium",
          mustHaves: `Truths:
- User can complete the flow.

Artifacts:
- \`src/app.ts\` — real implementation.

Key links:
- Runtime wiring keeps working.`,
        },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Must Haves Key links: must include real key links for medium plans");
  });

  test("allows trivial plan with explicit no key links", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Implement feature

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
- None.`,
        {
          selectedFlow: "trivial",
          mustHaves: `Truths:
- User can complete the flow.

Artifacts:
- \`src/app.ts\` — real implementation.

Key links:
- None - no cross-file/runtime link for this trivial task.`,
        },
      ),
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("rejects TDD plan without red green refactor sequencing", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Add tests

Type: auto

Files:
- \`tests/app.test.ts\` — add behavior coverage.

Action:
Add a failing test for the new behavior.

Verify:
- [ ] npm test

Done:
- Behavior test exists.

Dependencies:
- None.`,
        { selectedFlow: "tdd" },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("TDD plans must include red/green/refactor sequencing");
  });

  test("rejects TDD plan without test-focused first task", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Green - Implement feature first

Type: auto

Files:
- \`src/app.ts\` — update behavior.

Action:
Green: implement behavior first. Red and refactor steps follow later.

Verify:
- [ ] npm test

Done:
- Feature works.

Dependencies:
- None.

#### Task 2 — Red - Add behavior test

Type: auto

Files:
- \`tests/app.test.ts\` — add behavior coverage.

Action:
Red: add a failing test for the behavior and refactor after it passes.

Verify:
- [ ] npm test

Done:
- Behavior test exists.

Dependencies:
- Task 1.`,
        { selectedFlow: "tdd" },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("TDD plans must start with a test-focused non-checkpoint task");
  });

  test("rejects TDD plan without concrete test command", async () => {
    const result = await checkPlanContent(
      planWithTask(
        `#### Task 1 — Red - Add behavior test

Type: auto

Files:
- \`tests/app.test.ts\` — add behavior coverage.

Action:
Red: add a failing test for the behavior, then green implementation and refactor cleanup.

Verify:
Run the relevant tests.

Done:
- Behavior test exists.

Dependencies:
- None.`,
        { selectedFlow: "tdd" },
      ),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("TDD plans must include a concrete test verification command");
  });

  test("rejects unknown checkpoint task type", async () => {
    const result = await checkPlanContent(
      planWithTask(`#### Task 1 — Unknown checkpoint

Type: checkpoint:approval

Files:
- \`src/app.ts\` — no edits until approval.

Action:
Ask Orvo to ask the user whether to continue.

Verify:
User answer confirms whether execution can continue.

Done:
- User confirms the next action.

Dependencies:
- None.`),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Task 1 has unsupported Type: checkpoint:approval");
  });

  test("rejects checkpoint task without explicit user ask", async () => {
    const result = await checkPlanContent(
      planWithTask(`#### Task 1 — Vague checkpoint

Type: checkpoint:decision

Files:
- \`src/app.ts\` — no edits until decision.

Action:
Pause for confirmation before changing settings behavior.

Verify:
User answer selects a concrete settings behavior and unblocks implementation.

Done:
- User confirms the selected settings behavior.

Dependencies:
- None.`),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Task 1 Action: for checkpoint tasks must include an explicit Orvo or user ask",
    );
  });
});
