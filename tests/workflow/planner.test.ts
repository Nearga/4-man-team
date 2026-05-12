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
    expect(planTemplate).toContain("trivial / medium / complex / tdd");
    expect(planTemplate).toContain("## Must Haves");
    expect(planTemplate).toContain("## Task Waves");
    expect(planTemplate).toContain("Files:");
    expect(planTemplate).toContain("Action:");
    expect(planTemplate).toContain("Verify:");
    expect(planTemplate).toContain("Done:");
  });

  test("keeps Arch planning separate from execution", async () => {
    const archPrompt = await readRepoFile("src/prompts/arch.md");

    expect(archPrompt).toContain("Planning is not execution");
    expect(archPrompt).toContain("Do not edit project source files");
    expect(archPrompt).toContain("do not invoke execution agents");
    expect(archPrompt).toContain("Write only the active task folder's `PLAN.md`");
  });

  test("documents goal-backward must-have categories", async () => {
    const archPrompt = await readRepoFile("src/prompts/arch.md");
    const planTemplate = await readRepoFile("src/templates/PLAN.md");

    expect(planTemplate).toContain("Truths:");
    expect(planTemplate).toContain("Artifacts:");
    expect(planTemplate).toContain("Key links:");
    expect(planTemplate).toContain("Observable outcomes");
    expect(planTemplate).toContain("path-based artifacts");
    expect(archPrompt).toContain("working backward from the user goal");
    expect(archPrompt).toContain("Map observable truths to concrete artifacts and key links");
    expect(archPrompt).toContain("Avoid generic truths");
  });

  test("documents explicit checkpoint patterns", async () => {
    const archPrompt = await readRepoFile("src/prompts/arch.md");
    const planTemplate = await readRepoFile("src/templates/PLAN.md");
    const taskTypes = [
      "auto",
      "checkpoint:decision",
      "checkpoint:human-verify",
      "checkpoint:human-action",
      "checkpoint:external-setup",
    ];

    expect(planTemplate).toContain("## Checkpoint Rules");
    for (const taskType of taskTypes) {
      expect(planTemplate).toContain(taskType);
    }
    expect(planTemplate).toContain("CLI, API, or browser automation");
    expect(planTemplate).toContain("exact Orvo/user-facing question or instruction");
    expect(archPrompt).toContain("plan automation instead of a checkpoint");
    expect(archPrompt).toContain("exact Orvo/user-facing ask");
  });

  test("documents TDD flow selection and sequencing", async () => {
    const archPrompt = await readRepoFile("src/prompts/arch.md");
    const planTemplate = await readRepoFile("src/templates/PLAN.md");
    const tddCandidates = [
      "pure functions",
      "validation rules",
      "data transforms",
      "API contracts",
      "state machines",
      "CLI input/output",
      "deployment logic",
    ];
    const poorTddCandidates = [
      "prompt-only edits",
      "docs-only edits",
      "one-off shell glue",
      "visual/UI polish",
    ];

    expect(planTemplate).toContain("## TDD Notes");
    expect(planTemplate).toContain("Selected flow: tdd");
    expect(planTemplate).toContain("red/green/refactor");
    expect(archPrompt).toContain("Selected flow: tdd");
    expect(archPrompt).toContain("first non-checkpoint task test-focused");
    expect(archPrompt).toContain("red/green/refactor");
    for (const candidate of tddCandidates) {
      expect(archPrompt).toContain(candidate);
      expect(planTemplate).toContain(candidate);
    }
    for (const candidate of poorTddCandidates) {
      expect(archPrompt).toContain(candidate);
      expect(planTemplate).toContain(candidate);
    }
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
