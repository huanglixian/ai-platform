import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export interface WorkspaceRuntime {
  readFile(relative: string): Promise<string>;
  writeFile(relative: string, content: string): Promise<void>;
  runCommand(
    command: string,
    timeoutMs?: number,
  ): Promise<{ code: number | null; stdout: string; stderr: string }>;
}

const ignoredWorkspaceDirectories = new Set([
  "node_modules",
  ".next",
  "out",
  "build",
  ".turbo",
  ".cache",
]);

export function isWorkspaceEntryVisible(relativePath: string) {
  return relativePath
    .split(/[\\/]+/)
    .filter(Boolean)
    .every(
      (segment) =>
        !segment.startsWith(".") && !ignoredWorkspaceDirectories.has(segment),
    );
}

export function resolveWorkspacePath(root: string, relative: string) {
  const base = path.resolve(root);
  const target = path.resolve(base, relative);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
    throw new Error("Workspace path is outside project root");
  }
  return target;
}

export async function readWorkspaceFile(root: string, relative: string) {
  return fs.readFile(resolveWorkspacePath(root, relative), "utf8");
}

export async function writeWorkspaceFile(
  root: string,
  relative: string,
  content: string,
) {
  const target = resolveWorkspacePath(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, "utf8");
}

export function runWorkspaceCommand(
  root: string,
  command: string,
  timeoutMs = 30_000,
  options: { nodeEnv?: string } = {},
) {
  if (/(^|\s)(rm\s+-rf|sudo|mkfs|shutdown|docker\s+run)/i.test(command)) {
    throw new Error("Command rejected by workspace policy");
  }
  return new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    const child = spawn("/bin/sh", ["-lc", command], {
      cwd: path.resolve(root),
      env: {
        PATH: `${path.join(process.cwd(), "node_modules/.bin")}:${process.env.PATH ?? ""}`,
        NODE_ENV: options.nodeEnv ?? process.env.NODE_ENV ?? "development",
      } as NodeJS.ProcessEnv,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Command timed out"));
    }, timeoutMs);
    child.stdout.on("data", (data) => {
      stdout += data.toString();
      if (stdout.length > 200_000) child.kill("SIGTERM");
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
      if (stderr.length > 200_000) child.kill("SIGTERM");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

export function createLocalWorkspaceRuntime(root: string): WorkspaceRuntime {
  return {
    readFile: (relative) => readWorkspaceFile(root, relative),
    writeFile: (relative, content) => writeWorkspaceFile(root, relative, content),
    runCommand: (command, timeoutMs) => runWorkspaceCommand(root, command, timeoutMs),
  };
}
