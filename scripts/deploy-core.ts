import { cp, readFile, rm, stat } from "node:fs/promises";
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
};

export function parseArgs(argv: string[], defaults: { configPath: string; cwd: string }): DeployArgs {
  const args: DeployArgs = {
    configPath: defaults.configPath,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
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

export async function replaceDeployment(options: {
  sourceDir: string;
  targetDir: string;
}): Promise<void> {
  await assertDirectory(options.sourceDir, "Template source");
  await rm(options.targetDir, { recursive: true, force: true });
  await cp(options.sourceDir, options.targetDir, { recursive: true });
}
