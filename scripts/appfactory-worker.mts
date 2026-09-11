import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const { restorePublishedApplications, runPublicationWorkerOnce } = await import(
  "../app_factory/server/publication/worker"
);

let stopping = false;
const shutdownController = new AbortController();

function stop() {
  stopping = true;
  shutdownController.abort(new Error("Worker 正在停止"));
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  await restorePublishedApplications();
  while (!stopping) {
    const worked = await runPublicationWorkerOnce({ signal: shutdownController.signal });
    if (!worked) await wait(800);
  }
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
}
