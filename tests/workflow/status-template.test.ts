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

  test("prompts require status handoff updates", async () => {
    const orvoPrompt = await readRepoFile("src/prompts/orvo.md");
    const executionPrompt = await readRepoFile("src/prompts/execution.md");
    const reviewPrompt = await readRepoFile("src/prompts/review.md");

    expect(orvoPrompt).toContain("Update `STATUS.md` resume fields");
    expect(orvoPrompt).toContain("Next action");
    expect(executionPrompt).toContain("update `STATUS.md` before stopping");
    expect(executionPrompt).toContain("what changed / why it matters");
    expect(executionPrompt).toContain("without chat history");
    expect(reviewPrompt).toContain("handoff/change-log details");
  });

  test("Orvo enforces planning-to-execution phase boundaries", async () => {
    const orvoPrompt = await readRepoFile("src/prompts/orvo.md");

    expect(orvoPrompt).toContain("`planning` is planning-only");
    expect(orvoPrompt).toContain("write only task-state planning artifacts");
    expect(orvoPrompt).toContain("do not edit project source files");
    expect(orvoPrompt).toContain("do not invoke execution agents");
    expect(orvoPrompt).toContain("Current state: waiting for confirmation");
    expect(orvoPrompt).toContain("Current state: executing");
    expect(orvoPrompt).toContain("Executor is the only role that may edit project source files");
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
