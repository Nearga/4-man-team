import { describe, expect, test } from "bun:test";
import path from "node:path";
import { checkPlan, resolveTasks, slugify } from "../../scripts/four-man-team";

const fixturesDir = path.join(import.meta.dir, "..", "fixtures", "workflow");

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
    expect(result.errors).toContain("Task 1 missing Files:");
    expect(result.errors).toContain("Task 1 missing Verify:");
    expect(result.errors).toContain("Task 1 missing Done:");
  });
});
