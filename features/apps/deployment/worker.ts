import fs from "node:fs/promises";
import { piHarnessRuntime } from "@/app_factory/features/pi-harness";
import { canManageApplication, getResourcePolicy } from "@/features/access/server";
import { readPrincipal } from "@/features/auth/session";
import { hasPermission } from "@/features/auth/types";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { startExternalProcess, stopExternalProcess } from "../external-launcher";
import {
  baseApplicationEnvironment, claimDeployment, deploymentPaths, finishDeployment,
  heartbeatDeployment, readApplicationEnvironment, readDeploymentRuntime, redactDeploymentText, recoverInterruptedDeployments,
  type DeploymentRecord,
} from "./repository";

function authorized(record: DeploymentRecord) {
  const user = readPrincipal(record.requested_by);
  return user && hasPermission(user, "applications.manage") && canManageApplication(user, getResourcePolicy("application", record.application_id));
}

export async function runDeploymentWorkerOnce(options: { signal?: AbortSignal } = {}) {
  if (options.signal?.aborted) return false;
  recoverInterruptedDeployments();
  const abandoned = getAgentHubDatabase().prepare("SELECT * FROM external_app_deployments WHERE status!='running' AND lease_token IS NOT NULL AND lease_expires_at < ?").all(Date.now()) as DeploymentRecord[];
  for (const record of abandoned) {
    if (record.agent_pid !== null) await stopExternalProcess(record.agent_pid);
    const app = getAgentHubDatabase().prepare("SELECT launch_pid FROM applications WHERE id=?").get(record.application_id) as { launch_pid: number | null } | undefined;
    if (app?.launch_pid) {
      await stopExternalProcess(app.launch_pid);
      getAgentHubDatabase().prepare("UPDATE applications SET launch_pid=NULL, launch_status=NULL, launch_started_at=NULL WHERE id=? AND launch_pid=?").run(record.application_id, app.launch_pid);
    }
    getAgentHubDatabase().prepare("UPDATE external_app_deployments SET lease_token=NULL, lease_expires_at=NULL, agent_pid=NULL WHERE application_id=? AND lease_token=?").run(record.application_id, record.lease_token);
  }
  const job = claimDeployment();
  if (!job) return false;
  const id = job.application_id;
  const paths = deploymentPaths(id);
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason ?? new Error("Worker 正在停止"));
  options.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error("部署已超过 20 分钟，请查看日志后重试")), 20 * 60_000);
  const heartbeat = setInterval(() => {
    try {
      if (!authorized(job) || !heartbeatDeployment(job)) controller.abort(new Error("任务已取消或部署权限已失效"));
    } catch (error) { controller.abort(error); }
  }, 1_000);
  let environment: Record<string, string> = {};
  let validationPid: number | null = null;
  const log = async (message: string) => {
    await fs.appendFile(paths.deploymentLog, `${redactDeploymentText(message, environment)}\n`, { mode: 0o600 });
  };
  try {
    if (!authorized(job)) throw new Error("用户已停用或没有部署该应用的权限");
    environment = await readApplicationEnvironment(id);
    await log(`\n[${new Date().toISOString()}] 开始部署`);
    await fs.rm(paths.runtime, { force: true });
    const prompt = [
      "使用 external-app-deploy Skill 为当前源码准备可重复启动的环境。先读取该 Skill，然后分析项目、安装依赖和执行必要构建。",
      `应用根目录：${paths.root}`,
      `平台已分配 PORT=${job.port}，APP_DATA_DIR=${paths.data}。应用环境变量已注入，不要打印密钥。`,
      `请写入 ${paths.runtime}，平台随后实际启动、检查 HTTP 就绪并停止验证进程。你不需要自行启动常驻服务。`,
      "如有缺失环境或配置，按 Skill 写入 needs_config 结果，并清楚说明需要用户提供什么。",
      job.instructions ? `用户补充说明：\n${job.instructions}` : "",
    ].filter(Boolean).join("\n");
    let failure = "";
    for await (const event of piHarnessRuntime.run(
      { id: job.session_id, projectId: id, harness: "pi", cwd: paths.workspace }, prompt,
      {
        task: "external-deployment", modelProfileId: job.model_profile_id, thinkingLevel: job.thinking_level,
        signal: controller.signal,
        onSpawn(pid) {
          getAgentHubDatabase().prepare("UPDATE external_app_deployments SET agent_pid=? WHERE application_id=? AND lease_token=?").run(pid, id, job.lease_token);
        },
        environment: { ...baseApplicationEnvironment(), NODE_ENV: "development", ...environment, PORT: String(job.port), APP_DATA_DIR: paths.data },
      },
    )) {
      controller.signal.throwIfAborted();
      await log(event.content.slice(0, 8_000));
      if (event.type === "error") failure = event.content;
    }
    controller.signal.throwIfAborted();
    if (failure) throw new Error(failure);
    const runtime = await readDeploymentRuntime(id);
    if (runtime.config.status === "needs_config") {
      finishDeployment(job, "needs_config", redactDeploymentText(runtime.config.message || "请补充运行所需配置", environment), null, runtime.config.missingConfig.map((item) => redactDeploymentText(item, environment)));
      return true;
    }
    if (!heartbeatDeployment(job) || !authorized(job)) throw new Error("部署任务已失效");
    await log("依赖准备完成，正在实际启动并检查服务就绪。");
    await startExternalProcess({
      ...runtime, url: runtime.healthUrl, signal: controller.signal, requireNewProcess: true,
      onSpawn(pid) {
        validationPid = pid;
        getAgentHubDatabase().prepare("UPDATE applications SET launch_pid=?, launch_status='starting', launch_started_at=? WHERE id=?")
          .run(pid, new Date().toISOString(), id);
      },
    });
    await stopExternalProcess(validationPid!);
    getAgentHubDatabase().prepare("UPDATE applications SET launch_pid=NULL, launch_status=NULL, launch_started_at=NULL WHERE id=? AND launch_pid=?").run(id, validationPid);
    validationPid = null;
    controller.signal.throwIfAborted();
    getAgentHubDatabase().transaction(() => {
      if (!heartbeatDeployment(job) || !authorized(job)) throw new Error("部署任务已失效");
      getAgentHubDatabase().prepare("UPDATE applications SET launch_command=?, entry_url=?, updated_at=? WHERE id=?")
        .run(runtime.command, runtime.url, new Date().toISOString(), id);
      finishDeployment(job, "ready", "环境已准备，启动验证通过，可随时启动");
    })();
    await log("启动验证通过，验证进程已停止，应用已就绪。");
  } catch (error) {
    const message = redactDeploymentText(error instanceof Error ? error.message : "部署失败", environment);
    const interrupted = options.signal?.aborted;
    finishDeployment(job, interrupted ? "interrupted" : "failed", interrupted ? "部署已中断，可重新执行" : "部署失败，请查看日志", message);
    await log(message);
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
    if (validationPid !== null) {
      await stopExternalProcess(validationPid);
      getAgentHubDatabase().prepare("UPDATE applications SET launch_pid=NULL, launch_status=NULL, launch_started_at=NULL WHERE id=? AND launch_pid=?").run(id, validationPid);
    }
    // 已取消任务保留租约直到进程回收完成，避免重试与旧任务并行。
    getAgentHubDatabase().prepare("UPDATE external_app_deployments SET lease_token=NULL, lease_expires_at=NULL, agent_pid=NULL WHERE application_id=? AND (lease_token=? OR lease_token IS NULL) AND status!='running'").run(id, job.lease_token);
  }
  return true;
}
