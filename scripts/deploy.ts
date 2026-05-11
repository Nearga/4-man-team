#!/usr/bin/env bun
import { existsSync } from "node:fs";
import path from "node:path";
import {
  applyDeploymentPlan,
  assertDirectory,
  configMissingMessage,
  parseArgs,
  planDeployment,
  readConfig,
  type DeployOperationType,
} from "./deploy-core";

const rootDir = path.resolve(import.meta.dir, "..");
const sourceDir = path.join(rootDir, "src");
const defaultConfigPath = path.join(rootDir, "deployment", "projects.local.json");
const exampleConfigPath = path.join(rootDir, "deployment", "projects.example.json");

function formatOperation(type: DeployOperationType, dryRun: boolean): string {
  if (type === "create") {
    return dryRun ? "would create" : "create";
  }
  if (type === "overwrite") {
    return dryRun ? "would overwrite" : "overwrite";
  }
  return type;
}

async function deployProject(projectName: string, projectPath: string, args: ReturnType<typeof parseArgs>): Promise<number> {
  await assertDirectory(projectPath, `Project "${projectName}" path`);

  const targetDir = path.join(projectPath, ".4-man-team");
  const plan = await planDeployment({ sourceDir, targetDir, force: args.force });

  console.log(`\n== ${projectName}`);
  console.log(`target: ${targetDir}`);

  for (const operation of plan.operations) {
    const line = `${formatOperation(operation.type, args.dryRun)} ${operation.relativePath}`;
    if (operation.type === "conflict" || operation.type === "overwrite") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  console.log(
    `summary: ${plan.summary.create} create, ${plan.summary.skip} skip, ${plan.summary.conflict} conflict, ${plan.summary.overwrite} overwrite`,
  );

  await applyDeploymentPlan(plan, args.dryRun);

  return plan.summary.conflict;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), { configPath: defaultConfigPath, cwd: process.cwd() });
  await assertDirectory(sourceDir, "Template source");

  if (!existsSync(args.configPath)) {
    console.log(configMissingMessage(args.configPath));
    return;
  }

  const config = await readConfig(args.configPath, exampleConfigPath);

  const projects = (config.projects ?? []).filter((project) => project.enabled !== false);
  if (projects.length === 0) {
    throw new Error("No enabled projects found in deployment config.");
  }

  let totalConflicts = 0;
  for (const project of projects) {
    if (!project.name || !project.path) {
      throw new Error("Each project must include name and path.");
    }
    totalConflicts += await deployProject(project.name, project.path, args);
  }

  if (totalConflicts > 0 && !args.force) {
    throw new Error(`Refused to overwrite ${totalConflicts} conflicting file(s). Use --force to overwrite.`);
  }

  console.log(`\nDone. ${args.dryRun ? "No files changed." : "Deployment complete."}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
