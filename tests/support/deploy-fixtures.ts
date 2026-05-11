import { readFile } from "node:fs/promises";
import path from "node:path";
import type { planDeployment } from "../../scripts/deploy-core";

export const deployFixturesDir = path.join(import.meta.dir, "..", "fixtures", "deploy");
export const deploySourceDir = path.join(deployFixturesDir, "source", ".4-man-team");

export type ExpectedOperation = {
  type: string;
  relativePath: string;
};

export async function expectedOperations(name: string): Promise<ExpectedOperation[]> {
  const raw = await readFile(path.join(deployFixturesDir, "expected", `${name}.json`), "utf8");
  return JSON.parse(raw) as ExpectedOperation[];
}

export function normalizePlan(
  plan: Awaited<ReturnType<typeof planDeployment>>,
): ExpectedOperation[] {
  return plan.operations.map((operation) => ({
    type: operation.type,
    relativePath: operation.relativePath,
  }));
}

