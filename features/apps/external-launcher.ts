import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";

const START_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 500;
const EXCLUDED_PLATFORM_ENVIRONMENT_KEYS = ["PORT", "NODE_OPTIONS", "npm_config_node_options", "TS_NODE_PROJECT", "TURBOPACK"] as const;

export type ExternalLaunchInput = {
  command: string;
  url: string;
  timeoutMs?: number;
  onSpawn?: (pid: number) => void | Promise<void>;
  cwd?: string;
  environment?: NodeJS.ProcessEnv;
  logPath?: string;
  signal?: AbortSignal;
  requireNewProcess?: boolean;
};

export class ExternalLaunchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalLaunchError";
  }
}

function cleanRuntimeEnvironment() {
  const environment = { ...process.env };
  for (const key of EXCLUDED_PLATFORM_ENVIRONMENT_KEYS) delete environment[key];
  return environment;
}

function pause(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function isProcessGroupRunning(pid: number) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

export async function isUrlReady(url: string) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(1_000),
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

async function waitForUrl(url: string, timeoutMs: number, pid: number, signal?: AbortSignal) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    if (!isProcessGroupRunning(pid)) {
      throw new ExternalLaunchError("启动命令已退出，服务没有成功启动。");
    }
    if (await isUrlReady(url)) return;
    await pause(POLL_INTERVAL_MS);
  }
  throw new ExternalLaunchError("服务未在规定时间内就绪，请检查启动命令和应用配置。");
}

export async function startExternalProcess({ command, url, timeoutMs = START_TIMEOUT_MS, onSpawn, cwd, environment, logPath, signal, requireNewProcess }: ExternalLaunchInput) {
  signal?.throwIfAborted();
  if (await isUrlReady(url)) {
    if (requireNewProcess) throw new ExternalLaunchError("分配的端口已被其他服务占用，请释放该端口后重试。");
    return { pid: null, alreadyRunning: true };
  }

  const log = logPath ? fs.openSync(logPath, "a", 0o600) : null;
  let processHandle: ChildProcess;
  try {
    processHandle = spawn(cwd ? "/bin/sh" : "/bin/zsh", [cwd ? "-c" : "-lc", command], {
      detached: true,
      cwd,
      env: environment ?? cleanRuntimeEnvironment(),
      stdio: log === null ? "ignore" : ["ignore", log, log],
    });
  } finally {
    if (log !== null) fs.closeSync(log);
  }
  await new Promise<void>((resolve, reject) => {
    processHandle.once("spawn", resolve);
    processHandle.once("error", reject);
  });
  processHandle.unref();

  if (!processHandle.pid) throw new ExternalLaunchError("无法创建应用服务进程。");

  try {
    await onSpawn?.(processHandle.pid);
    await waitForUrl(url, timeoutMs, processHandle.pid, signal);
  } catch (error) {
    await stopExternalProcess(processHandle.pid);
    throw error;
  }

  return { pid: processHandle.pid, alreadyRunning: false };
}

export async function stopExternalProcess(pid: number) {
  if (!isProcessGroupRunning(pid)) return false;

  signalProcessGroup(pid, "SIGTERM");
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (!isProcessGroupRunning(pid)) return true;
    await pause(100);
  }

  signalProcessGroup(pid, "SIGKILL");
  const forceDeadline = Date.now() + 1_000;
  while (Date.now() < forceDeadline) {
    if (!isProcessGroupRunning(pid)) return true;
    await pause(100);
  }
  throw new ExternalLaunchError("服务进程组仍未退出，请稍后重试。");
}

function signalProcessGroup(pid: number, signal: NodeJS.Signals) {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}
