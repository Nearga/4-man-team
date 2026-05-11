#!/usr/bin/env bun
import { existsSync } from "node:fs";
import path from "node:path";
import {
  assertDirectory,
  configMissingMessage,
  parseArgs,
  readConfig,
  replaceDeployment,
} from "./deploy-core";

const rootDir = path.resolve(import.meta.dir, "..");
const sourceDir = path.join(rootDir, "src");
const defaultConfigPath = path.join(rootDir, "deployment", "projects.local.json");
const exampleConfigPath = path.join(rootDir, "deployment", "projects.example.json");

async function deployProject(projectName: string, projectPath: string): Promise<void> {
  await assertDirectory(projectPath, `Project "${projectName}" path`);

  const targetDir = path.join(projectPath, ".4-man-team");

  console.log(`\n== ${projectName}`);
  console.log(`target: ${targetDir}`);
  console.log("replace .4-man-team");

  await replaceDeployment({ sourceDir, targetDir });
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

  for (const project of projects) {
    if (!project.name || !project.path) {
      throw new Error("Each project must include name and path.");
    }
    await deployProject(project.name, project.path);
  }

  console.log("\nDone. Deployment complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
