import fs from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { z } from "zod";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { dataPaths } from "@/lib/data-paths";
import type { DeploymentStatus, DeploymentSummary } from "../types";
import type { ModelProfileId, ThinkingLevel } from "@/app_factory/types/model";

export type DeploymentRecord = {
  application_id: string;
  status: DeploymentStatus;
  message: string;
  error: string | null;
  port: number;
  model_profile_id: ModelProfileId;
  thinking_level: ThinkingLevel;
  requested_by: string;
  session_id: string;
  instructions: string;
  missing_config: string;
  lease_token: string | null;
  lease_expires_at: number | null;
  agent_pid: number | null;
};

export const runtimeConfigSchema = z.object({
  status: z.enum(["ready", "needs_config"]),
  command: z.string().trim().min(1).max(5_000).optional(),
  workingDirectory: z.string().max(500).default("."),
  healthPath: z.string().max(500).default("/").refine((value) => value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !value.includes("#"), "健康检查地址必须是站内路径"),
  startupTimeoutSeconds: z.number().int().min(5).max(120).default(30),
  missingConfig: z.array(z.string().min(1).max(300)).max(30).default([]),
  message: z.string().max(2_000).default(""),
}).strict().superRefine((value, context) => {
  if (value.status === "ready" && !value.command) context.addIssue({ code: "custom", path: ["command"], message: "就绪配置缺少启动命令" });
  if (value.status === "needs_config" && !value.missingConfig.length) context.addIssue({ code: "custom", path: ["missingConfig"], message: "请说明缺少的配置或环境" });
});

export function deploymentPaths(id: string) {
  if (!/^app-[a-zA-Z0-9-]+$/.test(id)) throw new Error("应用 ID 无效");
  const root = path.join(dataPaths.externalApps, id);
  return {
    root,
    archive: path.join(root, "source.zip"),
    workspace: path.join(root, "workspace"),
    config: path.join(root, "config"),
    environment: path.join(root, "config", "app.env"),
    runtime: path.join(root, "config", "runtime.json"),
    data: path.join(root, "data"),
    logs: path.join(root, "logs"),
    deploymentLog: path.join(root, "logs", "deployment.log"),
    runtimeLog: path.join(root, "logs", "runtime.log"),
  };
}

export function getDeployment(id: string) {
  return getAgentHubDatabase().prepare("SELECT * FROM external_app_deployments WHERE application_id=?").get(id) as DeploymentRecord | undefined;
}

export function deploymentSummary(record: DeploymentRecord): DeploymentSummary {
  return { status: record.status, message: record.message, error: record.error, missingConfig: JSON.parse(record.missing_config) };
}

export function isDeploymentActive(status: DeploymentStatus) {
  return status === "queued" || status === "running";
}

export function recoverInterruptedDeployments() {
  getAgentHubDatabase().prepare(`UPDATE external_app_deployments SET status='interrupted',
    message='部署任务已中断，可重新执行', error='Worker 已退出或租约已过期', updated_at=?
    WHERE status='running' AND lease_expires_at < ?`).run(new Date().toISOString(), Date.now());
}

export function claimDeployment() {
  const database = getAgentHubDatabase();
  return database.transaction(() => {
    recoverInterruptedDeployments();
    const record = database.prepare("SELECT * FROM external_app_deployments WHERE status='queued' ORDER BY created_at LIMIT 1").get() as DeploymentRecord | undefined;
    if (!record) return null;
    const token = crypto.randomUUID();
    database.prepare(`UPDATE external_app_deployments SET status='running', message='AI 正在分析和准备运行环境', error=NULL,
      lease_token=?, lease_expires_at=?, updated_at=? WHERE application_id=? AND status='queued'`)
      .run(token, Date.now() + 30_000, new Date().toISOString(), record.application_id);
    return { ...record, status: "running" as const, lease_token: token };
  }).immediate();
}

export function heartbeatDeployment(record: DeploymentRecord) {
  return getAgentHubDatabase().prepare(`UPDATE external_app_deployments SET lease_expires_at=?, updated_at=?
    WHERE application_id=? AND status='running' AND lease_token=?`)
    .run(Date.now() + 30_000, new Date().toISOString(), record.application_id, record.lease_token).changes > 0;
}

export function finishDeployment(record: DeploymentRecord, status: DeploymentStatus, message: string, error: string | null = null, missingConfig: string[] = []) {
  return getAgentHubDatabase().prepare(`UPDATE external_app_deployments SET status=?, message=?, error=?, missing_config=?,
    updated_at=? WHERE application_id=? AND status='running' AND lease_token=?`)
    .run(status, message, error, JSON.stringify(missingConfig), new Date().toISOString(), record.application_id, record.lease_token).changes > 0;
}

export function applicationEnvironment(content: string) {
  const environment = Object.fromEntries(Object.entries(parseEnv(content)).filter((entry): entry is [string, string] => entry[1] !== undefined));
  for (const name of Object.keys(environment)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || /^(PATH|HOME|SHELL|TMPDIR|NODE_ENV|PORT|HOST|APP_DATA_DIR|NODE_OPTIONS|NODE_PATH|LD_.*|DYLD_.*|BASH_ENV|ENV|PI_.*|APPFACTORY_.*|AGENT_HUB_.*|NPM_CONFIG_.*|npm_config_.*)$/i.test(name)) {
      throw new Error(`不能设置平台保留的环境变量：${name}`);
    }
  }
  return environment;
}

export async function readApplicationEnvironment(id: string) {
  return applicationEnvironment(await fs.readFile(deploymentPaths(id).environment, "utf8"));
}

export function baseApplicationEnvironment(): NodeJS.ProcessEnv {
  return { NODE_ENV: "production", ...Object.fromEntries(["PATH", "HOME", "USER", "SHELL", "TMPDIR", "LANG", "LC_ALL", "SYSTEMROOT"]
    .filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]])) };
}

export async function readDeploymentRuntime(id: string) {
  const paths = deploymentPaths(id);
  const config = runtimeConfigSchema.parse(JSON.parse(await fs.readFile(paths.runtime, "utf8")));
  const workspace = await fs.realpath(paths.workspace);
  const cwd = await fs.realpath(path.resolve(workspace, config.workingDirectory));
  if (cwd !== workspace && !cwd.startsWith(`${workspace}${path.sep}`)) throw new Error("应用工作目录超出源码目录");
  if (!(await fs.stat(cwd)).isDirectory()) throw new Error("应用工作目录无效");
  const record = getDeployment(id);
  if (!record) throw new Error("部署记录不存在");
  const url = `http://127.0.0.1:${record.port}`;
  const healthUrl = new URL(config.healthPath, url);
  if (healthUrl.origin !== url) throw new Error("健康检查地址超出应用范围");
  return {
    command: config.command!, cwd, url, healthUrl: healthUrl.href,
    timeoutMs: config.startupTimeoutSeconds * 1_000,
    logPath: paths.runtimeLog,
    environment: {
      ...baseApplicationEnvironment(), ...await readApplicationEnvironment(id),
      NODE_ENV: "production" as const, PORT: String(record.port), HOST: "127.0.0.1", APP_DATA_DIR: paths.data,
    },
    config,
  };
}

export function redactDeploymentText(content: string, environment: Record<string, string>) {
  let result = content;
  for (const value of Object.values(environment).sort((a, b) => b.length - a.length)) {
    if (value.length >= 4) result = result.replaceAll(value, "[已隐藏]");
  }
  return result;
}

export async function deploymentLog(id: string) {
  const paths = deploymentPaths(id);
  const readTail = async (filePath: string) => {
    try {
      const file = await fs.open(filePath, "r");
      try {
        const { size } = await file.stat();
        const buffer = Buffer.alloc(Math.min(size, 24_000));
        await file.read(buffer, 0, buffer.length, Math.max(0, size - buffer.length));
        return buffer.toString("utf8");
      } finally { await file.close(); }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
      throw error;
    }
  };
  const [deployment, runtime] = await Promise.all([readTail(paths.deploymentLog), readTail(paths.runtimeLog)]);
  return redactDeploymentText(`${deployment}${runtime ? `\n运行日志：\n${runtime}` : ""}`, await readApplicationEnvironment(id));
}
