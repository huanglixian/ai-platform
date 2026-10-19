import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const { runDeploymentWorkerOnce } = await import("../features/apps/deployment/worker");
const controller = new AbortController();
process.once("SIGINT", () => controller.abort(new Error("Worker 正在停止")));
process.once("SIGTERM", () => controller.abort(new Error("Worker 正在停止")));

while (!controller.signal.aborted) {
  try {
    const worked = await runDeploymentWorkerOnce({ signal: controller.signal });
    if (!worked) await new Promise((resolve) => setTimeout(resolve, 800));
  } catch (error) {
    console.error("外部应用部署 Worker 执行失败", error instanceof Error ? error.message : error);
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}
