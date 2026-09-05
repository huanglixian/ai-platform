import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { getAppFactoryDatabase } from "./database";
import {
  findAvailablePort,
  waitForHttpReady,
} from "./preview-readiness";

type PreviewStatus = "starting" | "running" | "stale" | "stopped" | "error";

type ManagedPreview = {
  port: number;
  pid?: number;
  process?: ChildProcess;
  logs: string[];
  status: PreviewStatus;
  ready: Promise<void>;
  readinessController: AbortController;
};

type PreviewRegistry = {
  processes: Map<string, ManagedPreview>;
  nextPort: number;
};

const globalForPreview = globalThis as typeof globalThis & {
  appFactoryPreviewRegistry?: PreviewRegistry;
};
const registry = (globalForPreview.appFactoryPreviewRegistry ??= {
  processes: new Map(),
  nextPort: 3100,
});
const processes = registry.processes;

export class PreviewStartError extends Error {
  constructor(
    message: string,
    readonly logs: string[],
  ) {
    super(message);
    this.name = "PreviewStartError";
  }
}

function ensurePreviewTable() {
  getAppFactoryDatabase().exec(
    "CREATE TABLE IF NOT EXISTS preview_runs (project_id TEXT PRIMARY KEY, port INTEGER NOT NULL, url TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL)",
  );
}

function previewUrl(port: number) {
  return `http://localhost:${port}`;
}

function persistPreview(
  projectId: string,
  port: number,
  status: PreviewStatus,
) {
  ensurePreviewTable();
  getAppFactoryDatabase()
    .prepare(
      "INSERT INTO preview_runs (project_id,port,url,status,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(project_id) DO UPDATE SET port=excluded.port,url=excluded.url,status=excluded.status,updated_at=excluded.updated_at",
    )
    .run(
      projectId,
      port,
      previewUrl(port),
      status,
      new Date().toISOString(),
    );
}

function presentPreview(projectId: string, item: ManagedPreview) {
  return {
    projectId,
    port: item.port,
    url: previewUrl(item.port),
    status: item.status,
    logs: item.logs,
  };
}

function appendLog(logs: string[], chunk: unknown) {
  logs.push(String(chunk));
  if (logs.length > 100) logs.splice(0, logs.length - 100);
}

function processIsRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function restoreNextPreview(cwd: string) {
  try {
    const content = await fs.readFile(path.join(cwd, ".next", "dev", "lock"), "utf8");
    const lock = JSON.parse(content) as { pid?: unknown; port?: unknown };
    if (
      typeof lock.pid !== "number" ||
      !Number.isInteger(lock.pid) ||
      lock.pid <= 0 ||
      typeof lock.port !== "number" ||
      !Number.isInteger(lock.port) ||
      lock.port <= 0 ||
      !processIsRunning(lock.pid)
    ) {
      return null;
    }
    await waitForHttpReady(`http://127.0.0.1:${lock.port}`, {
      timeoutMs: 1_500,
      intervalMs: 100,
    });
    return { pid: lock.pid, port: lock.port };
  } catch {
    return null;
  }
}

export async function startPreview(projectId: string, cwd: string) {
  ensurePreviewTable();
  const existing = processes.get(projectId);
  if (existing && ["starting", "running"].includes(existing.status)) {
    try {
      await existing.ready;
      return presentPreview(projectId, existing);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      throw new PreviewStartError(`Preview 启动失败：${message}`, [
        ...existing.logs,
      ]);
    }
  }
  if (existing) processes.delete(projectId);

  const restored = await restoreNextPreview(cwd);
  if (restored) {
    const readinessController = new AbortController();
    const item: ManagedPreview = {
      ...restored,
      logs: [`已恢复现有 Preview 进程（PID ${restored.pid}）`],
      status: "running",
      readinessController,
      ready: Promise.resolve(),
    };
    processes.set(projectId, item);
    persistPreview(projectId, item.port, "running");
    return presentPreview(projectId, item);
  }

  const port = await findAvailablePort(registry.nextPort);
  registry.nextPort = port + 1;
  const logs: string[] = [];
  const readinessController = new AbortController();
  const child = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd,
    env: {
      ...process.env,
      PATH: `${process.cwd()}/node_modules/.bin:${process.env.PATH ?? ""}`,
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const item: ManagedPreview = {
    port,
    pid: child.pid,
    process: child,
    logs,
    status: "starting",
    readinessController,
    ready: waitForHttpReady(`http://127.0.0.1:${port}`, {
      signal: readinessController.signal,
    }),
  };

  child.stdout?.on("data", (chunk) => appendLog(logs, chunk));
  child.stderr?.on("data", (chunk) => appendLog(logs, chunk));
  child.once("error", (error) => {
    appendLog(logs, error.message);
    readinessController.abort(error);
  });
  child.once("close", (code) => {
    const message = `Preview 进程退出（code=${code ?? "unknown"}）`;
    readinessController.abort(new Error(message));
    if (item.status === "stopped" || item.status === "error") return;
    item.status = item.status === "running" ? "stale" : "error";
    persistPreview(projectId, port, item.status);
  });

  processes.set(projectId, item);
  persistPreview(projectId, port, "starting");

  try {
    await item.ready;
    item.status = "running";
    persistPreview(projectId, port, "running");
    return presentPreview(projectId, item);
  } catch (error) {
    item.status = "error";
    persistPreview(projectId, port, "error");
    if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
    const message = error instanceof Error ? error.message : "未知错误";
    throw new PreviewStartError(`Preview 启动失败：${message}`, [...logs]);
  }
}

export function stopPreview(projectId: string) {
  ensurePreviewTable();
  const item = processes.get(projectId);
  if (!item) return false;
  item.status = "stopped";
  item.readinessController.abort(new Error("Preview 已停止"));
  if (item.process) item.process.kill("SIGTERM");
  else if (item.pid && processIsRunning(item.pid)) process.kill(item.pid, "SIGTERM");
  processes.delete(projectId);
  persistPreview(projectId, item.port, "stopped");
  return true;
}

export function getPreview(projectId: string) {
  ensurePreviewTable();
  const item = processes.get(projectId);
  if (item) return presentPreview(projectId, item);
  const persisted = getAppFactoryDatabase()
    .prepare(
      "SELECT project_id as projectId,port,url,status FROM preview_runs WHERE project_id=?",
    )
    .get(projectId) as
    | { projectId: string; port: number; url: string; status: PreviewStatus }
    | undefined;
  if (!persisted) return null;
  return {
    ...persisted,
    status: ["starting", "running"].includes(persisted.status)
      ? "stale"
      : persisted.status,
    logs: [],
  };
}
