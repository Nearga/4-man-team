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

const requiredTaskFields = ["Type:", "Files:", "Action:", "Verify:", "Done:", "Dependencies:"] as const;
const taskFieldNames = ["Type", "Files", "Action", "Verify", "Done", "Dependencies"] as const;
const approvedTaskTypes = new Set([
  "auto",
  "checkpoint:decision",
  "checkpoint:human-verify",
  "checkpoint:human-action",
  "checkpoint:external-setup",
]);
const commandPrefixPattern = /^(?:[-*]\s*)?(?:\[[ x]\]\s*)?(?:npm|bun|node|git|npx|pnpm|yarn|cargo|pytest|uv|make)\s+\S|^(?:[-*]\s*)?(?:\[[ x]\]\s*)?\.\/\S/;
const pathLikePattern = /`[^`]*(?:\/|\.ts|\.tsx|\.js|\.jsx|\.md|\.json|\.ya?ml|\.sh)[^`]*`|`(?:npm|bun|node|git|npx|pnpm|yarn|cargo|pytest|uv|make)\s+[^`]+`/;
const testCommandPattern = /\b(?:npm test|npm run test|bun test|pytest|cargo test|yarn test|pnpm test)\b/;

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

function sectionBody(content: string, heading: string): string | null {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedHeading}\\s*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "m");
  return content.match(pattern)?.[1]?.trim() ?? null;
}

function taskSections(content: string): string[] {
  return sectionBody(content, "## Task Waves")?.match(/^#### Task [\s\S]*?(?=^#### Task |^##\s|(?![\s\S]))/gm) || [];
}

function selectedFlow(content: string): string | null {
  const value = content.match(/\*\*Selected flow:\*\*\s*([^\n]+)/i)?.[1]?.trim().toLowerCase();
  if (!value || hasPlaceholder(value)) return null;
  return value.split(/\s+/)[0] || null;
}

function mustHaveCategory(section: string, category: "Truths" | "Artifacts" | "Key links"): string | null {
  const labels = ["Truths", "Artifacts", "Key links"].join("|");
  const pattern = new RegExp(`^${category}:\\s*\\n?([\\s\\S]*?)(?=^(${labels}):\\s*$|^(${labels}):\\s+|(?![\\s\\S]))`, "mi");
  return section.match(pattern)?.[1]?.trim() ?? null;
}

function fieldBody(task: string, field: (typeof taskFieldNames)[number]): string | null {
  const labelPattern = taskFieldNames.join("|");
  const pattern = new RegExp(`^${field}:\\s*(.*(?:\\n(?!(${labelPattern}):\\s*$|(${labelPattern}):\\s+|#{2,4}\\s).*)*)`, "m");
  const match = task.match(pattern);
  if (!match) return null;
  return match[1].trim();
}

function taskType(task: string): string | null {
  return fieldBody(task, "Type")?.split(/\s+/)[0]?.trim() || null;
}

function hasPlaceholder(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return (
    /\[(?![ xX]\])([^\]\n]+)\]/.test(trimmed) ||
    /\b(?:TBD|TODO)\b/i.test(trimmed) ||
    /None\s*\/\s*\[Task or wave dependency\.\]/i.test(trimmed) ||
    /^[-*]\s*$/m.test(trimmed)
  );
}

function verificationLines(verify: string): string[] {
  return verify
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("```"));
}

function hasExplicitMissingTestMarker(verify: string): boolean {
  return /\bMISSING\s+-\s+.+\bcreates?\b.+\bfirst\b/i.test(verify);
}

function hasConcreteVerification(verify: string): boolean {
  if (hasPlaceholder(verify)) return false;
  const fencedBlocks = [...verify.matchAll(/```(?:bash|sh|shell)?\s*\n([\s\S]*?)```/gi)];
  if (fencedBlocks.some((block) => verificationLines(block[1]).some((line) => commandPrefixPattern.test(line)))) {
    return true;
  }
  return verificationLines(verify).some((line) => commandPrefixPattern.test(line));
}

function hasHumanVerification(verify: string): boolean {
  if (hasPlaceholder(verify)) return false;
  const words = verify.split(/\s+/).filter(Boolean);
  return words.length >= 6;
}

function hasExplicitCheckpointAction(action: string): boolean {
  if (hasPlaceholder(action)) return false;
  return /\bAsk (?:Orvo|the user)\b/i.test(action);
}

function hasPathLikeToken(text: string): boolean {
  return pathLikePattern.test(text);
}

function hasFileChangingTask(tasks: string[]): boolean {
  return tasks.some((task) => {
    const files = fieldBody(task, "Files");
    return Boolean(files && hasPathLikeToken(files) && !/\b(no edits|no code changes|no file changes)\b/i.test(files));
  });
}

function hasExplicitNoKeyLinks(text: string): boolean {
  return /\bNone\s+-\s+no cross-file\/runtime link for this trivial task\b/i.test(text);
}

function hasRealKeyLink(text: string): boolean {
  return hasPathLikeToken(text) && /(?:->|→)/.test(text);
}

function hasTestReference(text: string): boolean {
  return /\btests?\b|\/tests?\/|\.test\.|\.spec\./i.test(text);
}

function taskIsCheckpoint(task: string): boolean {
  return taskType(task)?.startsWith("checkpoint:") || false;
}

function taskIsTestFocused(task: string): boolean {
  const files = fieldBody(task, "Files") || "";
  const action = fieldBody(task, "Action") || "";
  return hasTestReference(`${files}\n${action}`) && /\b(?:create|add|update|write|failing|red)\b/i.test(action);
}

function hasConcreteTestCommand(task: string): boolean {
  const verify = fieldBody(task, "Verify") || "";
  return hasConcreteVerification(verify) && testCommandPattern.test(verify);
}

function hasTddSequencing(content: string): boolean {
  return /\bred\b/i.test(content) && /\bgreen\b/i.test(content) && /\brefactor\b/i.test(content);
}

function validateMustHaves(content: string, tasks: string[], errors: string[]): void {
  const section = sectionBody(content, "## Must Haves");
  if (!section) return;

  const categories = ["Truths", "Artifacts", "Key links"] as const;
  const values = new Map<(typeof categories)[number], string>();

  for (const category of categories) {
    const body = mustHaveCategory(section, category);
    if (body === null) {
      errors.push(`Must Haves missing ${category}:`);
      continue;
    }
    values.set(category, body);
    if (hasPlaceholder(body)) {
      errors.push(`Must Haves ${category}: has placeholder or empty content`);
    }
  }

  const artifacts = values.get("Artifacts") || "";
  if (hasFileChangingTask(tasks) && artifacts && !hasPlaceholder(artifacts) && !hasPathLikeToken(artifacts)) {
    errors.push("Must Haves Artifacts: must include at least one path-like artifact for file-changing plans");
  }

  const flow = selectedFlow(content);
  const keyLinks = values.get("Key links") || "";
  if (flow && ["medium", "complex", "tdd"].includes(flow) && !hasPlaceholder(keyLinks) && !hasRealKeyLink(keyLinks)) {
    errors.push(`Must Haves Key links: must include real key links for ${flow} plans`);
  }
}

function validateTddPlan(content: string, tasks: string[], errors: string[]): void {
  if (selectedFlow(content) !== "tdd") return;

  if (!hasTddSequencing(content)) {
    errors.push("TDD plans must include red/green/refactor sequencing");
  }

  if (!tasks.some((task) => hasTestReference(`${fieldBody(task, "Files") || ""}\n${fieldBody(task, "Action") || ""}`))) {
    errors.push("TDD plans must include a task that creates or updates a test");
  }

  const firstAutoTask = tasks.find((task) => !taskIsCheckpoint(task));
  if (!firstAutoTask || !taskIsTestFocused(firstAutoTask)) {
    errors.push("TDD plans must start with a test-focused non-checkpoint task");
  }

  if (!tasks.some((task) => hasConcreteTestCommand(task))) {
    errors.push("TDD plans must include a concrete test verification command");
  }
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

  const tasks = taskSections(content);
  if (tasks.length === 0) {
    errors.push("Missing task sections");
  }

  validateMustHaves(content, tasks, errors);
  validateTddPlan(content, tasks, errors);

  for (const [index, task] of tasks.entries()) {
    const label = `Task ${index + 1}`;
    for (const field of requiredTaskFields) {
      if (!task.includes(field)) {
        errors.push(`${label} missing ${field}`);
        continue;
      }

      const body = fieldBody(task, field.slice(0, -1) as (typeof taskFieldNames)[number]);
      if (body === null || hasPlaceholder(body)) {
        errors.push(`${label} has placeholder or empty ${field}`);
      }
    }

    const type = taskType(task);
    if (type && !approvedTaskTypes.has(type)) {
      errors.push(`${label} has unsupported Type: ${type}`);
    }

    const verify = fieldBody(task, "Verify");
    if (!verify) continue;
    if (type === "auto" && !hasConcreteVerification(verify) && !hasExplicitMissingTestMarker(verify)) {
      errors.push(`${label} Verify: for auto tasks must include a concrete command or explicit missing-test marker`);
    }
    if (type?.startsWith("checkpoint:") && !hasConcreteVerification(verify) && !hasHumanVerification(verify)) {
      errors.push(`${label} Verify: for checkpoint tasks must include a concrete command or precise human verification`);
    }

    const action = fieldBody(task, "Action");
    if (type?.startsWith("checkpoint:") && action && !hasExplicitCheckpointAction(action)) {
      errors.push(`${label} Action: for checkpoint tasks must include an explicit Orvo or user ask`);
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
