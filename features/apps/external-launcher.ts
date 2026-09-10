import { spawn } from "node:child_process";

const START_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 500;
const INHERITED_RUNTIME_OPTIONS = ["NODE_OPTIONS", "npm_config_node_options", "TS_NODE_PROJECT"] as const;

export type ExternalLaunchInput = {
  command: string;
  url: string;
  timeoutMs?: number;
  onSpawn?: (pid: number) => void | Promise<void>;
};

export class ExternalLaunchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalLaunchError";
  }
}

function cleanRuntimeEnvironment() {
  const environment = { ...process.env };
  for (const key of INHERITED_RUNTIME_OPTIONS) delete environment[key];
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

async function waitForUrl(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isUrlReady(url)) return;
    await pause(POLL_INTERVAL_MS);
  }
  throw new ExternalLaunchError("服务未在规定时间内就绪，请检查启动命令和应用配置。");
}

export async function startExternalProcess({ command, url, timeoutMs = START_TIMEOUT_MS, onSpawn }: ExternalLaunchInput) {
  if (await isUrlReady(url)) return { pid: null, alreadyRunning: true };

  const processHandle = spawn("/bin/zsh", ["-lc", command], {
    detached: true,
    env: cleanRuntimeEnvironment(),
    stdio: "ignore",
  });
  processHandle.unref();

  if (!processHandle.pid) throw new ExternalLaunchError("无法创建应用服务进程。");

  await onSpawn?.(processHandle.pid);

  try {
    await waitForUrl(url, timeoutMs);
  } catch (error) {
    if (!isProcessGroupRunning(processHandle.pid)) {
      throw new ExternalLaunchError("启动命令已退出，服务没有成功启动。");
    }
    throw error;
  }

  return { pid: processHandle.pid, alreadyRunning: false };
}

export async function stopExternalProcess(pid: number) {
  if (!isProcessGroupRunning(pid)) return false;

  process.kill(-pid, "SIGTERM");
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (!isProcessGroupRunning(pid)) return true;
    await pause(100);
  }

  process.kill(-pid, "SIGKILL");
  return true;
}
