import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { readApplicationManifest } from "@/app_factory/contracts/validator";
import {
  getEnterprisePreviewBuildStage,
  prepareEnterprisePreview,
  pruneEnterprisePreviewBuilds,
  type PreviewArtifact,
} from "./enterprise-preview-build";
import { getAppFactoryDatabase } from "./database";
import {
  findAvailablePort,
  isPortAvailable,
  waitForHttpReady,
} from "./preview-readiness";
import {
  getPreviewWorkspacePath,
  materializeRuntimeWorkspace,
} from "./runtime-workspace";
import { migrateNextjsEnterpriseWorkspace } from "./nextjs-enterprise-migrations";
import { assertNextjsEnterpriseRuntimeEnvironmentConfigured } from "@/app_factory/nextjs-enterprise-framework";
import { getAppRuntime } from "@/app_factory/runtimes";
import { isolateEnterpriseRuntimeEnvironment } from "./runtime-environment";
import type { RuntimeId } from "@/app_factory/runtimes/types";

type PreviewStatus = "starting" | "running" | "stale" | "stopped" | "error";

type PersistedPreview = {
  projectId: string;
  port: number;
  url: string;
  status: PreviewStatus;
  pid: number | null;
  revision: string | null;
  updatedAt: string;
};

type ManagedPreview = {
  workspacePath: string;
  port: number;
  pid?: number;
  process?: ChildProcess;
  logs: string[];
  status: PreviewStatus;
  revision?: string;
  ready: Promise<void>;
  readinessController: AbortController;
};

type PreviewRegistry = {
  processes: Map<string, ManagedPreview>;
  starts?: Map<string, Promise<ReturnType<typeof presentPreview>>>;
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
  starts: new Map<string, Promise<ReturnType<typeof presentPreview>>>(),
  nextPort: 3100,
});
const processes = registry.processes;
const starts = (registry.starts ??= new Map<string, Promise<ReturnType<typeof presentPreview>>>());

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
  const database = getAppFactoryDatabase();
  database.exec(
    "CREATE TABLE IF NOT EXISTS preview_runs (project_id TEXT PRIMARY KEY, port INTEGER NOT NULL, url TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL, pid INTEGER, revision TEXT)",
  );
  const columns = database.prepare("PRAGMA table_info(preview_runs)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "pid")) database.exec("ALTER TABLE preview_runs ADD COLUMN pid INTEGER");
  if (!columns.some((column) => column.name === "revision")) database.exec("ALTER TABLE preview_runs ADD COLUMN revision TEXT");
}

function previewUrl(port: number) {
  return `http://localhost:${port}`;
}

function previewEnvironment(port: number, enterprise: boolean): NodeJS.ProcessEnv {
  const environment = enterprise
    ? isolateEnterpriseRuntimeEnvironment(process.env)
    : { ...process.env };
  delete environment.NODE_OPTIONS;
  delete environment.npm_config_node_options;
  delete environment.NPM_CONFIG_NODE_OPTIONS;
  delete environment.TURBOPACK;
  return {
    ...environment,
    NODE_ENV: enterprise ? "production" : "development",
    ...(enterprise ? { PORT: String(port), HOSTNAME: "127.0.0.1" } : {}),
  };
}

function persistPreview(
  projectId: string,
  port: number,
  status: PreviewStatus,
  pid: number | null = null,
  revision: string | null = null,
) {
  ensurePreviewTable();
  getAppFactoryDatabase()
    .prepare(
      "INSERT INTO preview_runs (project_id,port,url,status,updated_at,pid,revision) VALUES (?,?,?,?,?,?,?) ON CONFLICT(project_id) DO UPDATE SET port=excluded.port,url=excluded.url,status=excluded.status,updated_at=excluded.updated_at,pid=excluded.pid,revision=excluded.revision",
    )
    .run(
      projectId,
      port,
      previewUrl(port),
      status,
      new Date().toISOString(),
      pid,
      revision,
    );
}

function getPersistedPreview(projectId: string) {
  ensurePreviewTable();
  return getAppFactoryDatabase()
    .prepare(
      "SELECT project_id as projectId,port,url,status,pid,revision,updated_at as updatedAt FROM preview_runs WHERE project_id=?",
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
    buildStage: getEnterprisePreviewBuildStage(projectId),
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

function previewHealthUrl(port: number, healthPath: string) {
  const base = new URL(`http://127.0.0.1:${port}`);
  const target = new URL(healthPath, base);
  if (target.origin !== base.origin) throw new Error("Preview 健康检查必须使用站内路径");
  return target.toString();
}

async function restoreEnterprisePreview(projectId: string, artifact: PreviewArtifact, healthPath: string) {
  const persisted = getPersistedPreview(projectId);
  if (
    !persisted?.pid || persisted.revision !== artifact.revision
    || !["starting", "running"].includes(persisted.status)
    || !processIsRunning(persisted.pid)
  ) return null;
  try {
    await waitForHttpReady(previewHealthUrl(persisted.port, healthPath), {
      timeoutMs: 1_500,
      intervalMs: 100,
      requestMethod: "GET",
    });
    return { pid: persisted.pid, port: persisted.port };
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

async function hasEnterpriseFramework(workspacePath: string) {
  return await fs.access(path.join(workspacePath, ".appfactory-framework.json"))
    .then(() => true)
    .catch(() => false);
}

function previewStartError(prefix: string, error: unknown) {
  const message = error instanceof Error ? error.message : "未知错误";
  return new PreviewStartError(`${prefix}：${message}`, []);
}

async function startPreviewInternal(
  projectId: string,
  sourceWorkspacePath: string,
  runtimeId: RuntimeId,
  preferredPort?: number,
) {
  const enterprise = await hasEnterpriseFramework(sourceWorkspacePath);
  let artifact: PreviewArtifact | null = null;
  let healthPath = "/";
  if (enterprise) {
    try {
      assertNextjsEnterpriseRuntimeEnvironmentConfigured();
      const manifest = await readApplicationManifest(sourceWorkspacePath);
      if (!manifest.healthPath.startsWith("/") || manifest.healthPath.startsWith("//") || /[\s?#]/.test(manifest.healthPath)) {
        throw new Error("企业应用 app.yaml 需要有效的 healthPath");
      }
      healthPath = manifest.healthPath;
      previewHealthUrl(3100, healthPath);
      artifact = await prepareEnterprisePreview(projectId, sourceWorkspacePath);
    } catch (error) {
      throw previewStartError("企业应用 Preview 准备失败", error);
    }
  }

  ensurePreviewTable();
  const workspacePath = artifact?.releasePath ?? getPreviewWorkspacePath(projectId);
  const existing = processes.get(projectId);
  if (existing?.workspacePath === workspacePath && ["starting", "running"].includes(existing.status)) {
    try {
      if (existing.status === "starting") {
        await existing.ready;
      } else {
        await waitForHttpReady(previewHealthUrl(existing.port, healthPath), {
          signal: existing.readinessController.signal,
          requestMethod: "GET",
        });
      }
      persistPreview(projectId, existing.port, "running", existing.pid ?? null, existing.revision ?? null);
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

  const restored = artifact
    ? await restoreEnterprisePreview(projectId, artifact, healthPath)
    : await restorePreview(workspacePath);
  if (restored) {
    const readinessController = new AbortController();
    const item: ManagedPreview = {
      ...restored,
      workspacePath,
      revision: artifact?.revision,
      logs: [`已恢复现有 Preview 进程（PID ${restored.pid}）`],
      status: "running",
      readinessController,
      ready: Promise.resolve(),
    };
    processes.set(projectId, item);
    persistPreview(projectId, item.port, "running", item.pid ?? null, item.revision ?? null);
    return presentPreview(projectId, item);
  }

  const persisted = getPersistedPreview(projectId);
  if (artifact && persisted?.pid && ["starting", "running", "stale"].includes(persisted.status)) {
    if (!await stopPreview(projectId)) {
      throw new PreviewStartError("遗留 Preview 未能停止，请稍后重试", []);
    }
  }

  const staleLock = await readPreviewLock(artifact ? getPreviewWorkspacePath(projectId) : workspacePath);
  if (staleLock) {
    processes.set(projectId, {
      ...staleLock,
      workspacePath: artifact ? getPreviewWorkspacePath(projectId) : workspacePath,
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
    if (artifact) {
      await fs.rm(getPreviewWorkspacePath(projectId), { recursive: true, force: true });
      await migrateNextjsEnterpriseWorkspace(workspacePath, runtimeId, {
        nodeEnv: "production",
      });
    } else {
      await materializeRuntimeWorkspace(sourceWorkspacePath, workspacePath);
    }
  } catch (error) {
    throw previewStartError("Preview 工作区准备失败", error);
  }

  await stopOtherPreviews(projectId);

  const port = await selectPreviewPort(
    preferredPort ?? getPersistedPreview(projectId)?.port,
  );
  const logs: string[] = [];
  const readinessController = new AbortController();
  const runtime = getAppRuntime(runtimeId);
  const command = artifact
    ? runtime.createReleaseCommand(workspacePath, port)
    : runtime.createPreviewCommand(workspacePath, port);
  const child = spawn(command.executable, command.args, {
    cwd: command.cwd,
    env: previewEnvironment(port, enterprise),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const item: ManagedPreview = {
    workspacePath,
    port,
    pid: child.pid,
    process: child,
    logs,
    status: "starting",
    revision: artifact?.revision,
    readinessController,
    ready: waitForHttpReady(previewHealthUrl(port, healthPath), {
      signal: readinessController.signal,
      requestMethod: "GET",
      timeoutMs: artifact ? 10_000 : 20_000,
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
    persistPreview(projectId, port, item.status, item.pid ?? null, item.revision ?? null);
  });

  processes.set(projectId, item);
  persistPreview(projectId, port, "starting", item.pid ?? null, item.revision ?? null);

  try {
    await item.ready;
    item.status = "running";
    persistPreview(projectId, port, "running", item.pid ?? null, item.revision ?? null);
    if (artifact) {
      void pruneEnterprisePreviewBuilds(projectId, sourceWorkspacePath, artifact.revision).catch((error: unknown) => {
        console.error(`AppFactory Preview 旧构建清理失败：${projectId}`, error);
      });
    }
    return presentPreview(projectId, item);
  } catch (error) {
    item.status = "error";
    persistPreview(projectId, port, "error", item.pid ?? null, item.revision ?? null);
    if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
    const message = error instanceof Error ? error.message : "未知错误";
    throw new PreviewStartError(`Preview 启动失败：${message}`, [...logs]);
  }
}

export function startPreview(
  projectId: string,
  sourceWorkspacePath: string,
  runtimeId: RuntimeId,
  preferredPort?: number,
) {
  const active = starts.get(projectId);
  const task = active
    ? active.catch(() => undefined).then(() => startPreviewInternal(projectId, sourceWorkspacePath, runtimeId, preferredPort))
    : startPreviewInternal(projectId, sourceWorkspacePath, runtimeId, preferredPort);
  starts.set(projectId, task);
  void task.then(
    () => { if (starts.get(projectId) === task) starts.delete(projectId); },
    () => { if (starts.get(projectId) === task) starts.delete(projectId); },
  );
  return task;
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
    const legacyWorkspacePath = getPreviewWorkspacePath(projectId);
    const lock = persisted?.pid && ["starting", "running", "stale"].includes(persisted.status) && processIsRunning(persisted.pid)
      ? { pid: persisted.pid, port: persisted.port }
      : await readPreviewLock(legacyWorkspacePath);
    if (!lock) {
      if (!persisted || ["stopped", "error"].includes(persisted.status)) return false;
      persistPreview(projectId, persisted.port, "stopped");
      return true;
    }
    item = {
      ...lock,
      workspacePath: legacyWorkspacePath,
      revision: persisted?.revision ?? undefined,
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
      persistPreview(projectId, item.port, "error", item.pid ?? null, item.revision ?? null);
      return false;
    }
    if (!await waitForProcessExit(pid)) {
      appendLog(item.logs, `Preview 进程未响应 SIGTERM，正在强制停止（PID ${pid}）`);
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        item.status = "error";
        persistPreview(projectId, item.port, "error", item.pid ?? null, item.revision ?? null);
        return false;
      }
      if (!await waitForProcessExit(pid)) {
        item.status = "error";
        persistPreview(projectId, item.port, "error", item.pid ?? null, item.revision ?? null);
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
  const enterprise = await hasEnterpriseFramework(sourceWorkspacePath);
  try {
    if (enterprise && (!preview || !("port" in preview) || ["stopped", "error"].includes(preview.status))) {
      const artifact = await prepareEnterprisePreview(projectId, sourceWorkspacePath);
      await pruneEnterprisePreviewBuilds(projectId, sourceWorkspacePath, artifact.revision);
      return null;
    }
    if (!preview || !("port" in preview) || ["stopped", "error"].includes(preview.status)) return null;
    if (!enterprise && !await stopPreview(projectId)) {
      console.error(`AppFactory Preview 重建失败：无法停止 ${projectId}`);
      return null;
    }
    return await startPreview(projectId, sourceWorkspacePath, runtimeId, preview.port);
  } catch (error) {
    console.error(`AppFactory Preview 重建失败：${projectId}`, error);
    if (enterprise && preview && "port" in preview && !["stopped", "error"].includes(preview.status)) {
      await stopPreview(projectId);
    }
    return null;
  }
}

export function getPreview(projectId: string) {
  ensurePreviewTable();
  const item = processes.get(projectId);
  if (item) return presentPreview(projectId, item);
  const persisted = getPersistedPreview(projectId);
  if (!persisted) {
    const buildStage = getEnterprisePreviewBuildStage(projectId);
    return buildStage ? { projectId, buildStage, status: "building", logs: [] } : null;
  }
  return {
    projectId: persisted.projectId,
    port: persisted.port,
    url: persisted.url,
    status: ["starting", "running"].includes(persisted.status)
      ? "stale"
      : persisted.status,
    logs: [],
    buildStage: getEnterprisePreviewBuildStage(projectId),
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
