#!/usr/bin/env bun
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export type TaskCandidate = {
  id: string;
  path: string;
  mtimeMs: number;
  currentState: string;
  activeStep: string;
  lastCleared: string;
  stillOpen: string[];
  unfinished: boolean;
  statusReadable: boolean;
};

export type ResolveTasksResult = {
  tasksDir: string;
  candidates: TaskCandidate[];
  unfinished: TaskCandidate[];
  status: "none" | "single" | "multiple";
};

export type PlanCheckResult = {
  valid: boolean;
  errors: string[];
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstMatch(content: string, pattern: RegExp, fallback = "unknown"): string {
  return content.match(pattern)?.[1]?.trim() || fallback;
}

function extractStillOpen(content: string): string[] {
  const section = content.match(/## Still Open\s*([\s\S]*?)(?:\n## |\n```|$)/i)?.[1] || "";
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

async function parseTaskStatus(taskPath: string, id: string, mtimeMs: number): Promise<TaskCandidate> {
  const statusPath = path.join(taskPath, "STATUS.md");

  if (!existsSync(statusPath)) {
    return {
      id,
      path: taskPath,
      mtimeMs,
      currentState: "missing STATUS.md",
      activeStep: "unknown",
      lastCleared: "unknown",
      stillOpen: ["STATUS.md is missing"],
      unfinished: true,
      statusReadable: false,
    };
  }

  try {
    const content = await readFile(statusPath, "utf8");
    const currentState = firstMatch(content, /\*\*Current state:\*\*\s*([^\n]+)/i);
    return {
      id,
      path: taskPath,
      mtimeMs,
      currentState,
      activeStep: firstMatch(content, /\*\*Active step:\*\*\s*([^\n]+)/i),
      lastCleared: firstMatch(content, /\*\*Last cleared:\*\*\s*([^\n]+)/i),
      stillOpen: extractStillOpen(content),
      unfinished: currentState.toLowerCase() !== "closed",
      statusReadable: true,
    };
  } catch {
    return {
      id,
      path: taskPath,
      mtimeMs,
      currentState: "unreadable STATUS.md",
      activeStep: "unknown",
      lastCleared: "unknown",
      stillOpen: ["STATUS.md could not be read"],
      unfinished: true,
      statusReadable: false,
    };
  }
}

export async function resolveTasks(root: string, limit = 5): Promise<ResolveTasksResult> {
  const tasksDir = path.join(root, ".4-man-team", "tasks");
  if (!existsSync(tasksDir)) {
    return { tasksDir, candidates: [], unfinished: [], status: "none" };
  }

  const entries = await readdir(tasksDir, { withFileTypes: true });
  const dirs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const taskPath = path.join(tasksDir, entry.name);
        const info = await stat(taskPath);
        return { id: entry.name, path: taskPath, mtimeMs: info.mtimeMs };
      }),
  );

  const candidates = await Promise.all(
    dirs
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)
      .map((dir) => parseTaskStatus(dir.path, dir.id, dir.mtimeMs)),
  );
  const unfinished = candidates.filter((task) => task.unfinished);
  const status = unfinished.length === 0 ? "none" : unfinished.length === 1 ? "single" : "multiple";

  return { tasksDir, candidates, unfinished, status };
}

export async function checkPlan(planPath: string): Promise<PlanCheckResult> {
  const content = await readFile(planPath, "utf8");
  const errors: string[] = [];
  const requiredSections = [
    "## Objective",
    "## User Decisions And Constraints",
    "## Deferred Scope",
    "## Assumptions",
    "## Context Read",
    "## Must Haves",
    "## Task Waves",
    "## Verification",
    "## Risks",
    "## Rollback Notes",
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push(`Missing section: ${section}`);
    }
  }

  const taskSections = content.match(/#### Task [\s\S]*?(?=\n#### Task |\n## |$)/g) || [];
  if (taskSections.length === 0) {
    errors.push("Missing task sections");
  }

  for (const [index, task] of taskSections.entries()) {
    const label = `Task ${index + 1}`;
    for (const field of ["Files:", "Action:", "Verify:", "Done:"]) {
      if (!task.includes(field)) {
        errors.push(`${label} missing ${field}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function valueAfterFlag(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] || null;
}

async function main(): Promise<void> {
  const [command, subcommand, ...rest] = process.argv.slice(2);

  if (command === "slug") {
    const text = [subcommand, ...rest].filter(Boolean).join(" ");
    if (!text) throw new Error("Usage: four-man-team slug <text>");
    console.log(slugify(text));
    return;
  }

  if (command === "task" && subcommand === "resolve") {
    const root = path.resolve(valueAfterFlag(rest, "--root") || process.cwd());
    const result = await resolveTasks(root);
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "multiple") {
      process.exitCode = 2;
    }
    return;
  }

  if (command === "plan" && subcommand === "check") {
    const planPath = rest[0];
    if (!planPath) throw new Error("Usage: four-man-team plan check <PLAN.md>");
    const result = await checkPlan(path.resolve(planPath));
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) {
      process.exitCode = 1;
    }
    return;
  }

  throw new Error("Usage: four-man-team <slug|task resolve|plan check>");
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
