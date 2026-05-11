import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(import.meta.dir, "..", "..");

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

describe("planner prompt and template", () => {
  test("includes executable planning concepts", async () => {
    const archPrompt = await readRepoFile("src/prompts/arch.md");
    const planTemplate = await readRepoFile("src/templates/PLAN.md");

    expect(archPrompt).toContain("goal-backward");
    expect(archPrompt).toContain("vertical slices");
    expect(archPrompt).toContain("TDD candidates");
    expect(planTemplate).toContain("## Must Haves");
    expect(planTemplate).toContain("## Task Waves");
    expect(planTemplate).toContain("Files:");
    expect(planTemplate).toContain("Action:");
    expect(planTemplate).toContain("Verify:");
    expect(planTemplate).toContain("Done:");
  });

  test("does not leak external GSD workflow references", async () => {
    const shippedFiles = [
      "src/prompts/arch.md",
      "src/templates/PLAN.md",
      "scripts/four-man-team.ts",
    ];

    for (const file of shippedFiles) {
      const content = await readRepoFile(file);
      expect(content, file).not.toContain("/gsd:");
      expect(content, file).not.toContain(".planning/");
      expect(content, file).not.toContain("gsd-planner");
      expect(content, file).not.toContain("Claude executor");
    }
  });
});
