import { closeDatabasePool } from "../db/database.ts";
import { migrateDatabase } from "../db/migrations.ts";
import { getWorkerConfig } from "../env/runtime-config.ts";
import { logError, logInfo } from "../observability/logger.ts";
import { claimNextJob, completeJob, failJob, heartbeatJob, type AppJob } from "./queue.ts";

export type JobHandler = {
  concurrency?: number;
  handle: (context: {
    job: AppJob;
    payload: Record<string, unknown>;
    actorUserId: string | null;
  }) => Promise<Record<string, unknown> | void>;
};

export type JobHandlers = Record<string, JobHandler>;

function pause(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const complete = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", complete);
      resolve();
    };
    const timer = setTimeout(complete, milliseconds);
    signal.addEventListener("abort", complete, { once: true });
  });
}

function concurrencyByType(handlers: JobHandlers) {
  return Object.fromEntries(
    Object.entries(handlers).map(([type, handler]) => [type, handler.concurrency || 1]),
  );
}

export async function runWorker(handlers: JobHandlers) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await migrateDatabase();
    const limits = concurrencyByType(handlers);
    const configuration = getWorkerConfig();
    const workerId = `worker-${process.pid}-${crypto.randomUUID()}`;
    process.stdout.write("Enterprise worker ready\n");
    const processOne = async () => {
      const job = await claimNextJob(workerId, limits);
      if (!job) return false;
      let leaseLost = false;
      const heartbeatInterval = Math.max(100, Math.floor(configuration.lockTimeoutSeconds * 1_000 / 3));
      const heartbeat = setInterval(() => {
        void heartbeatJob(job).then((active) => {
          if (!active) leaseLost = true;
        }).catch((error) => {
          leaseLost = true;
          logError("Job 无法续租", { jobId: job.id, error });
        });
      }, heartbeatInterval);
      try {
        const handler = handlers[job.type];
        if (!handler?.handle) throw new Error(`未注册 Job Handler：${job.type}`);
        const result = await handler.handle({
          job,
          payload: job.payload,
          actorUserId: job.actorUserId,
        });
        if (leaseLost) throw new Error("Job 执行期间已失去 Worker 锁");
        await completeJob(job, result || {});
      } catch (error) {
        await failJob(job, error, configuration.retryBaseMilliseconds);
        logError("Job 执行失败", { jobId: job.id, error });
      } finally {
        clearInterval(heartbeat);
      }
      return true;
    };
    logInfo("Enterprise worker ready", { workerId });
    while (!controller.signal.aborted) {
      const processed = await Promise.all(
        Array.from({ length: configuration.concurrency }, processOne),
      );
      if (!processed.some(Boolean)) await pause(configuration.pollMilliseconds, controller.signal);
    }
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
    await closeDatabasePool();
  }
}
