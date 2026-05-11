import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export type ProjectConfig = {
  projects?: Array<{
    name?: string;
    path?: string;
    enabled?: boolean;
  }>;
};

export type DeployArgs = {
  configPath: string;
  dryRun: boolean;
  force: boolean;
};

export type DeployOperationType = "create" | "skip" | "conflict" | "overwrite";

export type DeployOperation = {
  type: DeployOperationType;
  relativePath: string;
  sourcePath: string;
  targetPath: string;
};

export type DeployPlan = {
  targetDir: string;
  operations: DeployOperation[];
  summary: Record<DeployOperationType, number>;
};

export function parseArgs(argv: string[], defaults: { configPath: string; cwd: string }): DeployArgs {
  const args: DeployArgs = {
    configPath: defaults.configPath,
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg === "--force") {
      args.force = true;
      continue;
    }
    if (arg === "--config") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --config");
      }
      args.configPath = path.resolve(defaults.cwd, value);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export function configMissingMessage(configPath: string): string {
  return `config is missed, create new config at ${configPath}`;
}

export async function sha256(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

export async function listFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, base)));
      continue;
    }
    if (entry.isFile()) {
      files.push(path.relative(base, fullPath));
    }
  }

  return files.sort();
}

export async function readConfig(configPath: string, exampleConfigPath: string): Promise<ProjectConfig> {
  if (!existsSync(configPath)) {
    throw new Error(`${configMissingMessage(configPath)}\nExample config: ${exampleConfigPath}`);
  }

  const raw = await readFile(configPath, "utf8");
  return JSON.parse(raw) as ProjectConfig;
}

export async function assertDirectory(dir: string, label: string): Promise<void> {
  let info;
  try {
    info = await stat(dir);
  } catch {
    throw new Error(`${label} does not exist: ${dir}`);
  }
  if (!info.isDirectory()) {
    throw new Error(`${label} is not a directory: ${dir}`);
  }
}

function emptySummary(): Record<DeployOperationType, number> {
  return {
    create: 0,
    skip: 0,
    conflict: 0,
    overwrite: 0,
  };
}

export async function planDeployment(options: {
  sourceDir: string;
  targetDir: string;
  force: boolean;
}): Promise<DeployPlan> {
  const files = await listFiles(options.sourceDir);
  const operations: DeployOperation[] = [];
  const summary = emptySummary();

  for (const relativePath of files) {
    const sourcePath = path.join(options.sourceDir, relativePath);
    const targetPath = path.join(options.targetDir, relativePath);
    const sourceHash = await sha256(sourcePath);

    let type: DeployOperationType;
    if (!existsSync(targetPath)) {
      type = "create";
    } else {
      const targetHash = await sha256(targetPath);
      if (sourceHash === targetHash) {
        type = "skip";
      } else {
        type = options.force ? "overwrite" : "conflict";
      }
    }

    summary[type] += 1;
    operations.push({ type, relativePath, sourcePath, targetPath });
  }

  return {
    targetDir: options.targetDir,
    operations,
    summary,
  };
}

export async function applyDeploymentPlan(plan: DeployPlan, dryRun: boolean): Promise<void> {
  if (dryRun) {
    return;
  }

  for (const operation of plan.operations) {
    if (operation.type !== "create" && operation.type !== "overwrite") {
      continue;
    }
    await mkdir(path.dirname(operation.targetPath), { recursive: true });
    await copyFile(operation.sourcePath, operation.targetPath);
  }
}
