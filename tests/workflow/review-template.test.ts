import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(import.meta.dir, "..", "..");

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

describe("review verdict templates", () => {
  test("uses one canonical review verdict enum", async () => {
    const reviewPrompt = await readRepoFile("src/prompts/review.md");
    const reviewTemplate = await readRepoFile("src/templates/REVIEW.md");
    const observationTemplate = await readRepoFile("src/templates/OBSERVATION.md");
    const canonicalVerdicts = "approve / approve_with_notes / request_changes";

    expect(reviewPrompt).toContain("approve");
    expect(reviewPrompt).toContain("approve_with_notes");
    expect(reviewPrompt).toContain("request_changes");
    expect(reviewTemplate).toContain(canonicalVerdicts);
    expect(observationTemplate).toContain(canonicalVerdicts);
    expect(reviewTemplate).not.toContain("APPROVED WITH CONDITIONS");
    expect(observationTemplate).not.toContain("APPROVED WITH CONDITIONS");
  });
});
