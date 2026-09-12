import { nextjsRuntime } from "./nextjs";
import { staticWebRuntime } from "./static-web";
import type { AppRuntime, RuntimeId } from "./types";

const runtimes: Record<RuntimeId, AppRuntime> = {
  nextjs: nextjsRuntime,
  "static-web": staticWebRuntime,
};

export function getAppRuntime(id: string): AppRuntime {
  const runtime = runtimes[id as RuntimeId];
  if (!runtime) throw new Error(`未注册的应用运行时：${id}`);
  return runtime;
}
