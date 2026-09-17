import { runWorker, type JobHandlers } from "../src/server/jobs/worker.ts";

// 业务 Job Handler 按需在这里注册。未声明 workerEntry 的应用不会启动此进程。
const jobHandlers: JobHandlers = {};

runWorker(jobHandlers).catch((error) => {
  console.error("Enterprise worker 无法启动", error);
  process.exitCode = 1;
});
