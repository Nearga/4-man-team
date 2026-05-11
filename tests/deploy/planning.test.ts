import { describe, expect, test } from "bun:test";
import path from "node:path";
import { planDeployment } from "../../scripts/deploy-core";
import {
  deployFixturesDir,
  deploySourceDir,
  expectedOperations,
  normalizePlan,
} from "../support/deploy-fixtures";

describe("deployment planning", () => {
  test("creates missing target files", async () => {
    const plan = await planDeployment({
      sourceDir: deploySourceDir,
      targetDir: path.join(deployFixturesDir, "target-missing", ".arch"),
      force: false,
    });

    expect(normalizePlan(plan)).toEqual(await expectedOperations("missing"));
    expect(plan.summary).toEqual({ create: 2, skip: 0, conflict: 0, overwrite: 0 });
  });

  test("skips matching target files and ignores unknown target files", async () => {
    const plan = await planDeployment({
      sourceDir: deploySourceDir,
      targetDir: path.join(deployFixturesDir, "target-matching", ".arch"),
      force: false,
    });

    expect(normalizePlan(plan)).toEqual(await expectedOperations("matching"));
    expect(plan.summary).toEqual({ create: 0, skip: 2, conflict: 0, overwrite: 0 });
  });

  test("reports conflicts for differing target files", async () => {
    const plan = await planDeployment({
      sourceDir: deploySourceDir,
      targetDir: path.join(deployFixturesDir, "target-conflict", ".arch"),
      force: false,
    });

    expect(normalizePlan(plan)).toEqual(await expectedOperations("conflict"));
    expect(plan.summary).toEqual({ create: 0, skip: 1, conflict: 1, overwrite: 0 });
  });

  test("reports overwrites for differing target files when forced", async () => {
    const plan = await planDeployment({
      sourceDir: deploySourceDir,
      targetDir: path.join(deployFixturesDir, "target-conflict", ".arch"),
      force: true,
    });

    expect(normalizePlan(plan)).toEqual(await expectedOperations("force"));
    expect(plan.summary).toEqual({ create: 0, skip: 1, conflict: 0, overwrite: 1 });
  });
});

