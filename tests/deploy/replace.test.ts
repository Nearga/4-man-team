import { describe, expect, test } from "bun:test";
import { cp, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { replaceDeployment } from "../../scripts/deploy-core";

const fixturesDir = path.join(import.meta.dir, "..", "fixtures", "deploy");
const sourceDir = path.join(fixturesDir, "source", ".4-man-team");

async function withTempProject(
  fixtureName: string | null,
  fn: (projectDir: string, targetDir: string) => Promise<void>,
): Promise<void> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "four-man-team-deploy-"));
  try {
    const projectDir = path.join(tempRoot, "project");
    if (fixtureName) {
      await cp(path.join(fixturesDir, fixtureName), projectDir, { recursive: true });
    } else {
      await mkdir(projectDir);
    }
    await fn(projectDir, path.join(projectDir, ".4-man-team"));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

describe("deployment replacement", () => {
  test("creates target .4-man-team when missing", async () => {
    await withTempProject(null, async (_projectDir, targetDir) => {
      await replaceDeployment({ sourceDir, targetDir });

      expect((await readFile(path.join(targetDir, "config.yaml"), "utf8")).trim()).toBe("name: source");
      expect(await readFile(path.join(targetDir, "prompts", "orvo.md"), "utf8")).toContain("# Orvo Fixture");
    });
  });

  test("deletes existing target state before copying source", async () => {
    await withTempProject("target-matching", async (_projectDir, targetDir) => {
      expect(existsSync(path.join(targetDir, "local-only.md"))).toBe(true);

      await replaceDeployment({ sourceDir, targetDir });

      expect((await readFile(path.join(targetDir, "config.yaml"), "utf8")).trim()).toBe("name: source");
      expect(existsSync(path.join(targetDir, "local-only.md"))).toBe(false);
    });
  });
});
