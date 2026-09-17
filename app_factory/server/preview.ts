import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { getAppFactoryDatabase } from "./database";
import {
  findAvailablePort,
  isPortAvailable,
  waitForHttpReady,
} from "./preview-readiness";
import {
  getPreviewWorkspacePath,
  materializeRuntimeWorkspace,
  seedWorkspaceRuntimeDependencies,
} from "./runtime-workspace";
import { getAppRuntime } from "@/app_factory/runtimes";
import type { RuntimeId } from "@/app_factory/runtimes/types";

type PreviewStatus = "starting" | "running" | "stale" | "stopped" | "error";

type PersistedPreview = {
  projectId: string;
  port: number;
  url: string;
  status: PreviewStatus;
  updatedAt: string;
};

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
  reclaimer?: NodeJS.Timeout;
};

const PREVIEW_IDLE_TIMEOUT_MS = 30 * 60 * 1_000;
const PREVIEW_RECLAIM_INTERVAL_MS = 60 * 1_000;

const globalForPreview = globalThis as typeof globalThis & {
  appFactoryPreviewRegistry?: PreviewRegistry;
};
const registry: PreviewRegistry = (globalForPreview.appFactoryPreviewRegistry ??= {
  processes: new Map<string, ManagedPreview>(),
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
  delete environment.TURBOPACK;
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

function getPersistedPreview(projectId: string) {
  ensurePreviewTable();
  return getAppFactoryDatabase()
    .prepare(
      "SELECT project_id as projectId,port,url,status,updated_at as updatedAt FROM preview_runs WHERE project_id=?",
    )
    .get(projectId) as PersistedPreview | undefined;
}

function listActivePreviewProjectIds(excludedProjectId?: string) {
  ensurePreviewTable();
  const query = excludedProjectId
    ? "SELECT project_id as projectId FROM preview_runs WHERE project_id<>? AND status IN ('starting','running')"
    : "SELECT project_id as projectId FROM preview_runs WHERE status IN ('starting','running')";
  return (excludedProjectId
    ? getAppFactoryDatabase().prepare(query).all(excludedProjectId)
    : getAppFactoryDatabase().prepare(query).all()) as { projectId: string }[];
}

function listExpiredPreviewProjectIds() {
  ensurePreviewTable();
  const expiresAt = new Date(Date.now() - PREVIEW_IDLE_TIMEOUT_MS).toISOString();
  return getAppFactoryDatabase()
    .prepare(
      "SELECT project_id as projectId FROM preview_runs WHERE status IN ('starting','running') AND updated_at<=?",
    )
    .all(expiresAt) as { projectId: string }[];
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

async function stopOtherPreviews(projectId: string) {
  for (const preview of listActivePreviewProjectIds(projectId)) {
    if (!await stopPreview(preview.projectId)) {
      throw new PreviewStartError("现有 Preview 未能停止，请稍后重试", []);
    }
  }
}

async function selectPreviewPort(preferredPort?: number) {
  if (preferredPort && await isPortAvailable(preferredPort)) return preferredPort;
  const port = await findAvailablePort(registry.nextPort);
  registry.nextPort = port + 1;
  return port;
}

export async function startPreview(
  projectId: string,
  sourceWorkspacePath: string,
  runtimeId: RuntimeId,
  preferredPort?: number,
) {
  ensurePreviewTable();
  await stopOtherPreviews(projectId);
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
      persistPreview(projectId, existing.port, "running");
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
    const enterpriseFramework = path.join(workspacePath, ".appfactory-framework.json");
    if (await fs.access(enterpriseFramework).then(() => true).catch(() => false)) {
      seedWorkspaceRuntimeDependencies(workspacePath, { includeToolchain: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    throw new PreviewStartError(`Preview 工作区准备失败：${message}`, []);
  }

  const port = await selectPreviewPort(
    preferredPort ?? getPersistedPreview(projectId)?.port,
  );
  const logs: string[] = [];
  const readinessController = new AbortController();
  const command = getAppRuntime(runtimeId).createPreviewCommand(workspacePath, port);
  const child = spawn(command.executable, command.args, {
    cwd: command.cwd,
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
    const persisted = getPersistedPreview(projectId);
    const workspacePath = getPreviewWorkspacePath(projectId);
    const lock = await readPreviewLock(workspacePath);
    if (!lock) {
      if (!persisted || ["stopped", "error"].includes(persisted.status)) return false;
      persistPreview(projectId, persisted.port, "stopped");
      return true;
    }
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

export async function restartActivePreview(
  projectId: string,
  sourceWorkspacePath: string,
  runtimeId: RuntimeId,
) {
  const preview = getPreview(projectId);
  if (!preview || ["stopped", "error"].includes(preview.status)) return null;
  if (!await stopPreview(projectId)) {
    console.error(`AppFactory Preview 重建失败：无法停止 ${projectId}`);
    return null;
  }
  try {
    return await startPreview(projectId, sourceWorkspacePath, runtimeId, preview.port);
  } catch (error) {
    console.error(`AppFactory Preview 重建失败：${projectId}`, error);
    return null;
  }
}

export function getPreview(projectId: string) {
  ensurePreviewTable();
  const item = processes.get(projectId);
  if (item) return presentPreview(projectId, item);
  const persisted = getPersistedPreview(projectId);
  if (!persisted) return null;
  return {
    projectId: persisted.projectId,
    port: persisted.port,
    url: persisted.url,
    status: ["starting", "running"].includes(persisted.status)
      ? "stale"
      : persisted.status,
    logs: [],
  };
}

async function reclaimExpiredPreviews() {
  for (const preview of listExpiredPreviewProjectIds()) {
    await stopPreview(preview.projectId);
  }
}

function ensurePreviewReclaimer() {
  if (registry.reclaimer) return;
  const reclaim = () => {
    void reclaimExpiredPreviews().catch((error: unknown) => {
      console.error("AppFactory Preview 自动回收失败", error);
    });
  };
  registry.reclaimer = setInterval(reclaim, PREVIEW_RECLAIM_INTERVAL_MS);
  registry.reclaimer.unref();
  reclaim();
}

ensurePreviewReclaimer();
