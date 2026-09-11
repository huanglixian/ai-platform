import { spawn, type ChildProcess } from "node:child_process";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "start") {
  throw new Error("使用方式：node scripts/app.mts <dev|start>");
}

const runtimeArgs = ["--experimental-strip-types", "--import", "./scripts/typescript-runtime.mts"];
const nextArgs = mode === "dev" ? ["dev", "--port", "19844"] : ["start", "--port", "19844"];
const definitions = [
  { name: "Next.js", args: [...runtimeArgs, "./node_modules/next/dist/bin/next", ...nextArgs] },
  { name: "AppFactory Worker", args: [...runtimeArgs, "./scripts/appfactory-worker.mts"] },
];
const children: ChildProcess[] = [];
let stopping = false;
let exitCode = 0;
let forceStopTimer: NodeJS.Timeout | undefined;

function stop(signal: NodeJS.Signals) {
  if (stopping) {
    for (const child of children) child.kill("SIGKILL");
    return;
  }
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
  forceStopTimer = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  }, 5_000);
}

function finishIfStopped() {
  if (!stopping || children.some((child) => child.exitCode === null && child.signalCode === null)) return;
  if (forceStopTimer) clearTimeout(forceStopTimer);
  process.exitCode = exitCode;
}

for (const definition of definitions) {
  const child = spawn(process.execPath, definition.args, { stdio: "inherit" });
  children.push(child);
  child.once("error", (error) => {
    console.error(`[启动器] ${definition.name} 启动失败：${error.message}`);
    exitCode = 1;
    stop("SIGTERM");
    finishIfStopped();
  });
  child.once("exit", (code, signal) => {
    if (!stopping) {
      exitCode = code && code !== 0 ? code : 1;
      console.error(`[启动器] ${definition.name} 意外退出（${signal ?? `退出码 ${code ?? 0}`}）`);
      stop("SIGTERM");
    }
    finishIfStopped();
  });
}

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
