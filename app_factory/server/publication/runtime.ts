import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";

import { getAppRuntime } from "@/app_factory/runtimes";
import type { RuntimeId } from "@/app_factory/runtimes/types";
import { waitForHttpReady } from "@/app_factory/server/preview-readiness";
import {
  getPublicationRelease,
  getRunningPublicationDeployment,
  isPublishedPortReservedByAnotherProject,
  listRunningPublicationDeployments,
  updatePublicationDeployment,
} from "./repository";

type ManagedRuntime = {
  web: ChildProcess;
  worker?: ChildProcess;
  logs: string[];
  releasePath: string;
  runtimeId: RuntimeId;
  workerEntry: string | null;
  port: number;
  healthPath: string;
  stopping: boolean;
};

const globalRuntime = globalThis as typeof globalThis & {
  appFactoryPublicationRuntimes?: Map<string, ManagedRuntime>;
};
const runtimes = (globalRuntime.appFactoryPublicationRuntimes ??= new Map());

function appendLog(logs: string[], source: "web" | "worker", value: unknown) {
  logs.push(`[${source}] ${String(value)}`);
  if (logs.length > 160) logs.splice(0, logs.length - 160);
}

function processIsRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForProcessExit(pid: number, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (processIsRunning(pid) && Date.now() < deadline) {
    await delay(50);
  }
  return !processIsRunning(pid);
}

async function stopProcess(child?: ChildProcess, pid?: number | null) {
  const targetPid = child?.pid ?? pid;
  if (!targetPid || !processIsRunning(targetPid)) return true;
  try {
    process.kill(targetPid, "SIGTERM");
  } catch {
    return false;
  }
  return waitForProcessExit(targetPid);
}

function startChild(
  command: { executable: string; args: string[]; cwd: string },
  environment: NodeJS.ProcessEnv,
  logs: string[],
  source: "web" | "worker",
) {
  const child = spawn(command.executable, command.args, {
    cwd: command.cwd,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => appendLog(logs, source, chunk));
  child.stderr?.on("data", (chunk) => appendLog(logs, source, chunk));
  child.once("error", (error) => appendLog(logs, source, error.message));
  return child;
}

async function waitForWorkerReady(worker: ChildProcess, logs: string[]) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (logs.some((line) => line.includes("[worker] Enterprise worker ready"))) return;
    if (worker.exitCode !== null || worker.signalCode) {
      throw new Error(`企业 Worker 启动失败\n${logs.join("\n")}`.trim());
    }
    await delay(50);
  }
  throw new Error(`企业 Worker 启动超时\n${logs.join("\n")}`.trim());
}

async function stopManagedRuntime(projectId: string, runtime: ManagedRuntime) {
  runtime.stopping = true;
  const stopped = await Promise.all([
    stopProcess(runtime.web),
    stopProcess(runtime.worker),
  ]);
  if (runtimes.get(projectId) === runtime) runtimes.delete(projectId);
  return stopped.every(Boolean);
}

function monitorRuntime(projectId: string, runtime: ManagedRuntime) {
  const unexpectedExit = () => {
    if (runtime.stopping || runtimes.get(projectId) !== runtime) return;
    runtime.stopping = true;
    runtimes.delete(projectId);
    const deployment = getRunningPublicationDeployment(projectId);
    if (deployment) updatePublicationDeployment(deployment.id, "failed", null, null);
    void Promise.all([
      stopProcess(runtime.web),
      stopProcess(runtime.worker),
    ]);
  };
  runtime.web.once("close", unexpectedExit);
  runtime.worker?.once("close", unexpectedExit);
}

function runtimeEnvironment(
  port: number,
  isolatePlatformEnvironment = false,
): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  if (isolatePlatformEnvironment) {
    for (const key of Object.keys(environment)) {
      if (key.startsWith("APPFACTORY_")) delete environment[key];
    }
    for (const key of [
      "AGENT_HUB_BASE_URL",
      "NEXT_PUBLIC_APPFACTORY_URL",
      "DEEPSEEK_API_KEY",
      "DEEPSEEK_BASE_URL",
      "DEEPSEEK_MODEL",
      "TOWER_MATCH_API_URL",
      "TOWER_MATCH_API_KEY",
    ]) {
      delete environment[key];
    }
  }
  return {
    ...environment,
    NODE_ENV: "production",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
  } as NodeJS.ProcessEnv;
}

function isNextjsEnterpriseRelease(releasePath: string) {
  return fs.existsSync(path.join(releasePath, ".appfactory-framework.json"));
}

export async function isPortAvailable(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

export async function allocatePublishedPort(projectId: string, start = 4100) {
  for (let port = start; port < start + 500; port += 1) {
    if (!isPublishedPortReservedByAnotherProject(projectId, port) && await isPortAvailable(port)) return port;
  }
  throw new Error("没有可用的应用发布端口");
}

export async function startPublicationRuntime(
  projectId: string,
  releasePath: string,
  runtimeId: RuntimeId,
  port: number,
  healthPath: string,
  workerEntry: string | null = null,
) {
  const existing = runtimes.get(projectId);
  if (existing) {
    if (
      existing.releasePath !== releasePath
      || existing.runtimeId !== runtimeId
      || existing.port !== port
      || existing.healthPath !== healthPath
      || existing.workerEntry !== workerEntry
    ) {
      throw new Error("旧 Release 仍在运行，无法覆盖启动");
    }
    return {
      pid: existing.web.pid ?? null,
      workerPid: existing.worker?.pid ?? null,
      url: `http://localhost:${port}`,
      logs: existing.logs,
    };
  }

  const logs: string[] = [];
  const runtime = getAppRuntime(runtimeId);
  const environment = runtimeEnvironment(port, isNextjsEnterpriseRelease(releasePath));
  let worker: ChildProcess | undefined;
  let web: ChildProcess | undefined;
  let managed: ManagedRuntime | undefined;
  try {
    if (workerEntry) {
      const workerCommand = runtime.createWorkerCommand?.(releasePath, workerEntry);
      if (!workerCommand) throw new Error("当前运行时不支持企业应用 Worker");
      worker = startChild(workerCommand, environment, logs, "worker");
      await waitForWorkerReady(worker, logs);
    }
    const webCommand = runtime.createReleaseCommand(releasePath, port);
    web = startChild(webCommand, environment, logs, "web");
    managed = {
      web,
      worker,
      logs,
      releasePath,
      runtimeId,
      workerEntry,
      port,
      healthPath,
      stopping: false,
    };
    runtimes.set(projectId, managed);
    monitorRuntime(projectId, managed);
    await waitForHttpReady(
      new URL(healthPath, `http://127.0.0.1:${port}`).toString(),
      { timeoutMs: 10_000, intervalMs: 250 },
    );
    if (worker && (worker.exitCode !== null || worker.signalCode)) {
      throw new Error("企业 Worker 在健康检查前退出");
    }
    return {
      pid: web.pid ?? null,
      workerPid: worker?.pid ?? null,
      url: `http://localhost:${port}`,
      logs,
    };
  } catch (error) {
    if (managed) await stopManagedRuntime(projectId, managed);
    else {
      await Promise.all([stopProcess(web), stopProcess(worker)]);
    }
    const message = error instanceof Error ? error.message : "运行时启动失败";
    throw new Error(`${message}\n${logs.join("\n")}`.trim());
  }
}

export async function stopPublicationRuntime(
  projectId: string,
  pid?: number | null,
  workerPid?: number | null,
) {
  const runtime = runtimes.get(projectId);
  if (runtime) return stopManagedRuntime(projectId, runtime);
  const targets = [pid, workerPid].filter((value): value is number => Boolean(value));
  if (!targets.length) return false;
  const stopped = await Promise.all(targets.map((target) => stopProcess(undefined, target)));
  return stopped.every(Boolean);
}

export async function stopPublishedApplication(projectId: string) {
  const deployment = getRunningPublicationDeployment(projectId);
  if (!deployment) return;
  if (!await stopPublicationRuntime(projectId, deployment.pid, deployment.workerPid)) {
    throw new Error("已发布应用未能在 5 秒内停止，无法移除应用中心记录。");
  }
  updatePublicationDeployment(deployment.id, "stopped", null, null);
}

export async function restorePublicationRuntimes() {
  const restored: string[] = [];
  for (const deployment of listRunningPublicationDeployments()) {
    const release = getPublicationRelease(deployment.releaseId);
    if (!release) {
      updatePublicationDeployment(deployment.id, "failed", null, null);
      continue;
    }
    const url = new URL(deployment.healthPath, `http://127.0.0.1:${deployment.port}`).toString();
    const webStillRunning = Boolean(deployment.pid && processIsRunning(deployment.pid));
    const workerStillRunning = !release.workerEntry
      || Boolean(deployment.workerPid && processIsRunning(deployment.workerPid));
    if (webStillRunning && workerStillRunning) {
      try {
        await waitForHttpReady(url, { timeoutMs: 1_000, intervalMs: 100 });
        restored.push(deployment.projectId);
        continue;
      } catch {
        await stopPublicationRuntime(
          deployment.projectId,
          deployment.pid,
          deployment.workerPid,
        );
      }
    } else if (webStillRunning || deployment.workerPid) {
      await stopPublicationRuntime(
        deployment.projectId,
        deployment.pid,
        deployment.workerPid,
      );
    }
    try {
      const runtime = await startPublicationRuntime(
        deployment.projectId,
        release.artifactPath,
        release.runtimeId,
        deployment.port,
        deployment.healthPath,
        release.workerEntry,
      );
      updatePublicationDeployment(
        deployment.id,
        "running",
        runtime.pid,
        runtime.workerPid,
      );
      restored.push(deployment.projectId);
    } catch {
      updatePublicationDeployment(deployment.id, "failed", null, null);
    }
  }
  return restored;
}
