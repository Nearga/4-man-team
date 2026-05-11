import { describe, expect, test } from "bun:test";
import { configMissingMessage, parseArgs } from "../../scripts/deploy-core";

describe("deployment config", () => {
  test("prints the expected no-op setup instruction", () => {
    expect(configMissingMessage("/local/project/deployment/projects.local.json")).toBe(
      "config is missed, create new config at /local/project/deployment/projects.local.json",
    );
  });

  test("parses dry-run and force flags", () => {
    const args = parseArgs(["--dry-run", "--force"], {
      configPath: "/default/projects.local.json",
      cwd: "/repo",
    });

    expect(args).toEqual({
      configPath: "/default/projects.local.json",
      dryRun: true,
      force: true,
    });
  });

  test("resolves custom config path from current working directory", () => {
    const args = parseArgs(["--config", "deployment/custom.json"], {
      configPath: "/default/projects.local.json",
      cwd: "/repo",
    });

    expect(args).toEqual({
      configPath: "/repo/deployment/custom.json",
      dryRun: false,
      force: false,
    });
  });
});

