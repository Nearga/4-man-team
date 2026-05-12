import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(import.meta.dir, "..", "..");

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

describe("status resume template", () => {
  test("keeps resume fields in STATUS.md", async () => {
    const statusTemplate = await readRepoFile("src/templates/STATUS.md");

    expect(statusTemplate).toContain("**Next action:**");
    expect(statusTemplate).toContain("**Last completed action:**");
    expect(statusTemplate).toContain("**Handoff note:**");
    expect(statusTemplate).toContain("## Files Touched This Session");
    expect(statusTemplate).toContain("what changed / why it matters");
    expect(statusTemplate).toContain("## Still Open");
  });

  test("keeps task resolution rules in Orvo", async () => {
    const orvoPrompt = await readRepoFile("src/prompts/orvo.md");

    expect(orvoPrompt).toContain("inspect the five most recent folders");
    expect(orvoPrompt).toContain("Current state: closed");
    expect(orvoPrompt).toContain("missing or unreadable `STATUS.md` counts as unfinished");
  });

  test("non-Orvo agents stop when active task resolution is ambiguous", async () => {
    const archPrompt = await readRepoFile("src/prompts/arch.md");
    const executionPrompt = await readRepoFile("src/prompts/execution.md");
    const reviewPrompt = await readRepoFile("src/prompts/review.md");

    for (const prompt of [archPrompt, executionPrompt, reviewPrompt]) {
      expect(prompt).toContain("If zero or more than one task is unfinished, stop and ask Orvo which task to use");
    }
  });

  test("prompts require status handoff updates", async () => {
    const orvoPrompt = await readRepoFile("src/prompts/orvo.md");
    const executionPrompt = await readRepoFile("src/prompts/execution.md");
    const reviewPrompt = await readRepoFile("src/prompts/review.md");
    const statusTemplate = await readRepoFile("src/templates/STATUS.md");

    expect(orvoPrompt).toContain("Update `STATUS.md` resume fields");
    expect(orvoPrompt).toContain("Next action");
    expect(executionPrompt).toContain("update `STATUS.md` before stopping");
    expect(executionPrompt).toContain("what changed / why it matters");
    expect(executionPrompt).toContain("without chat history");
    expect(reviewPrompt).toContain("handoff/change-log details");
    expect(statusTemplate).toContain("Agent watch:");
  });

  test("Orvo enforces planning-to-execution phase boundaries", async () => {
    const orvoPrompt = await readRepoFile("src/prompts/orvo.md");

    expect(orvoPrompt).toContain("Ask for confirmation before nontrivial execution");
    expect(orvoPrompt).toContain("targeted read-only research pass");
    expect(orvoPrompt).toContain("identify obvious quick fixes");
    expect(orvoPrompt).toContain("must not perform deep implementation research");
    expect(orvoPrompt).toContain("route to Arch immediately");
    expect(orvoPrompt).toContain("targeted intake research for routing");
    expect(orvoPrompt).toContain("`planning` is planning-only");
    expect(orvoPrompt).toContain("write only task-state planning artifacts");
    expect(orvoPrompt).toContain("do not edit project source files");
    expect(orvoPrompt).toContain("do not invoke execution agents");
    expect(orvoPrompt).toContain("Current state: waiting for confirmation");
    expect(orvoPrompt).toContain("Current state: executing");
    expect(orvoPrompt).toContain("Executor is the only role that may edit project source files");
    expect(orvoPrompt).toContain("task packet drafts, or intake summaries");
    expect(orvoPrompt).not.toContain("Ask for confirmation before nontrivial work");
    expect(orvoPrompt).not.toContain("draft plans");
  });

  test("Orvo can watch routed agents without taking over their work", async () => {
    const orvoPrompt = await readRepoFile("src/prompts/orvo.md");

    expect(orvoPrompt).toContain("## Agent Watch");
    expect(orvoPrompt).toContain("Orvo watches routed agents as an orchestrator");
    expect(orvoPrompt).toContain("not as a second planner, executor, reviewer, or observer");
    expect(orvoPrompt).toContain("`TASK.md`, `PLAN.md`, `EXECUTION.md`, `REVIEW.md`, `OBSERVATION.md`, and `STATUS.md`");
    expect(orvoPrompt).toContain("required phase artifacts exist and are ready for the next handoff");
    expect(orvoPrompt).toContain("write it under `STATUS.md` Step History");
    expect(orvoPrompt).toContain("Do not solve the delegated planning, implementation, review, or observation problem in Orvo");
    expect(orvoPrompt).not.toContain("relevant artifact notes when available");
  });

  test("does not introduce separate resume state", async () => {
    const sourceFiles = [
      "src/prompts/orvo.md",
      "src/prompts/execution.md",
      "src/prompts/review.md",
      "src/templates/STATUS.md",
    ];

    for (const file of sourceFiles) {
      const content = await readRepoFile(file);
      expect(content, file).not.toContain("current-task.md");
      expect(content, file).not.toContain("SUMMARY.md");
      expect(content, file).not.toContain(".planning/");
      expect(content, file).not.toContain("summary state");
    }
  });
});
