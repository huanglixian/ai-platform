import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { getAppFactoryDatabase } from "./database";
import {
  findAvailablePort,
  waitForHttpReady,
} from "./preview-readiness";
import {
  getPreviewWorkspacePath,
  materializeRuntimeWorkspace,
} from "./runtime-workspace";

type PreviewStatus = "starting" | "running" | "stale" | "stopped" | "error";

type ManagedPreview = {
  workspacePath: string;
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

function previewEnvironment(): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.NODE_OPTIONS;
  delete environment.npm_config_node_options;
  delete environment.NPM_CONFIG_NODE_OPTIONS;
  return { ...environment, NODE_ENV: "development" };
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

async function readPreviewLock(workspacePath: string) {
  try {
    const content = await fs.readFile(path.join(workspacePath, ".next", "dev", "lock"), "utf8");
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
    return { pid: lock.pid, port: lock.port };
  } catch {
    return null;
  }
}

async function restorePreview(workspacePath: string) {
  const lock = await readPreviewLock(workspacePath);
  if (!lock) return null;
  try {
    await waitForHttpReady(`http://127.0.0.1:${lock.port}`, {
      timeoutMs: 1_500,
      intervalMs: 100,
      requestMethod: "GET",
    });
    return lock;
  } catch {
    return null;
  }
}

export async function startPreview(projectId: string, sourceWorkspacePath: string) {
  ensurePreviewTable();
  const workspacePath = getPreviewWorkspacePath(projectId);
  const existing = processes.get(projectId);
  if (existing?.workspacePath === workspacePath && ["starting", "running"].includes(existing.status)) {
    try {
      if (existing.status === "starting") {
        await existing.ready;
      } else {
        await waitForHttpReady(`http://127.0.0.1:${existing.port}`, {
          signal: existing.readinessController.signal,
          requestMethod: "GET",
        });
      }
      return presentPreview(projectId, existing);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      throw new PreviewStartError(`Preview 启动失败：${message}`, [
        ...existing.logs,
      ]);
    }
  }
  if (existing && !await stopPreview(projectId)) {
    throw new PreviewStartError("现有 Preview 未能停止，请稍后重试", [...existing.logs]);
  }

  const restored = await restorePreview(workspacePath);
  if (restored) {
    const readinessController = new AbortController();
    const item: ManagedPreview = {
      ...restored,
      workspacePath,
      logs: [`已恢复现有 Preview 进程（PID ${restored.pid}）`],
      status: "running",
      readinessController,
      ready: Promise.resolve(),
    };
    processes.set(projectId, item);
    persistPreview(projectId, item.port, "running");
    return presentPreview(projectId, item);
  }

  const staleLock = await readPreviewLock(workspacePath);
  if (staleLock) {
    processes.set(projectId, {
      ...staleLock,
      workspacePath,
      logs: [`正在停止未就绪的遗留 Preview 进程（PID ${staleLock.pid}）`],
      status: "stale",
      readinessController: new AbortController(),
      ready: Promise.resolve(),
    });
    if (!await stopPreview(projectId)) {
      throw new PreviewStartError("遗留 Preview 未能停止，请稍后重试", []);
    }
  }

  try {
    await materializeRuntimeWorkspace(sourceWorkspacePath, workspacePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    throw new PreviewStartError(`Preview 工作区准备失败：${message}`, []);
  }

  const port = await findAvailablePort(registry.nextPort);
  registry.nextPort = port + 1;
  const logs: string[] = [];
  const readinessController = new AbortController();
  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "dev", "--port", String(port)], {
    cwd: workspacePath,
    env: previewEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const item: ManagedPreview = {
    workspacePath,
    port,
    pid: child.pid,
    process: child,
    logs,
    status: "starting",
    readinessController,
    ready: waitForHttpReady(`http://127.0.0.1:${port}`, {
      signal: readinessController.signal,
      requestMethod: "GET",
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

async function waitForProcessExit(pid: number, timeoutMs = 3_000) {
  const deadline = Date.now() + timeoutMs;
  while (processIsRunning(pid) && Date.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
  return !processIsRunning(pid);
}

export async function stopPreview(projectId: string) {
  ensurePreviewTable();
  let item = processes.get(projectId);
  if (!item) {
    const workspacePath = getPreviewWorkspacePath(projectId);
    const lock = await readPreviewLock(workspacePath);
    if (!lock) return false;
    item = {
      ...lock,
      workspacePath,
      logs: [`已接管遗留 Preview 进程（PID ${lock.pid}）`],
      status: "running",
      readinessController: new AbortController(),
      ready: Promise.resolve(),
    };
    processes.set(projectId, item);
  }
  item.status = "stopped";
  item.readinessController.abort(new Error("Preview 已停止"));
  const pid = item.process?.pid ?? item.pid;
  if (pid && processIsRunning(pid)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      item.status = "error";
      persistPreview(projectId, item.port, "error");
      return false;
    }
    if (!await waitForProcessExit(pid)) {
      appendLog(item.logs, `Preview 进程未响应 SIGTERM，正在强制停止（PID ${pid}）`);
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        item.status = "error";
        persistPreview(projectId, item.port, "error");
        return false;
      }
      if (!await waitForProcessExit(pid)) {
        item.status = "error";
        persistPreview(projectId, item.port, "error");
        return false;
      }
    }
  }
  processes.delete(projectId);
  persistPreview(projectId, item.port, "stopped");
  return true;
}

export async function invalidatePreview(projectId: string) {
  await stopPreview(projectId);
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
