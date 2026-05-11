import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(import.meta.dir, "..", "..");

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

describe("workflow paths", () => {
  test("ships read-only templates instead of a writable handoff folder", () => {
    expect(existsSync(path.join(rootDir, "src", "templates"))).toBe(true);
    expect(existsSync(path.join(rootDir, "src", "handoff"))).toBe(false);
  });

  test("runtime prompts and config do not target legacy handoff state", async () => {
    const runtimeFiles = [
      "src/config.yaml",
      "src/prompts/orvo.md",
      "src/prompts/arch.md",
      "src/prompts/execution.md",
      "src/prompts/review.md",
    ];

    for (const file of runtimeFiles) {
      expect(await readRepoFile(file), file).not.toContain(".4-man-team/handoff");
    }
  });
});
