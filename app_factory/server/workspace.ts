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
  options: { nodeEnv?: string; signal?: AbortSignal } = {},
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
      detached: true,
      env: {
        PATH: `${path.join(process.cwd(), "node_modules/.bin")}:${process.env.PATH ?? ""}`,
        NODE_ENV: options.nodeEnv ?? process.env.NODE_ENV ?? "development",
      } as NodeJS.ProcessEnv,
    });
    let stdout = "";
    let stderr = "";
    let terminalError: Error | undefined;
    let settled = false;
    const terminateGroup = () => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
      }
    };
    const abort = () => {
      terminalError = options.signal?.reason instanceof Error
        ? options.signal.reason
        : new Error("命令已取消");
      terminateGroup();
    };
    const cleanup = () => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
    };
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    if (options.signal?.aborted) abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => {
      terminalError = new Error("Command timed out");
      terminateGroup();
    }, timeoutMs);
    child.stdout.on("data", (data) => {
      stdout += data.toString();
      if (stdout.length > 200_000) {
        terminalError = new Error("Command output exceeded limit");
        terminateGroup();
      }
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
      if (stderr.length > 200_000) {
        terminalError = new Error("Command output exceeded limit");
        terminateGroup();
      }
    });
    child.on("error", (error) => {
      settle(() => reject(error));
    });
    child.on("close", (code) => {
      if (terminalError) {
        settle(() => reject(terminalError!));
        return;
      }
      settle(() => resolve({ code, stdout, stderr }));
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
