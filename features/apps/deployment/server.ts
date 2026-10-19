import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { getAppFactoryModelSettings } from "@/app_factory/server/database";
import { getModelConfigurationError, getModelProfile } from "@/app_factory/server/model-profiles";
import { requireRequestUser } from "@/features/auth/context";
import { audit } from "@/features/access/server";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { applicationInputSchema, createApplication, getApplication } from "../server";
import { applicationEnvironment, deploymentLog, deploymentPaths, deploymentSummary, getDeployment, isDeploymentActive, readApplicationEnvironment, recoverInterruptedDeployments } from "./repository";

export const MAX_ARCHIVE_SIZE = 100 * 1024 * 1024;
export const deploymentInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2_000).default(""),
  visibility: z.enum(["private", "internal", "all"]).default("internal"),
  instructions: z.string().max(10_000).default(""),
  environment: z.string().max(32_000).default(""),
});

async function allocatePort() {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (!address || typeof address === "string") throw new Error("无法分配应用端口");
  return address.port;
}

export async function importSourceApplication(input: z.infer<typeof deploymentInputSchema>, archive: File) {
  if (!archive.name.toLowerCase().endsWith(".zip") || !archive.size || archive.size > MAX_ARCHIVE_SIZE) throw new Error("请选择不超过 100 MB 的 ZIP 源码包");
  applicationEnvironment(input.environment);
  const user = requireRequestUser();
  const settings = getAppFactoryModelSettings();
  const modelProfileId = settings.defaultModelProfileId;
  const configurationError = getModelConfigurationError(getModelProfile(modelProfileId));
  if (configurationError) throw new Error(configurationError);
  const id = `app-${crypto.randomUUID()}`;
  const paths = deploymentPaths(id);
  try {
    await fs.mkdir(paths.root, { recursive: true, mode: 0o700 });
    await Promise.all([paths.workspace, paths.config, paths.data, paths.logs].map((directory) => fs.mkdir(directory, { mode: 0o700 })));
    await fs.writeFile(paths.archive, Buffer.from(await archive.arrayBuffer()), { mode: 0o600 });
    await fs.writeFile(paths.environment, input.environment, { mode: 0o600 });
    await promisify(execFile)("python3", [path.join(process.cwd(), "features/apps/deployment/extract_zip.py"), paths.archive, paths.workspace], { timeout: 60_000, maxBuffer: 8_000 });
    let port = await allocatePort();
    while (getAgentHubDatabase().prepare("SELECT 1 FROM external_app_deployments WHERE port=?").get(port)) port = await allocatePort();
    getAgentHubDatabase().transaction(() => {
      createApplication(applicationInputSchema.parse({ name: input.name, description: input.description, visibility: input.visibility, producer: "external", kind: "business", entryUrl: `http://127.0.0.1:${port}` }), {
        ownerId: user.id, actorId: user.id, expectedRevision: 0, applicationId: id,
      });
      const now = new Date().toISOString();
      getAgentHubDatabase().prepare(`INSERT INTO external_app_deployments
        (application_id,status,message,port,model_profile_id,thinking_level,requested_by,session_id,instructions,created_at,updated_at)
        VALUES (?,'queued','等待 AI 部署',?,?,?,?,?,?,?,?)`)
        .run(id, port, modelProfileId, settings.thinkingLevels[modelProfileId], user.id, `deploy-${crypto.randomUUID()}`, input.instructions, now, now);
      audit(user.id, "application.deploy", id);
    })();
    return getApplication(id)!;
  } catch (error) {
    await fs.rm(paths.root, { recursive: true, force: true });
    throw error;
  }
}

export async function getDeploymentDetail(id: string) {
  recoverInterruptedDeployments();
  const record = getDeployment(id);
  if (!record) return null;
  return { ...deploymentSummary(record), directory: deploymentPaths(id).root, log: await deploymentLog(id) };
}

export async function updateDeployment(id: string, input: { action: "retry" | "cancel"; environment?: string; instructions?: string }) {
  recoverInterruptedDeployments();
  const record = getDeployment(id);
  if (!record) throw new Error("源码部署记录不存在");
  const database = getAgentHubDatabase();
  if (input.action === "cancel") {
    if (!isDeploymentActive(record.status)) throw new Error("当前没有正在执行的部署任务");
    const cancelled = database.prepare("UPDATE external_app_deployments SET status='cancelled', message='任务已取消', updated_at=? WHERE application_id=? AND status IN ('queued','running')")
      .run(new Date().toISOString(), id);
    if (!cancelled.changes) throw new Error("任务状态已变化，请刷新后重试");
  } else {
    if (isDeploymentActive(record.status) || record.lease_token) throw new Error("部署任务尚在执行或停止中，请稍后再试");
    if (record.status === "ready") throw new Error("应用已经就绪，无需重复部署");
    const configurationError = getModelConfigurationError(getModelProfile(record.model_profile_id));
    if (configurationError) throw new Error(configurationError);
    const reservation = crypto.randomUUID();
    const reserved = database.prepare("UPDATE external_app_deployments SET lease_token=?, lease_expires_at=? WHERE application_id=? AND status=? AND lease_token IS NULL")
      .run(reservation, Date.now() + 30_000, id, record.status);
    if (!reserved.changes) throw new Error("任务状态已变化，请刷新后重试");
    try {
      const environment = { ...await readApplicationEnvironment(id), ...applicationEnvironment(input.environment ?? "") };
      await fs.writeFile(deploymentPaths(id).environment, Object.entries(environment).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n"), { mode: 0o600 });
      const queued = database.prepare(`UPDATE external_app_deployments SET status='queued', message='等待 AI 继续部署', error=NULL,
        missing_config='[]', requested_by=?, instructions=?, lease_token=NULL, lease_expires_at=NULL, updated_at=? WHERE application_id=? AND lease_token=?`)
        .run(requireRequestUser().id, input.instructions ?? record.instructions, new Date().toISOString(), id, reservation);
      if (!queued.changes) throw new Error("任务状态已变化，请刷新后重试");
    } catch (error) {
      database.prepare("UPDATE external_app_deployments SET lease_token=NULL, lease_expires_at=NULL WHERE application_id=? AND lease_token=?").run(id, reservation);
      throw error;
    }
  }
  audit(requireRequestUser().id, `application.deploy.${input.action}`, id);
  return getApplication(id)!;
}
