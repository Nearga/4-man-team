import { describe, expect, test } from "bun:test";
import { configMissingMessage, parseArgs } from "../../scripts/deploy-core";

describe("deployment config", () => {
  test("prints the expected no-op setup instruction", () => {
    expect(configMissingMessage("/local/project/deployment/projects.local.json")).toBe(
      "config is missed, create new config at /local/project/deployment/projects.local.json",
    );
  });

  test("resolves custom config path from current working directory", () => {
    const args = parseArgs(["--config", "deployment/custom.json"], {
      configPath: "/default/projects.local.json",
      cwd: "/repo",
    });

    expect(args).toEqual({
      configPath: "/repo/deployment/custom.json",
    });
  });

  test("rejects removed dry-run and force flags", () => {
    expect(() =>
      parseArgs(["--dry-run"], {
        configPath: "/default/projects.local.json",
        cwd: "/repo",
      }),
    ).toThrow("Unknown argument: --dry-run");

    expect(() =>
      parseArgs(["--force"], {
        configPath: "/default/projects.local.json",
        cwd: "/repo",
      }),
    ).toThrow("Unknown argument: --force");
  });
});
