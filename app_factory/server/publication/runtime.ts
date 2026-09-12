import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";

import { waitForHttpReady } from "@/app_factory/server/preview-readiness";
import {
  getRunningPublicationDeployment,
  getPublicationRelease,
  isPublishedPortReservedByAnotherProject,
  listRunningPublicationDeployments,
  updatePublicationDeployment,
} from "./repository";
import { getAppRuntime } from "@/app_factory/runtimes";
import type { RuntimeId } from "@/app_factory/runtimes/types";

type ManagedRuntime = {
  process: ChildProcess;
  logs: string[];
  releasePath: string;
  runtimeId: RuntimeId;
  port: number;
  healthPath: string;
};

const globalRuntime = globalThis as typeof globalThis & {
  appFactoryPublicationRuntimes?: Map<string, ManagedRuntime>;
};
const runtimes = (globalRuntime.appFactoryPublicationRuntimes ??= new Map());

function appendLog(logs: string[], value: unknown) {
  logs.push(String(value));
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

function waitForProcessExit(pid: number, timeoutMs = 5_000) {
  return new Promise<boolean>((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const timer = setInterval(() => {
      if (!processIsRunning(pid)) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() >= deadline) {
        clearInterval(timer);
        resolve(false);
      }
    }, 50);
  });
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
) {
  const existing = runtimes.get(projectId);
  if (existing) {
    if (existing.releasePath !== releasePath || existing.runtimeId !== runtimeId || existing.port !== port || existing.healthPath !== healthPath) {
      throw new Error("旧 Release 仍在运行，无法覆盖启动");
    }
    return { pid: existing.process.pid ?? null, url: `http://localhost:${port}`, logs: existing.logs };
  }
  const logs: string[] = [];
  const command = getAppRuntime(runtimeId).createReleaseCommand(releasePath, port);
  const child = spawn(command.executable, command.args, {
    cwd: command.cwd,
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => appendLog(logs, chunk));
  child.stderr?.on("data", (chunk) => appendLog(logs, chunk));
  child.once("error", (error) => appendLog(logs, error.message));
  child.once("close", () => runtimes.delete(projectId));
  runtimes.set(projectId, { process: child, logs, releasePath, runtimeId, port, healthPath });
  try {
    await waitForHttpReady(
      new URL(healthPath, `http://127.0.0.1:${port}`).toString(),
      { timeoutMs: 10_000, intervalMs: 250 },
    );
    return { pid: child.pid ?? null, url: `http://localhost:${port}`, logs };
  } catch (error) {
    await stopPublicationRuntime(projectId, child.pid);
    const message = error instanceof Error ? error.message : "运行时启动失败";
    throw new Error(`${message}\n${logs.join("\n")}`.trim());
  }
}

export async function stopPublicationRuntime(projectId: string, pid?: number | null) {
  const runtime = runtimes.get(projectId);
  const targetPid = runtime?.process.pid ?? pid;
  if (!targetPid) return false;
  if (!processIsRunning(targetPid)) {
    if (runtimes.get(projectId) === runtime) runtimes.delete(projectId);
    return true;
  }
  try {
    process.kill(targetPid, "SIGTERM");
  } catch {
    return false;
  }
  const stopped = await waitForProcessExit(targetPid);
  if (stopped && runtimes.get(projectId) === runtime) runtimes.delete(projectId);
  return stopped;
}

export async function stopPublishedApplication(projectId: string) {
  const deployment = getRunningPublicationDeployment(projectId);
  if (!deployment) return;
  if (!await stopPublicationRuntime(projectId, deployment.pid)) {
    throw new Error("已发布应用未能在 5 秒内停止，无法移除应用中心记录。");
  }
  updatePublicationDeployment(deployment.id, "stopped", null);
}

export async function restorePublicationRuntimes() {
  const restored: string[] = [];
  for (const deployment of listRunningPublicationDeployments()) {
    const url = new URL(deployment.healthPath, `http://127.0.0.1:${deployment.port}`).toString();
    if (deployment.pid && processIsRunning(deployment.pid)) {
      try {
        await waitForHttpReady(url, { timeoutMs: 1_000, intervalMs: 100 });
        restored.push(deployment.projectId);
        continue;
      } catch {
        updatePublicationDeployment(deployment.id, "failed", null);
      }
    }
    const release = getPublicationRelease(deployment.releaseId);
    if (!release) {
      updatePublicationDeployment(deployment.id, "failed", null);
      continue;
    }
    const runtime = await startPublicationRuntime(
      deployment.projectId,
      release.artifactPath,
      release.runtimeId,
      deployment.port,
      deployment.healthPath,
    );
    updatePublicationDeployment(deployment.id, "running", runtime.pid);
    restored.push(deployment.projectId);
  }
  return restored;
}
